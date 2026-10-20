import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { setTimeout as delay } from "node:timers/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

const root = path.resolve("dist");
const sandbox = { window: {} };
vm.runInNewContext(await readFile(path.join(root, "data.js"), "utf8"), sandbox);
const data = JSON.parse(JSON.stringify(sandbox.window.PCFC_DATA));
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const file = path.resolve(root, pathname === "/" ? "index.html" : pathname.slice(1));
    if (!file.startsWith(root + path.sep)) throw new Error("Invalid path");
    const mime = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
    };
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end("Not found");
  }
});
const liveUrl = process.env.PCFC_VERIFY_URL;
if (liveUrl && new URL(liveUrl).origin !== "https://pcfc.denizci.dev")
  throw new Error("Live verification is restricted to the approved public domain.");
if (!liveUrl) await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = liveUrl || "http://127.0.0.1:" + server.address().port;
let browser;
const checks = [];
const mark = (name) => checks.push({ name, status: "PASS" });
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
function csvParse(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
function section(rows, title) {
  const index = rows.findIndex((row) => row[0] === title);
  assert.ok(index >= 0, "Missing CSV section: " + title);
  const result = [];
  for (let i = index + 2; i < rows.length && rows[i].some((value) => value !== ""); i++)
    result.push(rows[i]);
  return result;
}
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    window.print = () => {};
  });
  let page = await context.newPage();
  const errors = [];
  const warnings = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  const response = await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  if (liveUrl) {
    for (const file of [
      "index.html",
      "styles.css",
      "app.js",
      "model.js",
      "scenario-visuals.js",
      "lab.css",
      "data.js",
      "assets/pcfc-logo.png",
    ]) {
      const result = await context.request.get(new URL(file, url).href);
      assert.equal(result.status(), 200, file + " live HTTP response");
      const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
      assert.equal(
        hash(await result.body()),
        hash(await readFile(path.join(root, file))),
        file + " live bytes",
      );
      mark(file + ": live HTTPS bytes match the approved release");
    }
    assert.equal(await page.evaluate(() => window.PCFC_DATA.meta.release), data.meta.release);
  }
  await mkdir("test-results", { recursive: true });
  const navigate = async (view) => {
    await page.locator('.nav-item[data-view="' + view + '"]').click();
    await page.locator("h1").waitFor();
  };
  const metric = async (label) =>
    page.locator('[data-metric="' + label + '"] .metric-value').innerText();
  let lastDownloadAt = 0;
  let downloadCount = 0;
  const download = async (action) => {
    // Preserve the real-download assertions without a burst-download stress test.
    await delay(Math.max(0, 250 - (performance.now() - lastDownloadAt)));
    lastDownloadAt = performance.now();
    downloadCount++;
    const pending = page.waitForEvent("download");
    await page
      .locator('[data-action="' + action + '"]')
      .first()
      .click();
    const item = await pending.catch((error) => {
      throw new Error(
        `Download ${downloadCount} (${action}) failed; browser warnings: ${warnings.join("; ")}`,
        { cause: error },
      );
    });
    const text = await readFile(await item.path(), "utf8");
    const rows = csvParse(text);
    assert.equal(rows[0][0], "Evidence class");
    assert.ok(rows[0][1].includes("not PCFC actuals"));
    assert.equal(rows.find((row) => row[0] === "Project")?.[1], data.meta.product);
    assert.ok(rows.length > 9);
    return rows;
  };
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
  for (const period of ["FY24", "FY25"]) {
    await navigate("command");
    await page.locator("#period-filter").selectOption(period);
    for (const program of ["All", "Men", "Women"]) {
      await navigate("command");
      await page.locator("#program-filter").selectOption(program);
      for (const view of views) {
        await navigate(view);
        assert.equal(await page.locator("h1").count(), 1);
        assert.ok((await page.title()).endsWith(" | " + data.meta.product));
        assert.ok(
          (await page.locator(".brand-lockup").innerText()).includes(
            "Business Intelligence & Analytics",
          ),
        );
        assert.equal(
          await page.locator("#period-filter").isDisabled(),
          !["command", "finance"].includes(view),
        );
        assert.equal(
          await page.locator("#program-filter").isDisabled(),
          !["command", "commercial", "matchday", "programs"].includes(view),
        );
        const body = await page.locator("#workspace").innerText();
        assert.ok(/synthetic demonstration/i.test(body));
        assert.ok(!/\bLIVE\b|DATA TRUST: VERIFIED|82%|Contribution index|Return index/.test(body));
        assert.ok(!/NaN|Infinity|undefined/.test(body));
        const rows = await download("export-view");
        if (view === "command" || view === "finance") {
          const expected = period === "FY24" ? [63200, 60950, 2250] : [67500, 63700, 3800];
          const annual = section(rows, "Annual synthetic cash totals · club-wide")[0];
          assert.deepEqual(annual.slice(1, 4).map(Number), expected);
          assert.equal(await metric("Net cash movement"), money(expected[2]));
          if (period === "FY24") {
            assert.ok(body.includes("annual") || body.includes("Annual"));
            assert.equal(await page.locator(".chart-svg").count(), 0);
            assert.equal(
              section(rows, "Synthetic cash categories · selected fiscal period").length,
              0,
            );
          } else {
            const months = section(rows, "Monthly synthetic cash · selected fiscal period");
            assert.equal(months.length, 12);
            assert.equal(
              months.reduce((sum, row) => sum + Number(row[2]), 0),
              67500,
            );
            assert.equal(
              months.reduce((sum, row) => sum + Number(row[3]), 0),
              63700,
            );
            assert.equal(
              months.reduce((sum, row) => sum + Number(row[4]), 0),
              3800,
            );
          }
        }
        if (view === "commercial") {
          const expected = data.sponsors.filter(
            (row) => program === "All" || row.program === program || row.program === "Club-wide",
          );
          assert.equal(await page.locator("#sponsor-table-body tr").count(), expected.length);
          const exported = section(rows, "Visible synthetic sponsor accounts");
          assert.equal(exported.length, expected.length);
          assert.equal(
            exported.reduce((sum, row) => sum + Number(row[5]), 0),
            expected.reduce((sum, row) => sum + row.contractValue, 0),
          );
          assert.equal(
            await metric("Sample contract face value"),
            money(expected.reduce((sum, row) => sum + row.contractValue, 0)),
          );
        }
        if (view === "programs" || view === "matchday") {
          const expected = data.fixtures.filter(
            (row) => program === "All" || row.program === program,
          );
          assert.equal(section(rows, "Synthetic fixture records").length, expected.length);
          if (view === "programs") {
            assert.equal(
              await page.locator("#program-comparison tbody tr").count(),
              program === "All" ? 2 : 1,
            );
            assert.equal(await page.locator("[data-fixture]").count(), expected.length);
          }
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          ),
          false,
        );
        mark(view + "/" + period + "/" + program + " calculations, scope, export and layout");
      }
    }
  }
  await navigate("command");
  await page.locator("#period-filter").selectOption("FY25");
  await page.locator("#program-filter").selectOption("All");
  await page.locator('[data-cash-mode="net"]').click();
  const negatives = await page
    .locator('circle[data-chart-series="Monthly net"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("data-value"))).filter((value) => value < 0),
    );
  assert.deepEqual(negatives, [-100, -900, -700, -2600, -1500, -2600, -2400]);
  const ys = await page
    .locator('circle[data-chart-series="Monthly net"]')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("cy"))));
  assert.ok(ys.every((value) => value >= 18 && value <= 220));
  mark("Negative monthly cash points remain inside the plotted axes");
  await page.locator('[data-cash-mode="flow"]').click();
  await page.waitForFunction(() => !document.querySelector(".toast"));
  await page.screenshot({ path: "test-results/pcfc-sites-demo-desktop.png", fullPage: true });

  await page.locator("#program-filter").selectOption("Women");
  await navigate("commercial");
  await page.locator("#sponsor-search").fill("Harborline");
  assert.equal(await page.locator("#sponsor-table-body tr").count(), 0);
  assert.equal(await metric("Delivery completion"), "Not available");
  assert.equal(
    section(await download("export-sponsors"), "Visible synthetic sponsor accounts").length,
    0,
  );
  await page.locator("#sponsor-search").fill("Bluewater");
  assert.equal(await page.locator("#sponsor-table-body tr").count(), 1);
  assert.equal(await metric("Sample contract face value"), "$31,000");
  assert.equal(
    section(await download("export-view"), "Visible synthetic sponsor accounts")[0][0],
    "SP-003",
  );
  await page.locator("#sponsor-search").fill("");
  await page.locator("#sponsor-sort").selectOption("value");
  assert.ok(
    (await page.locator("#sponsor-table-body tr").first().innerText()).includes("Cape Fear"),
  );
  await page.locator("#sponsor-sort").selectOption("delivery");
  assert.ok(
    (await page.locator("#sponsor-table-body tr").first().innerText()).includes("Dockside"),
  );
  await page.locator("#sponsor-table-body tr").first().click();
  assert.ok((await page.locator("#drawer-body").innerText()).includes("Synthetic account"));
  await page.locator("#drawer-close").click();
  const channels = section(await download("export-channels"), "Club-wide synthetic channels");
  assert.equal(
    channels.reduce((sum, row) => sum + Number(row[1]), 0),
    28400,
  );
  assert.equal(
    channels.reduce((sum, row) => sum + Number(row[2]), 0),
    3214,
  );
  mark("Search, program, sort, drill-down and downloaded sponsor/channel data agree");

  await navigate("decisions");
  await page.locator('[data-decision-filter="High"]').click();
  assert.equal(await page.locator(".decision-card").count(), 2);
  assert.equal(
    section(await download("export-view"), "Proposed decisions · approval pending").length,
    2,
  );
  await page.locator('[data-decision-filter="All"]').click();
  mark("Priority filter matches decision export");

  await navigate("scenarios");
  const independent = (input) => {
    const attendance = Math.min(input.expectedAttendance, input.venueCapacity);
    const variable =
      (attendance * (1 - input.complimentaryPct / 100) * input.ticketPrice +
        ((attendance * input.concessionParticipationPct) / 100) * input.averageConcessionSpend +
        ((attendance * input.merchandiseParticipationPct) / 100) * input.averageMerchandiseSpend) *
      input.homeMatches;
    const revenue =
      variable +
      input.sponsorIncome * (input.sponsorFrequency === "Per fixture" ? input.homeMatches : 1);
    const fixed =
      [
        "marketingSpend",
        "staffing",
        "security",
        "officials",
        "venueCosts",
        "transportation",
        "equipment",
      ].reduce((sum, key) => sum + input[key], 0) * input.homeMatches;
    const costs = fixed + attendance * input.variableCostPerAttendee * input.homeMatches;
    const reserve = (variable * (input.weatherRiskPct + input.operationalRiskPct)) / 100;
    return {
      revenue,
      contribution: revenue - costs - (revenue * input.communityAllocationPct) / 100 - reserve,
      reserve,
    };
  };
  const verifyScenario = async () => {
    const inputs = await page
      .locator("[data-scenario-input]")
      .evaluateAll((nodes) =>
        Object.fromEntries(nodes.map((node) => [node.dataset.scenarioInput, Number(node.value)])),
      );
    const expected = independent({
      ...inputs,
      sponsorFrequency: await page.locator("#scenario-sponsor-frequency").inputValue(),
    });
    assert.equal(await page.locator("#scenario-revenue").innerText(), money(expected.revenue));
    assert.equal(
      await page.locator("#scenario-contribution").innerText(),
      money(expected.contribution),
    );
    assert.equal(await page.locator("#scenario-risk").innerText(), money(expected.reserve));
    const rows = await download("export-scenario");
    const exportedInputs = Object.fromEntries(
      section(rows, "Scenario inputs · costs per fixture; sponsorship at its stated frequency"),
    );
    for (const [key, value] of Object.entries(inputs))
      assert.equal(Number(exportedInputs[key]), value);
    const outputs = Object.fromEntries(section(rows, "Calculated scoped planning outputs"));
    assert.ok(Math.abs(Number(outputs.contribution) - expected.contribution) < 1e-7);
  };
  for (const preset of data.scenarioPresets) {
    await page.locator('[data-preset="' + preset.id + '"]').click();
    await verifyScenario();
    const controlValues = await page
      .locator("[data-scenario-input]")
      .evaluateAll((nodes) =>
        Object.fromEntries(nodes.map((node) => [node.dataset.scenarioInput, Number(node.value)])),
      );
    for (const [key, value] of Object.entries(controlValues)) assert.equal(value, preset[key]);
    mark(preset.name + " preset: visible inputs and independent equation match export");
  }
  await page.locator("#scenario-program").selectOption("Men");
  assert.equal(await page.locator("[data-preset].active").count(), 0);
  const programExport = section(
    await download("export-scenario"),
    "Scenario inputs · costs per fixture; sponsorship at its stated frequency",
  );
  assert.equal(programExport.find((row) => row[0] === "program")[1], "Men");
  assert.equal(programExport.find((row) => row[0] === "id")[1], "custom");
  mark("Scenario program change updates scope, export and preset state");
  await page.locator('[data-preset="baseline"]').click();
  await page.locator('[data-scenario-input="homeMatches"]').fill("2");
  await page.locator('[data-scenario-input="homeMatches"]').dispatchEvent("input");
  await page
    .locator("details.assumption-details > summary")
    .filter({ hasText: /^Sponsorship$/ })
    .click();
  for (const frequency of ["Per season", "Per fixture"]) {
    await page.locator("#scenario-sponsor-frequency").selectOption(frequency);
    await verifyScenario();
  }
  mark("Sponsorship allocation frequency changes the independently calculated scoped result");
  await page.locator('[data-preset="baseline"]').click();
  await page
    .locator("details.assumption-details")
    .evaluateAll((nodes) => nodes.forEach((node) => (node.open = true)));
  const inputKeys = await page
    .locator("[data-scenario-input]")
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.scenarioInput));
  for (const key of inputKeys) {
    const locator = page.locator('[data-scenario-input="' + key + '"]');
    const value = await locator.inputValue();
    const step = Number(await locator.getAttribute("step"));
    const maximum = Number(await locator.getAttribute("max"));
    await locator.fill(String(Math.min(maximum, Math.round((Number(value) + step) * 100) / 100)));
    await verifyScenario();
    mark("Scenario driver " + key + ": equation, visible input and export");
  }
  await page.locator('[data-action="reset-scenario"]').click();
  await page.locator('[data-scenario-input="expectedAttendance"]').fill("8000");
  const capped = await page.locator("#scenario-revenue").innerText();
  await page.locator('[data-scenario-input="expectedAttendance"]').fill("6000");
  assert.equal(await page.locator("#scenario-revenue").innerText(), capped);
  await page.locator('[data-scenario-input="expectedAttendance"]').fill("0");
  assert.ok((await page.locator("#scenario-contribution").innerText()).startsWith("-"));
  await page.locator(".lab-method > summary").click();
  assert.ok((await page.locator(".waterfall-column.total b").innerText()).startsWith("-"));
  await verifyScenario();
  mark("Capacity cap applies to all receipts; negative contribution retains its sign");

  await navigate("quality");
  const controls = await download("export-quality");
  assert.equal(
    section(controls, "Pipeline manifest checks").length,
    data.reconciliation.checks.length,
  );
  assert.equal(section(controls, "Hub model checks").length, data.modelChecks.length);
  await navigate("access");
  const policy = section(
    await download("export-view"),
    "Full application policy reference · not public-site authentication",
  );
  assert.ok(policy.some((row) => row[0] === "COMMERCIAL" && row[1] === "sponsors:read"));
  assert.ok(!policy.some((row) => row[0] === "COMMERCIAL" && row[1] === "scenarios:read"));
  mark("Evidence export and full-application policy reference match their source records");

  await page.locator("#search-trigger").click();
  await page.locator("#palette-input").fill("commercial");
  await page.locator('.palette-result[data-view="commercial"]').click();
  await page.locator("#evidence-button").click();
  assert.ok(
    (await page.locator("#drawer-body").innerText()).includes("FY24 contains annual totals only"),
  );
  await page.keyboard.press("Escape");
  await page.locator("#theme-toggle").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.locator("#theme-toggle").click();
  await navigate("command");
  await page.locator('[data-action="presentation-brief"]').first().click();
  assert.ok((await page.locator("#drawer-body").innerText()).includes("approval"));
  await page.locator('[data-action="print-owner-brief"]').click();
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("#presentation-print").isVisible(), true);
  assert.equal(await page.locator(".app-shell").isVisible(), false);
  const printType = await page
    .locator("#presentation-print p")
    .first()
    .evaluate((node) => ({
      color: getComputedStyle(node).color,
      size: parseFloat(getComputedStyle(node).fontSize),
    }));
  assert.equal(printType.color, "rgb(17, 17, 17)");
  assert.ok(printType.size >= 14);
  await page.screenshot({ path: "test-results/pcfc-owner-brief-print.png", fullPage: true });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.locator("#drawer-close").click();
  mark("Command navigation, evidence boundary, themes and printable owner briefing");

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  page = await mobileContext.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  assert.equal((await page.goto(url, { waitUntil: "networkidle" })).status(), 200);
  for (const view of views) {
    await page.locator("#mobile-menu").click();
    await page.locator('.nav-item[data-view="' + view + '"]').click();
    assert.equal(await page.locator("#period-filter").isVisible(), view !== "scenarios");
    assert.equal(await page.locator("#program-filter").isVisible(), view !== "scenarios");
    await download("export-view");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
      false,
    );
    mark(view + ": 390px touch-mobile navigation, export, accessible filters and no page overflow");
  }
  await page.locator("#mobile-menu").click();
  await page.locator('.nav-item[data-view="command"]').click();
  await page.waitForFunction(() => !document.querySelector(".toast"));
  await page.screenshot({ path: "test-results/pcfc-sites-demo-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/hub-browser-verification.json",
    JSON.stringify(
      {
        status: "PASS",
        url,
        checkedAt: new Date().toISOString(),
        checks: checks.length,
        tests: checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        browserChecks: checks.length,
        filterExportMatrix: 54,
        mobileViews: 9,
        consoleErrors: errors.length,
      },
      null,
      2,
    ),
  );
} finally {
  if (browser) await browser.close();
  if (server.listening)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
}
