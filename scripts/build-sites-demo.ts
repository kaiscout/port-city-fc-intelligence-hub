import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  auditEvents,
  channelPerformance,
  communityRecords,
  demoFixtures,
  demoSponsors,
  funnelStages,
  monthlyTrend,
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
) as { generatedAt?: string; checks?: unknown[] };

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
    refreshedAt: "2026-10-14T18:30:00Z",
    modelStatus: "Reconciled",
    release: "Executive workspace 3.0",
    evidenceBoundary:
      "Synthetic and deliberately generalized data. No bank rows, payees, staff identities, contact details, private filenames, or attributed messages are published.",
  },
  financialPeriods,
  incomeCategories: fy25IncomeCategories,
  expenseCategories: fy25ExpenseCategories,
  monthlyCash: fy25MonthlyCashFlow,
  fieldCosts: fy25FieldCosts,
  operatingBaseline: managementOperatingBaseline,
  matchdayCosts: managementMatchdayCosts,
  commitments: managementSeasonCommitments,
  sponsorReceipts: reportedSponsorReceipts,
  sponsors: publicSponsors,
  fixtures: publicFixtures,
  funnelStages,
  channelPerformance,
  scenarioPresets,
  communityRecords,
  monthlyTrend,
  staffing: { covered: staffRoles, open: openStaffRoles },
  matchdayNeeds,
  auditEvents: auditEvents.map((event, index) => ({
    ...event,
    actor:
      ["Operations lead", "Business analyst", "Commercial lead", "Administrator"][index] ??
      "System",
  })),
  reconciliation: {
    generatedAt: reconciliation.generatedAt ?? "2026-10-14T18:30:00Z",
    checks: Array.isArray(reconciliation.checks) ? reconciliation.checks : [],
  },
  decisions: [
    {
      id: "DEC-017",
      priority: "High",
      title: "Set the minimum cash-reserve threshold",
      owner: "Ownership group",
      due: "Before budget approval",
      status: "Decision required",
      evidence: "Modeled margin is 5.6%; downside tolerance is limited.",
      recommendation:
        "Ring-fence at least one month of modeled operating spend before approving growth cases.",
    },
    {
      id: "DEC-014",
      priority: "High",
      title: "Assign sponsor-renewal ownership",
      owner: "Commercial lead",
      due: "30 days",
      status: "Action open",
      evidence: "Sponsorship provides 56.3% of modeled income.",
      recommendation:
        "Use a 90/60/30-day renewal cadence with delivery proof attached to each account.",
    },
    {
      id: "DEC-012",
      priority: "Medium",
      title: "Confirm the home and away fixture split",
      owner: "Operations lead",
      due: "Before forecast lock",
      status: "Evidence gap",
      evidence: "The public evidence confirms match volume, but not the home/away split.",
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
  qualityChecks: [
    { name: "Monthly inflow to category control", status: "Pass", difference: 0, owner: "Finance" },
    {
      name: "Monthly outflow to category control",
      status: "Pass",
      difference: 0,
      owner: "Finance",
    },
    { name: "Net cash arithmetic", status: "Pass", difference: 0, owner: "Business analyst" },
    { name: "Twelve-month date coverage", status: "Pass", difference: 0, owner: "Data steward" },
    { name: "Program dimension coverage", status: "Pass", difference: 0, owner: "Operations" },
    { name: "Role-only staffing boundary", status: "Pass", difference: 0, owner: "Administrator" },
    {
      name: "Public-field privacy contract",
      status: "Pass",
      difference: 0,
      owner: "Administrator",
    },
  ],
};

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "assets"), { recursive: true });
await Promise.all([
  cp(path.join(source, "index.html"), path.join(output, "index.html")),
  cp(path.join(source, "styles.css"), path.join(output, "styles.css")),
  cp(path.join(source, "app.js"), path.join(output, "app.js")),
  cp(
    path.join(root, "public", "brand", "port-city-fc-logo.png"),
    path.join(output, "assets", "pcfc-logo.png"),
  ),
]);
await writeFile(
  path.join(output, "data.js"),
  `window.PCFC_DATA = ${JSON.stringify(data)};\n`,
  "utf8",
);

console.log(JSON.stringify({ output, files: 5, views: 9, status: "PASS" }));
