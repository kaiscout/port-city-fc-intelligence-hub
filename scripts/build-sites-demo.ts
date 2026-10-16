import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { permissions } from "../lib/rbac";

import {
  auditEvents,
  channelPerformance,
  communityRecords,
  demoFixtures,
  demoSponsors,
  funnelStages,
  scenarioPresets,
} from "../lib/data/demo";
import {
  financialPeriods,
  fy25ExpenseCategories,
  fy25FieldCosts,
  fy25IncomeCategories,
  fy25MonthlyCashFlow,
  managementMatchdayCosts,
  managementOperatingBaseline,
  managementSeasonCommitments,
  matchdayNeeds,
  openStaffRoles,
  reportedSponsorReceipts,
  staffRoles,
} from "../lib/data/pcfc-reference";

const root = process.cwd();
const source = path.join(root, "site");
const output = path.join(root, "dist");

const reconciliation = JSON.parse(
  await readFile(path.join(root, "data", "processed", "reconciliation.json"), "utf8"),
) as {
  generatedAt: string;
  checks: { name: string; expected: number; actual: number; difference: number; status: string }[];
};

const publicSponsors = demoSponsors.map(
  ({
    id,
    name,
    tier,
    contractValue,
    period,
    program,
    delivered,
    total,
    overdue,
    estimatedReach,
    engagementPct,
    renewalIntent,
    nextAction,
  }) => ({
    id,
    name,
    tier,
    contractValue,
    period,
    program,
    delivered,
    total,
    overdue,
    estimatedReach,
    engagementPct,
    renewalIntent,
    nextAction,
  }),
);

const publicFixtures = demoFixtures.map(
  ({
    id,
    date,
    program,
    opponent,
    competition,
    venue,
    capacity,
    projected,
    paid,
    ticketRevenue,
    totalRevenue,
    cost,
    returningPct,
  }) => ({
    id,
    date,
    program,
    opponent,
    competition,
    venue,
    capacity,
    projected,
    paid,
    ticketRevenue,
    totalRevenue,
    cost,
    returningPct,
  }),
);

const data = {
  meta: {
    product: "Port City FC Intelligence Hub",
    mode: "Public portfolio simulation",
    snapshotAt: reconciliation.generatedAt,
    builtAt: new Date().toISOString(),
    release: "Stakeholder review 5.0",
    operationsScope: "2026 synthetic operational sample",
    acquisitionScope: "2026 club-wide acquisition sample; no program-level attribution",
    evidenceBoundary:
      "Synthetic and deliberately generalized data. No bank rows, payees, staff identities, contact details, private filenames, or attributed messages are published.",
  },
  financialPeriods,
  incomeCategories: fy25IncomeCategories,
  expenseCategories: fy25ExpenseCategories,
  monthlyCash: fy25MonthlyCashFlow,
  financeBreakdowns: {
    FY25: {
      monthly: fy25MonthlyCashFlow,
      income: fy25IncomeCategories,
      expenses: fy25ExpenseCategories,
    },
  },
  fieldCosts: fy25FieldCosts,
  operatingBaseline: managementOperatingBaseline,
  matchdayCosts: managementMatchdayCosts,
  commitments: managementSeasonCommitments,
  sponsorReceipts: reportedSponsorReceipts,
  sponsors: publicSponsors,
  fixtures: publicFixtures,
  funnelStages,
  channelPerformance,
  scenarioPresets: scenarioPresets.map((preset) => ({
    ...preset,
    homeMatches: 10,
    variableCostPerAttendee: 2.4,
  })),
  communityRecords,
  staffing: { covered: staffRoles, open: openStaffRoles },
  matchdayNeeds,
  auditEvents: auditEvents.map((event, index) => ({
    ...event,
    actor:
      ["Operations lead", "Business analyst", "Commercial lead", "Administrator"][index] ??
      "System",
  })),
  reconciliation: {
    generatedAt: reconciliation.generatedAt,
    checks: reconciliation.checks,
  },
  permissions,
  decisions: [
    {
      id: "DEC-017",
      priority: "High",
      title: "Set the minimum cash-reserve threshold",
      owner: "Ownership group",
      due: "Before budget approval",
      status: "Decision required",
      evidence:
        "FY25 synthetic net cash margin is 5.6%. No opening bank balance is supplied, so liquidity and runway cannot be established.",
      recommendation:
        "Propose a minimum reserve and validate it against an authorized cash balance and payment schedule. The amount requires ownership approval.",
    },
    {
      id: "DEC-014",
      priority: "High",
      title: "Assign sponsor-renewal ownership",
      owner: "Commercial lead",
      due: "30 days",
      status: "Action open",
      evidence:
        "Sponsorship is 56.3% of FY25 synthetic cash inflow. The separate 2026 sponsor sample illustrates delivery and renewal workflows.",
      recommendation:
        "Propose a 90/60/30-day renewal cadence with delivery proof. Confirm account ownership and actual contract dates with PCFC.",
    },
    {
      id: "DEC-012",
      priority: "Medium",
      title: "Confirm the home and away fixture split",
      owner: "Operations lead",
      due: "Before forecast lock",
      status: "Evidence gap",
      evidence:
        "The generalized planning assumptions do not establish an approved home/away split. Eight synthetic home-fixture examples are not a season schedule.",
      recommendation:
        "Validate fixture classification before using per-home-match cost projections.",
    },
    {
      id: "DEC-009",
      priority: "Medium",
      title: "Approve one attendance definition",
      owner: "Business analyst",
      due: "Next data council",
      status: "In review",
      evidence: "Projected, paid, and attended measures serve different decisions.",
      recommendation:
        "Adopt paid attendance for commercial reporting and scanned attendance for operations.",
    },
  ],
};

const { validateHubModel } = await import(pathToFileURL(path.join(source, "model.js")).href);
const modelChecks = validateHubModel(data);
if (
  modelChecks.some((check: { status: string }) => check.status !== "PASS") ||
  reconciliation.checks.some((check) => check.status !== "PASS" || check.difference !== 0)
) {
  throw new Error("Hub integrity controls failed; refusing to build the public release.");
}
const bundle = { ...data, modelChecks };

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "assets"), { recursive: true });
await Promise.all([
  cp(path.join(source, "index.html"), path.join(output, "index.html")),
  cp(path.join(source, "styles.css"), path.join(output, "styles.css")),
  cp(path.join(source, "app.js"), path.join(output, "app.js")),
  cp(path.join(source, "model.js"), path.join(output, "model.js")),
  cp(
    path.join(root, "public", "brand", "port-city-fc-logo.png"),
    path.join(output, "assets", "pcfc-logo.png"),
  ),
]);
await writeFile(
  path.join(output, "data.js"),
  `window.PCFC_DATA = ${JSON.stringify(bundle)};\n`,
  "utf8",
);

console.log(
  JSON.stringify({
    output,
    files: 6,
    views: 9,
    integrityChecks: modelChecks.length,
    status: "PASS",
  }),
);
