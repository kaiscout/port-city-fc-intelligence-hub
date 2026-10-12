import { defineConfig, devices } from "@playwright/test";

const databaseUrl = process.env.E2E_DATABASE_URL;
const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 120_000,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SESSION_SECRET: "playwright-session-secret-is-long-enough",
      DATABASE_URL: databaseUrl ?? "",
      DEMO_MODE: "true",
      LOCAL_PREVIEW_MODE: databaseUrl ? "false" : "true",
      APP_URL: baseURL,
    },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 900 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
