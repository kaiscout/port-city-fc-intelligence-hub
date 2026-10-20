import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import postgres from "postgres";
const url = process.env.DATABASE_URL,
  base = process.env.APP_URL;
if (
  !url ||
  !base ||
  !new URL(url).pathname.endsWith("_test") ||
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname)
)
  throw new Error("A loopback disposable *_test database is required");
const phase = process.argv[2];
if (!["before", "after"].includes(phase ?? ""))
  throw new Error("Use before, restart the application, then after");
const db = postgres(url, { max: 1, prepare: false });
const browser = await chromium.launch(
  process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {},
);
try {
  await mkdir("test-results", { recursive: true });
  const fingerprints: Record<string, { rows: number; sha256: string }> = {};
  for (const table of [
    "operational_record",
    "application_setting",
    "scenario",
    "scenario_revision",
    "audit_event",
  ]) {
    const rows =
      table === "audit_event"
        ? await db`SELECT * FROM audit_event WHERE action<>'SIGN_IN'`
        : await db`SELECT * FROM ${db(table)}`;
    const canonical = rows.map((r) => JSON.stringify(r)).sort();
    fingerprints[table] = {
      rows: rows.length,
      sha256: createHash("sha256").update(JSON.stringify(canonical)).digest("hex"),
    };
  }
  const [actor] =
    await db`SELECT u.email FROM user_account u WHERE role='ADMINISTRATOR' AND EXISTS(SELECT 1 FROM operational_record r WHERE r.organization_id=u.organization_id AND r.entity_type='fixtures' AND r.external_id='M-01') AND EXISTS(SELECT 1 FROM scenario s WHERE s.organization_id=u.organization_id AND s.name='Synthetic operating-loop planning case') ORDER BY u.created_at DESC LIMIT 1`;
  assert.ok(actor, "An operating-loop UAT organization must exist");
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } }),
    page = await context.newPage();
  async function login(email: string) {
    const response = await page.request.post(`${base}/api/auth/login`, {
      headers: { Origin: base! },
      data: { email, password: "Disposable-UAT-Only!2026" },
    });
    assert.equal(response.status(), 200);
  }
  await login(String(actor.email));
  const workspace = await page.request.get(`${base}/api/workspace`);
  assert.equal(workspace.status(), 200);
  const data = await workspace.json();
  assert.equal(data.summary.contribution, 9830);
  assert.ok(data.records.length >= 9);
  const cases = await page.request.get(`${base}/api/scenarios`);
  const caseRows = (await cases.json()).data;
  assert.ok(
    caseRows.some((s: { name: string }) => s.name === "Synthetic operating-loop planning case"),
  );
  await page.goto(`${base}/dashboard`);
  await page.getByText("$9,830", { exact: true }).first().waitFor();
  await page.screenshot({ path: `test-results/restart-${phase}-dashboard.png` });
  if (phase === "after") {
    const before = JSON.parse(await readFile("test-results/restart-before.json", "utf8"));
    assert.deepEqual(fingerprints, before.fingerprints);
    await page.goto(`${base}/scenarios`);
    await page
      .getByRole("button", { name: "Synthetic operating-loop planning case", exact: true })
      .click();
    await page.screenshot({ path: "test-results/completion-scenario-frame.png" });
    await page.goto(`${base}/operations`);
    await page.getByRole("tab", { name: "Attendance", exact: true }).click();
    await page.getByRole("button", { name: "Edit / review ATT-01", exact: true }).click();
    await page.screenshot({ path: "test-results/completion-operations-frame.png" });
  }
  const [settingsActor] =
    await db`SELECT u.email FROM user_account u JOIN application_setting s ON s.organization_id=u.organization_id WHERE u.role='ADMINISTRATOR' AND s.key='club' AND s.value->>'dataOwner'='UAT reporting owner' ORDER BY u.created_at DESC LIMIT 1`;
  assert.ok(settingsActor);
  await login(String(settingsActor.email));
  const settings = await page.request.get(`${base}/api/settings`);
  assert.equal((await settings.json()).data.dataOwner, "UAT reporting owner");
  await context.close();
  if (phase === "after" && process.env.PUBLIC_PREVIEW_URL) {
    const publicUrl = new URL(process.env.PUBLIC_PREVIEW_URL);
    if (!["127.0.0.1", "localhost"].includes(publicUrl.hostname))
      throw new Error("Only the local prepared public preview may be captured");
    const publicContext = await browser.newContext({ viewport: { width: 1280, height: 720 } }),
      publicPage = await publicContext.newPage();
    await publicPage.goto(publicUrl.origin);
    await publicPage
      .getByRole("heading", { name: "Club operating picture", exact: true })
      .waitFor();
    await publicPage.screenshot({ path: "test-results/completion-public-command-frame.png" });
    await publicPage.getByRole("button", { name: "Finance & cash", exact: true }).click();
    await publicPage.getByRole("heading", { level: 1 }).waitFor();
    await publicPage.screenshot({ path: "test-results/completion-public-finance-frame.png" });
    await publicPage.getByRole("button", { name: "Scenario lab Sandbox", exact: true }).click();
    await publicPage.getByRole("heading", { level: 1 }).waitFor();
    await publicPage.screenshot({ path: "test-results/completion-public-scenario-frame.png" });
    await publicContext.close();
  }
  const report = {
    phase,
    status: "PASS",
    fingerprints,
    contribution: 9830,
    settingsOwnerPersisted: true,
    scenarioPersisted: true,
    freshBrowserContext: true,
    checkedAt: new Date().toISOString(),
  };
  await writeFile(`test-results/restart-${phase}.json`, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
  await db.end();
}
