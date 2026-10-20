import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

const file = "walkthrough/port-city-fc-intelligence-hub-walkthrough.webm";
const size = (await stat(file)).size;
assert.ok(size > 100_000, "Recorded video must exist");
const server = createServer((request, response) => {
  if (request.url === "/") {
    response
      .writeHead(200, { "Content-Type": "text/html" })
      .end(
        '<body style="margin:0;background:#071e2b"><video muted controls style="width:1280px;height:720px" src="/video.webm"></video></body>',
      );
    return;
  }
  if (request.url !== "/video.webm") {
    response.writeHead(404).end();
    return;
  }
  const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? "");
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start > end || start >= size) {
    response.writeHead(416).end();
    return;
  }
  response.writeHead(range ? 206 : 200, {
    "Content-Type": "video/webm",
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
  });
  createReadStream(file, { start, end }).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch(
  process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {},
);
try {
  await mkdir("test-results", { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector("video").readyState >= 2);
  const metadata = await page
    .locator("video")
    .evaluate((v) => ({ duration: v.duration, width: v.videoWidth, height: v.videoHeight }));
  assert.ok(Math.abs(metadata.duration - 180) < 2, "Three-minute indexed duration required");
  assert.equal(metadata.width, 1280);
  assert.equal(metadata.height, 720);
  const audio = await page.evaluate(async () => {
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(
        await (await fetch("/video.webm")).arrayBuffer(),
      );
      const samples = decoded.getChannelData(0);
      const count = Math.min(samples.length, decoded.sampleRate * 10);
      let energy = 0;
      for (let i = 0; i < count; i++) energy += samples[i] ** 2;
      return {
        audioRms: Math.sqrt(energy / count),
        audioDuration: decoded.duration,
        audioChannels: decoded.numberOfChannels,
      };
    } finally {
      await context.close();
    }
  });
  assert.ok(audio.audioRms > 0.00001, "Decoded narration must not be silent");
  assert.ok(
    Math.abs(audio.audioDuration - 180) < 3,
    "Narration must cover the three-minute timeline",
  );
  await page.locator("video").evaluate(async (v) => {
    await v.play();
  });
  await page.waitForFunction(() => document.querySelector("video").currentTime > 1);
  await page.locator("video").evaluate((v) => v.pause());
  for (const second of [5, 65, 105, 145]) {
    await page.locator("video").evaluate(
      (v, time) =>
        new Promise((resolve) => {
          v.addEventListener("seeked", resolve, { once: true });
          v.currentTime = time;
        }),
      second,
    );
    await page.screenshot({ path: `test-results/walkthrough-${second}s.png` });
  }
  const report = {
    status: "PASS",
    ...metadata,
    ...audio,
    audioDecodeEngine: "Chromium Web Audio",
    bytes: size,
    sha256: createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
    decodedAudioSeconds: 10,
    seekScreenshots: [5, 65, 105, 145],
    checkedAt: new Date().toISOString(),
  };
  await writeFile(
    "test-results/walkthrough-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
  server.close();
}
