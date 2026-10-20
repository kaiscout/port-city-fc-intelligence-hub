import { expect, test } from "@playwright/test";
const privateMode = Boolean(process.env.E2E_DATABASE_URL);
test.beforeEach(async ({ page, baseURL }) => {
  if (privateMode) {
    const response = await page.request.post("/api/auth/login", {
      headers: { Origin: baseURL! },
      data: { email: "admin@pcfc-demo.local", password: "PilotDemo!2026" },
    });
    expect(response.ok(), await response.text()).toBe(true);
  }
});
test("executive workflow states its source boundary", async ({ page }) => {
  await page.goto("/dashboard");
  if (privateMode) {
    await expect(page.getByRole("heading", { name: "Command Center", exact: true })).toBeVisible();
    await expect(
      page.getByText("Approved records only · USD · no live integrations", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Your Reporting Dataset Is Empty", { exact: true })).toBeVisible();
  } else
    await expect(
      page.getByRole("heading", {
        name: "Command Center",
      }),
    ).toBeVisible();
});
test("scenario inputs and reproducible export have explicit evidence", async ({ page }) => {
  await page.goto("/scenarios");
  await expect(
    page.getByRole("heading", {
      name: "Scenario Lab",
      exact: true,
    }),
  ).toBeVisible();
  if (!privateMode)
    await expect(page.getByRole("button", { name: "Save Scenario", exact: true })).toBeDisabled();
  else await expect(page.getByRole("button", { name: "Baseline", exact: true })).toBeVisible();
  await expect(
    page.getByText("Conditional Planning · About These Figures", { exact: true }),
  ).toBeVisible();
});
test("operations does not manufacture a successful import", async ({ page }) => {
  await page.goto("/operations");
  if (privateMode) {
    await expect(
      page.getByRole("heading", {
        name: "Operations Studio",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Validate & preview", exact: true }),
    ).toBeDisabled();
    await expect(page.getByText("No Records in This Selection", { exact: true })).toBeVisible();
  } else {
    await expect(page.getByText("Read-only demonstration", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Commit/ })).toHaveCount(0);
  }
});

test("Scenario Lab keeps the graph visible while advanced inputs change", async ({ page }) => {
  await page.goto("/scenarios");
  await page.getByRole("button", { name: "Baseline", exact: true }).click();
  await expect(page.locator(".lab-chart")).toBeVisible();
  if (page.viewportSize()!.width < 761) {
    await expect
      .poll(async () => {
        const box = await page.locator(".sidebar").boundingBox();
        return box!.x + box!.width;
      })
      .toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
    await page.locator(".sidebar-close").click();
    await expect
      .poll(async () => {
        const box = await page.locator(".sidebar").boundingBox();
        return box!.x + box!.width;
      })
      .toBeLessThanOrEqual(0);
  }
  await page
    .locator("details > summary")
    .filter({ hasText: /^Costs & Allowances$/ })
    .click();
  const equipment = page.locator("#private-equipment");
  await equipment.scrollIntoViewIfNeeded();
  const plot = await page.locator(".lab-chart").boundingBox();
  expect(plot!.y).toBeGreaterThanOrEqual(0);
  expect(plot!.y + plot!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await equipment.fill("1500");
  await expect(page.locator(".lab-outcome strong")).toHaveText("$14,935");
  await expect(equipment).toBeFocused();
});
test("commercial workflow distinguishes stored contracts from the demonstration sample", async ({
  page,
}) => {
  await page.goto("/sponsors");
  if (privateMode)
    await expect(page.getByText("No Approved Sponsor Contracts", { exact: true })).toBeVisible();
  else {
    await page.getByRole("button", { name: /Dockside Legal Group/ }).click();
    await expect(page.getByText("High renewal risk", { exact: true })).toBeVisible();
  }
});
test("primary routes have one main heading and no page-level horizontal overflow", async ({
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
      path,
    ).toBe(false);
  }
});
