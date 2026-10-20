import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import postgres from "postgres";
import { hashPassword } from "../../lib/auth/password";
import { scenarioPresets } from "../../lib/data/demo";
import { toCsv, parseCsv } from "../../lib/csv";
import type { ClubEntity } from "../../lib/club";
const databaseUrl = process.env.E2E_DATABASE_URL;
const password = "Disposable-UAT-Only!2026";
const provenance = {
  evidence: "Synthetic demonstration data",
  sourceRef: "Existing synthetic sample; disposable UAT only",
  referenceDate: "2026-10-12",
};
let db: ReturnType<typeof postgres>;
test.beforeAll(() => {
  if (databaseUrl) db = postgres(databaseUrl, { max: 2, prepare: false });
});
test.afterAll(async () => {
  if (db) await db.end();
});
async function provision() {
  const org = randomUUID(),
    other = randomUUID(),
    admin = randomUUID(),
    commercial = randomUUID(),
    otherAdmin = randomUUID(),
    tag = randomUUID().slice(0, 8),
    hash = await hashPassword(password);
  await db.begin(async (tx) => {
    await tx`INSERT INTO organization(id,name,mode) VALUES (${org},'SYNTHETIC UAT ORGANIZATION','PRODUCTION'),(${other},'Isolated other UAT organization','PRODUCTION')`;
    await tx`INSERT INTO user_account(id,organization_id,email,display_name,password_hash,role) VALUES (${admin},${org},${`admin-${tag}@example.test`},'UAT administrator',${hash},'ADMINISTRATOR'),(${commercial},${org},${`commercial-${tag}@example.test`},'UAT commercial lead',${hash},'COMMERCIAL'),(${otherAdmin},${other},${`other-${tag}@example.test`},'Other UAT administrator',${hash},'ADMINISTRATOR')`;
  });
  return {
    org,
    other,
    admin,
    commercial,
    adminEmail: `admin-${tag}@example.test`,
    commercialEmail: `commercial-${tag}@example.test`,
    otherEmail: `other-${tag}@example.test`,
  };
}
async function login(request: APIRequestContext, email: string, baseURL: string) {
  const result = await request.post("/api/auth/login", {
    headers: { Origin: baseURL },
    data: { email, password },
  });
  expect(result.status(), await result.text()).toBe(200);
}
async function create(
  request: APIRequestContext,
  baseURL: string,
  entity: ClubEntity,
  externalId: string,
  name: string,
  payload: Record<string, unknown>,
) {
  const response = await request.post(`/api/admin/entities/${entity}`, {
    headers: { Origin: baseURL },
    data: { externalId, name, status: "APPROVED", payload: { ...provenance, ...payload } },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()).data;
}
async function configure(request: APIRequestContext, baseURL: string) {
  await create(request, baseURL, "seasons", "2026", "2026 season", {
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
  });
  await create(request, baseURL, "teams", "MEN", "Men's program", { program: "Men" });
  await create(request, baseURL, "competitions", "LEAGUE", "Sample competition", {});
  await create(request, baseURL, "venues", "VENUE", "Sample venue", { capacity: 6000 });
}

test("public no-database mode cannot impersonate a private operating workspace", async ({
  page,
  request,
  baseURL,
}) => {
  if (databaseUrl) {
    const p = await provision();
    await login(request, p.adminEmail, baseURL!);
    const empty = await request.get("/api/workspace");
    expect((await empty.json()).records).toEqual([]);
    expect((await empty.json()).summary).toMatchObject({
      fixtures: 0,
      paid: null,
      receipts: null,
      costs: null,
      contribution: null,
    });
    return;
  }
  await page.goto("/operations");
  await expect(page.getByText("Read-only demonstration", { exact: true })).toBeVisible();
  expect(
    (
      await request.post("/api/admin/entities/fixtures", {
        headers: { Origin: baseURL! },
        data: {},
      })
    ).status(),
  ).toBe(403);
});

test("approved manual and quoted CSV records drive analytics, corrections, reports and audit", async ({
  page,
  baseURL,
}, testInfo) => {
  const request = page.request;
  test.skip(
    !databaseUrl,
    "This workflow requires the explicitly configured disposable PostgreSQL database",
  );
  const p = await provision();
  await login(request, p.adminEmail, baseURL!);
  await configure(request, baseURL!);
  const config = (await (await request.get("/api/settings")).json()).data;
  expect(
    (
      await request.patch("/api/settings", {
        headers: { Origin: baseURL! },
        data: {
          ...config,
          activeSeasonExternalId: "2026",
          dataOwner: "UAT reporting owner",
          referenceDate: "2026-10-12",
          reportingNote: "Synthetic UAT source records only; not approved club actuals.",
        },
      })
    ).status(),
  ).toBe(200);
  const fixture = await create(request, baseURL!, "fixtures", "M-01", "Club, United", {
    seasonExternalId: "2026",
    teamExternalId: "MEN",
    competitionExternalId: "LEAGUE",
    venueExternalId: "VENUE",
    date: "2026-05-16",
    classification: "Home",
    projected: 1420,
  });
  await create(request, baseURL!, "revenue", "R-01", "Sample fixture receipts", {
    fixtureExternalId: "M-01",
    category: "Recorded total",
    amount: 39480,
    currency: "USD",
  });
  const cost = await create(request, baseURL!, "costs", "C-01", "Sample fixture direct costs", {
    fixtureExternalId: "M-01",
    category: "Recorded direct total",
    amount: 28740,
    currency: "USD",
    costClass: "Direct",
  });
  await page.goto("/operations");
  await page.getByRole("tab", { name: "Venues", exact: true }).click();
  await page.getByRole("button", { name: "Edit / review VENUE", exact: true }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Sample venue reviewed in UI");
  await page.getByRole("button", { name: "Save record version", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "committed" })).toBeVisible();
  const venueAfter = (await (await request.get("/api/admin/entities/venues")).json()).data[0];
  expect(venueAfter).toMatchObject({ name: "Sample venue reviewed in UI", version: 2 });
  await page.getByRole("tab", { name: "Attendance", exact: true }).click();
  const csv = toCsv([
    {
      externalId: "ATT-01",
      name: 'Attendance, "source reviewed"',
      status: "APPROVED",
      ...provenance,
      fixtureExternalId: "M-01",
      paid: 1284,
      complimentary: 0,
      returning: 0,
    },
  ]);
  await page.getByLabel("CSV import content").fill(csv);
  await page.getByRole("button", { name: "Validate & preview", exact: true }).click();
  await expect(
    page.getByText("1 valid · 0 blocked. Any blocked row prevents the entire batch."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Commit all 1 rows", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "1 records durably committed" }),
  ).toBeVisible();
  const batch = (
    await db`SELECT * FROM import_batch WHERE organization_id=${p.org} AND status='COMMITTED'`
  )[0]!;
  expect(batch.accepted_count).toBe(1);
  const repeat = await request.post("/api/imports/preview", {
    headers: { Origin: baseURL! },
    data: { kind: "attendance", csv, filename: "renamed.csv" },
  });
  expect(repeat.status()).toBe(409);
  const replay = await request.post("/api/imports/commit", {
    headers: { Origin: baseURL! },
    data: { batchId: batch.id, version: 1 },
  });
  expect(replay.status()).toBe(200);
  expect((await replay.json()).alreadyCommitted).toBe(true);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Command Center", exact: true })).toBeVisible();
  await expect(page.getByText("$10,740", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("1,284", { exact: true }).first()).toBeVisible();
  if (page.viewportSize()!.width < 600) {
    const fields = page.locator(".club-report-filters select, .club-report-filters input");
    await expect(fields).toHaveCount(4);
    for (const field of await fields.all()) {
      const box = await field.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(130);
      expect(box!.height).toBeGreaterThanOrEqual(40);
    }
  }
  await page.getByLabel("Search operational records", { exact: true }).fill("2026-05");
  await expect(page.getByText("$10,740", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Search operational records", { exact: true }).fill("");
  await page.getByLabel("Operational program", { exact: true }).selectOption("Women");
  await expect(page.getByText("Your Reporting Dataset Is Empty", { exact: true })).toBeVisible();
  const exportWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export meeting data", exact: true }).click();
  const download = await exportWait;
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  expect(await readFile(exportPath!, "utf8")).toContain("No approved records match this selection");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  const correction = await request.patch("/api/admin/entities/costs", {
    headers: { Origin: baseURL! },
    data: { ...cost, payload: { ...cost.payload, amount: 29650 } },
  });
  expect(correction.status()).toBe(200);
  expect((await correction.json()).data.version).toBe(2);
  expect(
    (
      await request.patch("/api/admin/entities/costs", {
        headers: { Origin: baseURL! },
        data: cost,
      })
    ).status(),
  ).toBe(409);
  await page.reload();
  await expect(page.getByText("$9,830", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Source & definition", exact: true }).click();
  await expect(page.getByRole("region", { name: "Operational evidence" })).toContainText(
    provenance.sourceRef,
  );
  const [counts] =
    await db`SELECT (SELECT count(*)::int FROM operational_record WHERE organization_id=${p.org}) records,(SELECT count(*)::int FROM audit_event WHERE organization_id=${p.org} AND action='IMPORT_COMMITTED') committed_audits`;
  expect(counts!.committed_audits).toBe(1);
  expect(counts!.records).toBe(8);
  const fresh = await page.context().browser()!.newContext();
  const freshPage = await fresh.newPage();
  await login(freshPage.request, p.adminEmail, baseURL!);
  await freshPage.goto(`${baseURL}/dashboard`);
  await expect(freshPage.getByText("$9,830", { exact: true }).first()).toBeVisible();
  await fresh.close();
  await page.getByRole("button", { name: "Close evidence", exact: true }).click();
  await create(
    request,
    baseURL!,
    "recommendations",
    "REVIEW-01",
    "Review source costs before adoption",
    {
      owner: "UAT reporting owner",
      dueOn: "2026-07-12",
      actionStatus: "Open",
      priority: "High",
      rationale: "Reconcile the recorded fixture costs with their source before operational use.",
    },
  );
  const sameOrgCase = await request.post("/api/scenarios", {
    headers: { Origin: baseURL! },
    data: {
      ...scenarioPresets[1],
      id: "new-operating-loop",
      name: "Synthetic operating-loop planning case",
    },
  });
  expect(sameOrgCase.status()).toBe(201);
  await page.reload();
  await expect(
    page.getByText("Review source costs before adoption", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/private-dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.emulateMedia({ media: "print" });
  await page.screenshot({
    path: `test-results/private-report-print-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  expect(fixture.externalId).toBe("M-01");
});

test("configuration, sponsor delivery, actions and scenario versions are durable and audited", async ({
  page,
  baseURL,
}, testInfo) => {
  const request = page.request;
  test.skip(!databaseUrl, "Requires disposable PostgreSQL");
  const p = await provision();
  await login(request, p.adminEmail, baseURL!);
  await configure(request, baseURL!);
  await page.goto("/settings");
  await page.getByLabel("Data owner", { exact: true }).fill("UAT reporting owner");
  await page.getByRole("button", { name: "Save configuration", exact: true }).click();
  await expect(
    page.getByText("Configuration committed and audited.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Data owner", { exact: true })).toHaveValue("UAT reporting owner");
  await page.getByLabel("Account display name", { exact: true }).fill("Provisioned UAT analyst");
  await page
    .getByLabel("Account email", { exact: true })
    .fill(`provisioned-${randomUUID()}@example.test`);
  await page.getByLabel("Initial password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Provision account", exact: true }).click();
  await expect(
    page.getByText("Account provisioned and audited. No email was sent.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Active Provisioned UAT analyst", { exact: true }).uncheck();
  const accessSaved = page.waitForResponse(
    (response) => response.url().endsWith("/api/users") && response.request().method() === "PATCH",
  );
  await page
    .getByRole("button", { name: "Save access for Provisioned UAT analyst", exact: true })
    .click();
  expect((await accessSaved).status()).toBe(200);
  await page.reload();
  await expect(
    page.getByLabel("Active Provisioned UAT analyst", { exact: true }),
  ).not.toBeChecked();
  await create(request, baseURL!, "sponsors", "SP-001", "Sample contract", {
    program: "Club-wide",
    contractValue: 42000,
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    owner: "UAT commercial lead",
    renewalIntent: "Unknown",
  });
  const deliverable = await create(
    request,
    baseURL!,
    "sponsor-deliverables",
    "DEL-001",
    "Source-backed delivery",
    {
      sponsorExternalId: "SP-001",
      owner: "UAT commercial lead",
      dueOn: "2026-07-12",
      deliveryStatus: "Blocked",
      evidenceNote: "Awaiting source approval",
    },
  );
  expect(
    (
      await request.patch("/api/admin/entities/sponsor-deliverables", {
        headers: { Origin: baseURL! },
        data: {
          ...deliverable,
          payload: {
            ...deliverable.payload,
            deliveryStatus: "Complete",
            evidenceNote: "Synthetic UAT proof attached",
          },
        },
      })
    ).status(),
  ).toBe(200);
  await create(request, baseURL!, "recommendations", "DEC-001", "Review the fixture source", {
    owner: "UAT reporting owner",
    dueOn: "2026-07-12",
    actionStatus: "Open",
    priority: "High",
    rationale: "Confirm recorded costs against the source reference before club adoption.",
  });
  await page.goto("/sponsors");
  await expect(page.getByText("Sample contract", { exact: true })).toBeVisible();
  await expect(page.getByText("Complete", { exact: true })).toBeVisible();
  await page.goto("/scenarios");
  await expect(page.getByText("Inputs Required", { exact: true })).toBeVisible();
  expect(await page.getByLabel("Average Ticket Price (USD)", { exact: true }).inputValue()).toBe(
    "",
  );
  const created = await request.post("/api/scenarios", {
    headers: { Origin: baseURL! },
    data: { ...scenarioPresets[1], id: "new-uat", name: "UAT conditional case" },
  });
  expect(created.status()).toBe(201);
  const scenario = (await created.json()).data;
  const updated = await request.post("/api/scenarios", {
    headers: { Origin: baseURL! },
    data: { ...scenario, name: "UAT conditional case revised" },
  });
  expect(updated.status()).toBe(200);
  expect((await updated.json()).data.version).toBe(2);
  expect(
    (
      await request.post("/api/scenarios", { headers: { Origin: baseURL! }, data: scenario })
    ).status(),
  ).toBe(409);
  const revisions = await request.get(`/api/scenarios/${scenario.id}`);
  expect((await revisions.json()).data.map((r: { version: number }) => r.version)).toEqual([2, 1]);
  await page.reload();
  await page.getByRole("button", { name: "UAT conditional case revised", exact: true }).click();
  await page.getByLabel("Scenario Name", { exact: true }).fill("UAT case saved from UI");
  await page.getByRole("button", { name: "Save Scenario", exact: true }).click();
  await expect(
    page.getByText("Scenario version 3 committed with immutable revision and audit event.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Average Ticket Price (USD)", { exact: true }).fill("21");
  await page.getByRole("button", { name: "Reset Unsaved Inputs", exact: true }).click();
  await expect(page.getByLabel("Average Ticket Price (USD)", { exact: true })).toHaveValue("19");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Inputs & Outputs", exact: true }).click();
  expect(await download).toBeTruthy();
  await page.screenshot({
    path: `test-results/private-scenario-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const [evidence] =
    await db`SELECT (SELECT count(*)::int FROM application_setting WHERE organization_id=${p.org}) settings,(SELECT count(*)::int FROM scenario_revision WHERE organization_id=${p.org}) revisions,(SELECT count(*)::int FROM audit_event WHERE organization_id=${p.org} AND action='SETTINGS_UPDATED') config_audits`;
  expect(evidence).toMatchObject({ settings: 1, revisions: 3, config_audits: 1 });
});

test("scenario comparison, revision restore and archive preserve reproducible evidence", async ({
  page,
  baseURL,
}) => {
  test.skip(!databaseUrl, "Requires disposable PostgreSQL");
  const p = await provision(),
    request = page.request;
  await login(request, p.adminEmail, baseURL!);
  const created = await request.post("/api/scenarios", {
    headers: { Origin: baseURL! },
    data: { ...scenarioPresets[1], id: "new-versions", name: "UAT original scenario" },
  });
  expect(created.status()).toBe(201);
  const oversized = await request.post("/api/scenarios", {
    headers: { Origin: baseURL! },
    data: {
      ...scenarioPresets[1],
      id: "new-overflow",
      name: "Unsupported numeric scale",
      ticketPrice: 1e100,
    },
  });
  expect(oversized.status()).toBe(422);
  expect((await (await request.get("/api/scenarios")).json()).data).toHaveLength(1);
  await page.goto("/scenarios");
  await page.getByRole("button", { name: "UAT original scenario", exact: true }).click();
  await page.getByLabel("Scenario Name", { exact: true }).fill("UAT versioned scenario v2");
  await page.getByRole("button", { name: "Save Scenario", exact: true }).click();
  await expect(
    page.getByText("Scenario version 2 committed with immutable revision and audit event.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate UAT versioned scenario v2", exact: true })
    .click();
  await expect(
    page.getByText("Scenario copy committed and audited.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  const downloadWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Comparison", exact: true }).click();
  const downloaded = await downloadWait;
  const { readFile } = await import("node:fs/promises");
  const rows = parseCsv(await readFile((await downloaded.path())!, "utf8"));
  expect(rows).toHaveLength(2);
  expect(new Set(rows.map((r) => r.id)).size).toBe(2);
  for (const row of rows) {
    expect(Number(row.ticketPrice)).toBe(19);
    expect(row.scope).toBe("Per fixture");
    expect(row.sponsorFrequency).toBe("Per fixture");
    expect(Number(row.operatingMargin)).toBeCloseTo(15034.8, 6);
  }
  await page.getByRole("button", { name: "UAT versioned scenario v2", exact: true }).click();
  await page.getByRole("button", { name: "Restore v1 as new draft", exact: true }).click();
  const restoredName = await page.getByLabel("Scenario Name", { exact: true }).inputValue();
  expect(restoredName).toContain("version 1 copy");
  await page.getByRole("button", { name: "Save Scenario", exact: true }).click();
  await expect(
    page.getByText("Scenario version 1 committed with immutable revision and audit event.", {
      exact: true,
    }),
  ).toBeVisible();
  const restored = (await (await request.get("/api/scenarios")).json()).data.find(
    (s: { name: string }) => s.name === restoredName,
  );
  expect(restored).toBeTruthy();
  await page.getByRole("button", { name: `Archive ${restoredName}`, exact: true }).click();
  await expect(
    page.getByText("Scenario archived; historical revisions retained.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Inputs Required", { exact: true })).toBeVisible();
  expect(
    (await (await request.get("/api/scenarios")).json()).data.some(
      (s: { id: string }) => s.id === restored.id,
    ),
  ).toBe(false);
  const [revision] =
    await db`SELECT count(*)::int n FROM scenario_revision WHERE scenario_id=${restored.id} AND organization_id=${p.org}`;
  expect(revision!.n).toBeGreaterThanOrEqual(1);
  const handover = await request.get("/api/artifacts/club-handover");
  expect(handover.status()).toBe(200);
  expect(await handover.text()).toContain("Club handover");
});

test("all six roles retain their actual API read and write boundaries", async ({
  request,
  baseURL,
}) => {
  test.skip(!databaseUrl, "Requires disposable PostgreSQL");
  const p = await provision();
  await login(request, p.adminEmail, baseURL!);
  await configure(request, baseURL!);
  const actors = [];
  for (const role of ["EXECUTIVE", "ANALYST", "MARKETING", "MATCHDAY_OPERATIONS"]) {
    const email = `role-${role.toLowerCase()}-${randomUUID()}@example.test`;
    const response = await request.post("/api/users", {
      headers: { Origin: baseURL! },
      data: { email, password, displayName: `UAT ${role}`, role },
    });
    expect(response.status()).toBe(201);
    actors.push({ role, email });
  }
  for (const actor of actors) {
    await login(request, actor.email, baseURL!);
    expect((await request.get("/api/users")).status()).toBe(403);
    expect((await request.get("/api/settings")).status()).toBe(403);
    if (actor.role === "MARKETING") {
      const body = await (await request.get("/api/workspace")).json();
      expect(body.fixtures).toEqual([]);
      expect(
        body.records.some((r: { entityType: string }) =>
          ["attendance", "revenue", "costs"].includes(r.entityType),
        ),
      ).toBe(false);
      expect(
        (
          await request.post("/api/admin/entities/fixtures", {
            headers: { Origin: baseURL! },
            data: {},
          })
        ).status(),
      ).toBe(403);
    } else if (actor.role === "EXECUTIVE") {
      const cases = await request.get("/api/scenarios");
      expect(cases.status()).toBe(200);
      expect((await cases.json()).readOnly).toBe(true);
      expect(
        (
          await request.post("/api/scenarios", {
            headers: { Origin: baseURL! },
            data: scenarioPresets[1],
          })
        ).status(),
      ).toBe(403);
    } else {
      const externalId = `F-${actor.role}`;
      await create(request, baseURL!, "fixtures", externalId, "Role-bound fixture", {
        seasonExternalId: "2026",
        teamExternalId: "MEN",
        competitionExternalId: "LEAGUE",
        venueExternalId: "VENUE",
        date: "2026-05-16",
        classification: "Home",
      });
      await create(request, baseURL!, "attendance", `A-${actor.role}`, "Role-bound attendance", {
        fixtureExternalId: externalId,
        paid: 1284,
        complimentary: 0,
      });
      await create(request, baseURL!, "revenue", `R-${actor.role}`, "Role-bound receipts", {
        fixtureExternalId: externalId,
        amount: 39480,
        category: "Recorded total",
        currency: "USD",
      });
      await create(request, baseURL!, "costs", `C-${actor.role}`, "Role-bound costs", {
        fixtureExternalId: externalId,
        amount: 28740,
        category: "Recorded direct total",
        currency: "USD",
        costClass: "Direct",
      });
      expect((await request.get("/api/admin/entities/attendance")).status()).toBe(200);
      expect((await request.get("/api/admin/entities/revenue")).status()).toBe(200);
      expect((await request.get("/api/admin/entities/costs")).status()).toBe(200);
    }
  }
  await login(request, p.commercialEmail, baseURL!);
  await create(request, baseURL!, "sponsors", "SP-ROLE", "Role-bound contract", {
    program: "Club-wide",
    contractValue: 42000,
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    owner: "UAT commercial lead",
    renewalIntent: "Unknown",
  });
  expect((await request.get("/api/admin/entities/sponsors")).status()).toBe(200);
  expect(
    (
      await request.post("/api/admin/entities/costs", { headers: { Origin: baseURL! }, data: {} })
    ).status(),
  ).toBe(403);
});

test("CSV invalid and commit-time duplicate batches stay atomic", async ({ request, baseURL }) => {
  test.skip(!databaseUrl, "Requires disposable PostgreSQL");
  const p = await provision();
  await login(request, p.adminEmail, baseURL!);
  await configure(request, baseURL!);
  const headers = { Origin: baseURL! };
  const row = {
    externalId: "ATOMIC-1",
    name: "Atomic fixture",
    status: "APPROVED",
    ...provenance,
    seasonExternalId: "2026",
    teamExternalId: "MEN",
    competitionExternalId: "LEAGUE",
    venueExternalId: "VENUE",
    date: "2026-05-16",
    classification: "Home",
    projected: "",
  };
  const invalid = await request.post("/api/imports/preview", {
    headers,
    data: {
      kind: "fixtures",
      filename: "invalid.csv",
      csv: toCsv([row, { ...row, externalId: "ATOMIC-2", venueExternalId: "MISSING" }]),
    },
  });
  expect(invalid.status()).toBe(200);
  const blocked = await invalid.json();
  expect(blocked).toMatchObject({ valid: 1, invalid: 1 });
  expect(
    (
      await request.post("/api/imports/commit", {
        headers,
        data: { batchId: blocked.batchId, version: blocked.version },
      })
    ).status(),
  ).toBe(409);
  expect((await (await request.get("/api/admin/entities/fixtures")).json()).data).toEqual([]);
  const valid = await request.post("/api/imports/preview", {
    headers,
    data: {
      kind: "fixtures",
      filename: "valid.csv",
      csv: toCsv([row, { ...row, externalId: "ATOMIC-2" }]),
    },
  });
  const preview = await valid.json();
  expect(preview).toMatchObject({ valid: 2, invalid: 0 });
  await create(request, baseURL!, "fixtures", "ATOMIC-2", "Concurrent record", {
    seasonExternalId: "2026",
    teamExternalId: "MEN",
    competitionExternalId: "LEAGUE",
    venueExternalId: "VENUE",
    date: "2026-05-16",
    classification: "Home",
  });
  expect(
    (
      await request.post("/api/imports/commit", {
        headers,
        data: { batchId: preview.batchId, version: preview.version },
      })
    ).status(),
  ).toBe(409);
  const stored = (await (await request.get("/api/admin/entities/fixtures")).json()).data;
  expect(stored.map((r: { externalId: string }) => r.externalId)).toEqual(["ATOMIC-2"]);
  const [counts] =
    await db`SELECT count(*)::int n FROM audit_event WHERE organization_id=${p.org} AND action='IMPORT_COMMITTED'`;
  expect(counts!.n).toBe(0);
});

test("actual routes enforce permissions, cross-organization isolation, origin checks and session revocation", async ({
  page,
  baseURL,
}) => {
  const request = page.request;
  test.skip(!databaseUrl, "Requires disposable PostgreSQL");
  const p = await provision();
  await login(request, p.adminEmail, baseURL!);
  await configure(request, baseURL!);
  const orgA = (await request.get("/api/admin/entities/venues")).json();
  const venue = (await orgA).data[0];
  const missingOrigin = await request.post("/api/admin/entities/venues", { data: {} });
  expect(missingOrigin.status()).toBe(403);
  const evil = await request.post("/api/admin/entities/venues", {
    headers: { Origin: "https://untrusted.example.test" },
    data: {},
  });
  expect(evil.status()).toBe(403);
  await login(request, p.otherEmail, baseURL!);
  expect((await request.get("/api/admin/entities/venues")).status()).toBe(200);
  expect((await (await request.get("/api/admin/entities/venues")).json()).data).toEqual([]);
  expect(
    (
      await request.patch("/api/admin/entities/venues", {
        headers: { Origin: baseURL! },
        data: venue,
      })
    ).status(),
  ).toBe(404);
  await login(request, p.commercialEmail, baseURL!);
  for (const path of [
    "/api/users",
    "/api/settings",
    "/api/admin/entities/fixtures",
    "/api/admin/entities/revenue",
    "/api/admin/entities/costs",
    "/api/scenarios",
  ]) {
    expect((await request.get(path)).status(), path).toBe(403);
  }
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/forbidden/);
  expect(
    (
      await request.post("/api/imports/preview", {
        headers: { Origin: baseURL! },
        data: { kind: "revenue", filename: "blocked.csv", csv: "externalId,name\nx,blocked" },
      })
    ).status(),
  ).toBe(403);
  await login(request, p.adminEmail, baseURL!);
  const people = (await (await request.get("/api/users")).json()).data;
  const admin = people.find((a: { id: string }) => a.id === p.admin);
  expect(
    (
      await request.patch("/api/users", {
        headers: { Origin: baseURL! },
        data: { id: admin.id, version: admin.version, role: "EXECUTIVE", active: true },
      })
    ).status(),
  ).toBe(422);
  await db`UPDATE session SET revoked_at=now() WHERE user_id=${p.admin}`;
  expect((await request.get("/api/workspace")).status()).toBe(401);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
