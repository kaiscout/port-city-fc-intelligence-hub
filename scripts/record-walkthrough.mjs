import { createReadStream } from "node:fs";
import { stat, copyFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";

import { chromium } from "@playwright/test";

const root = process.cwd();
const output = path.join(root, "walkthrough", "port-city-fc-intelligence-hub-walkthrough.webm");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".png", "image/png"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const relative =
    url.pathname === "/" ? "walkthrough/record-walkthrough.html" : url.pathname.slice(1);
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await stat(filename);
    if (!file.isFile()) throw new Error("Not a file");
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? "");
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), file.size - 1) : file.size - 1;
    if (start > end || start >= file.size) {
      response.writeHead(416).end();
      return;
    }
    response.writeHead(range ? 206 : 200, {
      "Content-Type": mimeTypes.get(path.extname(filename)) ?? "application/octet-stream",
      "Content-Length": end - start + 1,
      "Accept-Ranges": "bytes",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${file.size}` } : {}),
    });
    createReadStream(filename, { start, end }).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to start recorder server");

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: ["--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Record walkthrough" }).waitFor({ state: "visible" });
  if (process.env.WALKTHROUGH_DIAGNOSTIC === "true") {
    await page.getByRole("button", { name: "Record walkthrough" }).click();
    await page.waitForFunction(() => document.title === "Recording", null, { timeout: 30_000 });
    await page.waitForTimeout(1500);
    console.log(
      JSON.stringify({
        errors,
        state: await page.evaluate(() => {
          const element = document.querySelector("audio");
          return {
            title: document.title,
            time: element.currentTime,
            duration: element.duration,
            paused: element.paused,
            ready: element.readyState,
            rate: element.playbackRate,
            error: element.error?.message,
          };
        }),
      }),
    );
  } else {
    const pageFailure = new Promise((_resolve, reject) => page.once("pageerror", reject));
    const [download] = await Promise.all([
      Promise.race([page.waitForEvent("download", { timeout: 300_000 }), pageFailure]),
      page.getByRole("button", { name: "Record walkthrough" }).click(),
    ]);
    await download.saveAs(output);
    if (process.env.FFMPEG_PATH) {
      const indexed = output.replace(/\.webm$/, ".indexed.webm");
      execFileSync(process.env.FFMPEG_PATH, ["-y", "-i", output, "-c", "copy", indexed], {
        windowsHide: true,
        stdio: "pipe",
      });
      await copyFile(indexed, output);
      await rm(indexed);
    }
    console.log(JSON.stringify({ output, status: "PASS" }));
  }
} finally {
  await browser.close();
  server.close();
}
