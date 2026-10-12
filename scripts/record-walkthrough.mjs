import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import { chromium } from "@playwright/test";

const root = process.cwd();
const output = path.join(root, "walkthrough", "port-city-fc-intelligence-hub-walkthrough.webm");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".png", "image/png"],
  [".wav", "audio/wav"],
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
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filename)) ?? "application/octet-stream",
    });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to start recorder server");

const browser = await chromium.launch({
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Record walkthrough" }).waitFor({ state: "visible" });
  const downloadPromise = page.waitForEvent("download", { timeout: 300_000 });
  await page.getByRole("button", { name: "Record walkthrough" }).click();
  const download = await downloadPromise;
  await download.saveAs(output);
  console.log(JSON.stringify({ output, status: "PASS" }));
} finally {
  await browser.close();
  server.close();
}
