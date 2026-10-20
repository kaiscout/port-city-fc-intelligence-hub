import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const directory = path.resolve("dist");
const out = path.resolve(process.env.PCFC_POLISH_OUTPUT ?? "test-results/polish");
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const p = new URL(req.url, "http://127.0.0.1").pathname;
    const file = path.resolve(directory, p === "/" ? "index.html" : p.slice(1));
    assert.ok(file.startsWith(directory + path.sep));
    res.setHeader(
      "Content-Type",
      { ".css": "text/css", ".js": "text/javascript", ".html": "text/html", ".png": "image/png" }[
        path.extname(file)
      ] ?? "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const errors = [],
  checks = [];
const mark = (name) => checks.push({ name, status: "PASS" });
const views = [
  "command",
  "finance",
  "commercial",
  "matchday",
  "programs",
  "scenarios",
  "decisions",
  "quality",
  "access",
];
try {
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (e) => errors.push(e.message));
    for (const theme of ["dark", "light"]) {
      await page.goto(url + "/#command");
      await page.evaluate((theme) => localStorage.setItem("pcfc-theme-v2", theme), theme);
      await page.reload();
      for (const view of views) {
        await page.evaluate((view) => {
          location.hash = view;
        }, view);
        await page.waitForFunction((view) => document.body.dataset.view === view, view);
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
          `${view}/${width}/${theme} overflow`,
        );
        assert.ok(!(await page.locator("#workspace").innerText()).match(/NaN|Infinity|undefined/));
        assert.ok(!(await page.locator(".brand-lockup").innerText()).includes("//"));
        if (width > 760) {
          const offsets = await page.locator(".nav-item").evaluateAll((items) =>
            items.map((item) => {
              const a = item.querySelector("svg").getBoundingClientRect(),
                b = item.getBoundingClientRect();
              return Math.abs(a.y + a.height / 2 - b.y - b.height / 2);
            }),
          );
          assert.ok(
            offsets.every((n) => n < 2),
            "Navigation icon alignment",
          );
        }
      }
      mark(
        `${width}×${height}/${theme}: nine workspaces, navigation alignment, no overflow or invalid values`,
      );
      await page.evaluate(() => (location.hash = "scenarios"));
      await page.locator("#scenario-live-chart svg").waitFor();
      const plotBox = await page.locator("#scenario-live-chart svg").boundingBox();
      assert.ok(
        plotBox.y >= 0 && plotBox.y + plotBox.height <= height,
        `Initial graph visible at ${width}/${theme}: ${JSON.stringify(plotBox)}`,
      );
      await page.screenshot({ path: path.join(out, `scenario-${width}-${theme}.png`) });
      await page.locator('[data-scenario-input="ticketPrice"]').fill("21");
      assert.equal(await page.locator('[data-scenario-range="ticketPrice"]').inputValue(), "21");
      assert.equal(
        await page
          .locator('[data-scenario-input="ticketPrice"]')
          .evaluate((el) => document.activeElement === el),
        true,
      );
      await page.locator('[data-scenario-range="ticketPrice"]').evaluate((el) => {
        for (let n = 22; n <= 26; n++) {
          el.value = String(n);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      assert.equal(await page.locator('[data-scenario-input="ticketPrice"]').inputValue(), "26");
      assert.equal(await page.locator("#scenario-contribution").innerText(), "$23,502");
      await page.locator('[data-scenario-input="homeMatches"]').fill("2");
      assert.ok(
        (await page.locator('[data-node="current-legend"]').innerText()).includes("2 home matches"),
      );
      assert.ok(
        (await page.locator('[data-node="reference-legend"]').innerText()).includes("1 home match"),
      );
      await page.locator('[data-scenario-input="homeMatches"]').fill("1");
      await page.locator('[data-scenario-input="complimentaryPct"]').fill("25");
      assert.ok(
        (await page.locator("#free-entry-explanation").innerText()).includes(
          "420 guests enter free; 1,260 pay",
        ),
      );
      await page
        .locator("details.assumption-details")
        .evaluateAll((nodes) => nodes.forEach((n) => (n.open = true)));
      await page.locator('[data-scenario-input="equipment"]').scrollIntoViewIfNeeded();
      const sticky = await page.locator("#scenario-live-chart svg").boundingBox();
      assert.ok(
        sticky.y >= -1 && sticky.y + sticky.height <= height,
        `Graph stays visible at ${width}/${theme}: ${JSON.stringify(sticky)}`,
      );
      const control = page.locator('[data-scenario-input="equipment"]');
      await control.fill("1500");
      assert.equal(await control.evaluate((el) => document.activeElement === el), true);
      if (width > 760) {
        const inspect = page.getByRole("slider", { name: "Explore chart attendance" });
        await inspect.focus();
        await inspect.press("ArrowRight");
        assert.ok((await page.locator('[data-node="inspect-value"]').innerText()).includes("fans"));
      }
      await page.locator('[data-scenario-input="ticketPrice"]').fill("");
      assert.equal(await page.locator('[data-action="export-scenario"]').isDisabled(), true);
      assert.ok(
        (await page.locator("#lab-input-status").innerText()).includes("last valid result"),
      );
      await page.locator('[data-scenario-input="ticketPrice"]').fill("19");
      assert.equal(await page.locator('[data-action="export-scenario"]').isDisabled(), false);
      if (width === 390) {
        await page.locator('[data-action="expand-chart"]').click();
        assert.equal(
          await page.locator('[data-action="expand-chart"]').getAttribute("aria-expanded"),
          "true",
        );
        await page.getByRole("slider", { name: "Explore chart attendance" }).fill("1000");
        assert.ok(
          (await page.locator('[data-node="inspect-value"]').innerText()).includes("1,000 fans"),
        );
        await page.locator('[data-action="expand-chart"]').click();
      }
      mark(
        `${width}×${height}/${theme}: visible sticky graph, numeric/slider sync, rapid input, free-entry explanation, validation and inspection`,
      );
      await page.locator('[data-preset="baseline"]').click();
      await page
        .locator("details.assumption-details")
        .evaluateAll((nodes) => nodes.forEach((n) => (n.open = true)));
      await page.locator('[data-scenario-input="sponsorIncome"]').fill("50000");
      await page.locator('[data-scenario-input="variableCostPerAttendee"]').fill("20");
      await page.locator('[data-scenario-input="weatherRiskPct"]').fill("50");
      await page.locator('[data-scenario-input="operationalRiskPct"]').fill("50");
      assert.ok((await page.locator("#scenario-callout").innerText()).includes("does not improve"));
      assert.ok(
        (await page.locator('[data-node="threshold-label"]').textContent()).includes(
          "Loss boundary",
        ),
      );
      assert.equal(
        await page.locator('[data-node="marker"]').evaluate((el) =>
          getComputedStyle(el)
            .transitionDuration.split(",")
            .every((v) => parseFloat(v) === 0),
        ),
        true,
      );
      mark(
        `${width}×${height}/${theme}: declining contribution and reduced motion remain explicit`,
      );
      await page.evaluate(() => (location.hash = "command"));
      await page.locator('[data-metric="Net cash movement"]').waitFor();
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: path.join(out, `command-${width}-${theme}.png`),
          fullPage: true,
        });
    }
    await context.close();
  }
  const animated = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const animatedPage = await animated.newPage();
  await animatedPage.goto(url + "/#scenarios");
  const ticketSlider = animatedPage.locator('[data-scenario-range="ticketPrice"]');
  await ticketSlider.focus();
  await ticketSlider.press("ArrowRight");
  assert.equal(await animatedPage.locator("#scenario-contribution").innerText(), "$16,244");
  assert.equal(
    await animatedPage.locator('[data-node="marker"]').evaluate((el) =>
      getComputedStyle(el)
        .transitionDuration.split(",")
        .some((v) => parseFloat(v) > 0),
    ),
    true,
  );
  assert.equal(await ticketSlider.evaluate((el) => document.activeElement === el), true);
  await animated.close();
  mark("Normal motion: marker transitions and keyboard slider updates remain responsive");
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(out, "verification.json"),
    JSON.stringify(
      { status: "PASS", checkedAt: new Date().toISOString(), checks, consoleErrors: errors },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      status: "PASS",
      checks: checks.length,
      workspaces: 9,
      viewports: 4,
      themes: 2,
      consoleErrors: errors.length,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
