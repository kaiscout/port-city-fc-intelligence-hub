import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.join(process.cwd(), "dist");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
};
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const requested = pathname === "/" ? "index.html" : pathname.slice(1);
    const file = path.resolve(root, requested);
    if (
      !file.startsWith(`${path.resolve(root)}${path.sep}`) &&
      file !== path.join(path.resolve(root), "index.html")
    )
      throw new Error("Invalid path");
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}`;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Know what changed. Decide what happens next." })
    .waitFor();
  if ((await page.locator(".nav-item").count()) !== 9)
    throw new Error("Expected nine primary workspaces.");
  await mkdir(path.join(process.cwd(), "test-results"), { recursive: true });
  await page.screenshot({
    path: path.join(process.cwd(), "test-results", "pcfc-sites-demo-desktop.png"),
    fullPage: true,
  });
  await page.locator("#period-filter").selectOption("FY24");
  await page.getByText("FY24 · All programs", { exact: true }).waitFor();
  await page.locator("#period-filter").selectOption("FY25");
  await page.locator('[data-action="export-view"]').click();
  await page.getByText("Export prepared", { exact: true }).waitFor();

  await page.locator('[data-cash-mode="net"]').click();
  await page.getByText("Monthly net", { exact: true }).waitFor();

  await page.locator('.nav-item[data-view="finance"]').click();
  await page.getByRole("heading", { name: "Protect liquidity before approving growth." }).waitFor();

  await page.locator('.nav-item[data-view="scenarios"]').click();
  await page
    .getByRole("heading", { name: "Test the decision without pretending it is a forecast." })
    .waitFor();
  const contributionBefore = await page.locator("#scenario-contribution").textContent();
  await page.locator('[data-scenario-input="expectedAttendance"]').fill("900");
  const contributionAfter = await page.locator("#scenario-contribution").textContent();
  if (contributionBefore === contributionAfter)
    throw new Error("Scenario input did not recalculate its output.");

  await page.locator("#search-trigger").click();
  await page.locator("#palette-input").fill("commercial");
  await page.locator('.palette-result[data-view="commercial"]').click();
  await page
    .getByRole("heading", { name: "Turn reach and partnerships into repeatable revenue." })
    .waitFor();
  await page.locator("#sponsor-table-body tr").first().click();
  await page.locator("#detail-drawer.open").waitFor();
  await page.locator("#drawer-close").click();

  await page.locator("#theme-toggle").click();
  if ((await page.locator("html").getAttribute("data-theme")) !== "dark")
    throw new Error("Theme preference did not apply.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#mobile-menu").click();
  await page.locator("#app-rail.open").waitFor();
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (hasOverflow) throw new Error("Mobile layout introduces horizontal overflow.");

  await page.screenshot({
    path: path.join(process.cwd(), "test-results", "pcfc-sites-demo-mobile.png"),
    fullPage: true,
  });
  if (runtimeErrors.length) throw new Error(`Browser runtime errors:\n${runtimeErrors.join("\n")}`);

  console.log(
    JSON.stringify(
      { status: "PASS", workspaces: 9, interactions: 9, responsiveWidth: 390, url },
      null,
      2,
    ),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
