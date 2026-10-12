import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (!process.env.E2E_DATABASE_URL) return;
  const response = await page.request.post("/api/auth/login", {
    data: { email: "admin@pcfc-demo.local", password: "PilotDemo!2026" },
  });
  expect(response.ok()).toBe(true);
});

test("executive workflow exposes decision context and responsive navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", {
      name: "Reconciled cash model first; forecasting only after approval.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Privacy-safe portfolio boundary")).toBeVisible();
  await expect(page.getByText("Field-cost aggregates")).toBeVisible();
  await expect(page.getByText("Planning boundary")).toBeVisible();
  await expect(page.getByText("Fixture forecast", { exact: true })).toBeVisible();
  if (testInfo.project.name === "desktop")
    await page.screenshot({ path: "public/screenshots/dashboard-desktop.png", fullPage: true });
});

test("scenario workflow is read-only publicly and persists when PostgreSQL is configured", async ({
  page,
}) => {
  await page.goto("/scenarios");
  await expect(page.getByText("Illustrative sandbox—not an approved PCFC forecast")).toBeVisible();
  if (!process.env.E2E_DATABASE_URL) {
    await expect(page.getByText("Read-only portfolio mode")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save scenario" })).toBeDisabled();
    return;
  }
  await page.getByLabel("Scenario name").fill("Recruiter walkthrough scenario");
  await page.getByLabel("Expected attendance").fill("2100");
  await page.getByRole("button", { name: "Save scenario" }).click();
  await expect(
    page.getByText("Scenario saved to PostgreSQL and recorded in the audit log."),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Saved matchday scenario")
      .getByRole("button", { name: "Recruiter walkthrough scenario", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export comparison" }).click();
  await expect(await download).toBeTruthy();
});

test("operations user sees validation errors before import commit", async ({ page }) => {
  await page.goto("/operations");
  await page.getByRole("button", { name: /Preview 2 rows/ }).click();
  await expect(page.getByText("Duplicate record within this import batch")).toBeVisible();
  await expect(page.getByRole("button", { name: /Commit 1 valid row/ })).toBeEnabled();
});

test("commercial workflow explains sponsor risk and prints", async ({ page }) => {
  await page.goto("/sponsors");
  await page.getByRole("button", { name: /Dockside Legal Group/ }).click();
  await expect(page.getByText("High renewal risk")).toBeVisible();
  await expect(page.getByText(/Only 50% of deliverables/)).toBeVisible();
});

test("all primary pages have one main heading and no horizontal viewport overflow", async ({
  page,
}) => {
  for (const path of [
    "/dashboard",
    "/ownership",
    "/scenarios",
    "/attendance",
    "/sponsors",
    "/programs",
    "/community",
    "/operations",
    "/reports",
    "/case-study",
    "/settings",
    "/help",
    "/about",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, `${path} should not overflow horizontally`).toBe(false);
  }
});
