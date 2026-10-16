import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import vm from "node:vm";
import {
  financeModel,
  selectFixtures,
  fixtureMetrics,
  selectSponsors,
  sponsorMetrics,
  sponsorRisk,
  calculateSeasonScenario,
  controlSummary,
  validateHubModel,
  buildExport,
  csvText,
} from "../site/model.js";

const sandbox = { window: {} };
vm.runInNewContext(await readFile("dist/data.js", "utf8"), sandbox);
const data = JSON.parse(JSON.stringify(sandbox.window.PCFC_DATA));
const cases = [];
function check(name, run) {
  run();
  cases.push({ name, status: "PASS" });
}
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

check("FY24 annual controls; missing breakdown stays missing", () => {
  const f = financeModel(data, "FY24");
  assert.equal(f.inflow, 63200);
  assert.equal(f.outflow, 60950);
  assert.equal(f.netCash, 2250);
  assert.equal(f.monthly.length, 0);
  assert.equal(f.income.length, 0);
  assert.equal(f.expenses.length, 0);
  assert.equal(f.sponsorshipSharePct, null);
  assert.equal(f.changeInNet, null);
  assert.equal(f.inflowChangePct, null);
});
check("FY25 months, categories and annual values reconcile independently", () => {
  const f = financeModel(data, "FY25");
  assert.equal(f.monthly.length, 12);
  assert.equal(
    f.monthly.reduce((s, r) => s + r.inflow, 0),
    67500,
  );
  assert.equal(
    f.monthly.reduce((s, r) => s + r.outflow, 0),
    63700,
  );
  assert.equal(
    f.monthly.reduce((s, r) => s + r.net, 0),
    3800,
  );
  assert.equal(
    f.income.reduce((s, r) => s + r.amount, 0),
    67500,
  );
  assert.equal(
    f.expenses.reduce((s, r) => s + r.amount, 0),
    63700,
  );
  near(f.sponsorshipSharePct, (38000 / 67500) * 100);
  near(f.coverage, 67500 / 63700);
  assert.equal(f.changeInNet, 1550);
  near(f.netCashMarginPct, (3800 / 67500) * 100);
  assert.ok(f.monthly.some((r) => r.net < 0));
});
check("Unknown periods cannot silently fall back", () =>
  assert.throws(() => financeModel(data, "FY23")),
);
check("Fixture totals and opportunity-weighted denominators", () => {
  const m = fixtureMetrics(selectFixtures(data));
  assert.equal(m.count, 8);
  assert.equal(m.paid, 11839);
  assert.equal(m.revenue, 364580);
  assert.equal(m.cost, 244530);
  assert.equal(m.contribution, 120050);
  near(m.averagePaid, 1479.875);
  near(m.fillPct, (11839 / 42000) * 100);
  near(m.returningPct, 574603 / 11839);
  assert.equal(fixtureMetrics(selectFixtures(data, "Men")).contribution, 57370);
  assert.equal(fixtureMetrics(selectFixtures(data, "Women")).contribution, 62680);
});
check("Empty fixture denominator does not become zero percent", () => {
  const m = fixtureMetrics([]);
  assert.equal(m.averagePaid, null);
  assert.equal(m.fillPct, null);
  assert.equal(m.returningPct, null);
});
check("Sponsor sample totals, weighted delivery and renewal count", () => {
  const m = sponsorMetrics(selectSponsors(data));
  assert.equal(m.value, 139000);
  assert.equal(m.count, 6);
  assert.equal(m.delivered, 43);
  assert.equal(m.total, 54);
  near(m.deliveryPct, (43 / 54) * 100);
  assert.equal(m.overdue, 3);
  assert.equal(m.positive, 3);
});
for (const program of ["All", "Men", "Women"]) {
  check(`Sponsor search preserves ${program} scope`, () => {
    for (const q of ["", "Harbor", "Bluewater", "Club-wide", "not-present"]) {
      const rows = selectSponsors(data, program, q);
      assert.ok(
        rows.every((r) => program === "All" || r.program === program || r.program === "Club-wide"),
      );
      assert.equal(rows.length, new Set(rows.map((r) => r.id)).size);
    }
  });
}
check("Excluded-program searches return no accounts", () => {
  assert.equal(selectSponsors(data, "Women", "Harborline").length, 0);
  assert.equal(selectSponsors(data, "Men", "Bluewater").length, 0);
});
check("Empty sponsor selection has no invented delivery percentage", () =>
  assert.equal(sponsorMetrics([]).deliveryPct, null),
);
check("Sponsor ordering and all account risks are deterministic", () => {
  assert.equal(selectSponsors(data, "All", "", "value")[0].contractValue, 42000);
  assert.equal(selectSponsors(data, "All", "", "delivery")[0].id, "SP-004");
  assert.equal(sponsorRisk(data.sponsors.find((r) => r.id === "SP-005")), "Renewal discussion");
});
const simple = {
  id: "independent",
  name: "Independent worked example",
  program: "Men",
  expectedAttendance: 100,
  venueCapacity: 80,
  homeMatches: 2,
  ticketPrice: 10,
  complimentaryPct: 25,
  concessionParticipationPct: 20,
  averageConcessionSpend: 5,
  merchandiseParticipationPct: 10,
  averageMerchandiseSpend: 10,
  sponsorIncome: 100,
  communityAllocationPct: 10,
  weatherRiskPct: 10,
  operationalRiskPct: 10,
  marketingSpend: 100,
  staffing: 100,
  security: 0,
  officials: 0,
  venueCosts: 0,
  transportation: 0,
  equipment: 0,
  variableCostPerAttendee: 2.4,
};
check("Independent worked season example caps every attendee-linked revenue", () => {
  const r = calculateSeasonScenario(simple);
  assert.equal(r.attendance, 80);
  assert.equal(r.paidAttendance, 60);
  assert.equal(r.ticket, 1200);
  assert.equal(r.concession, 160);
  assert.equal(r.merchandise, 160);
  assert.equal(r.totalRevenue, 1620);
  assert.equal(r.fixedSeasonCost, 400);
  assert.equal(r.attendeeCost, 384);
  assert.equal(r.seasonCost, 784);
  assert.equal(r.community, 162);
  assert.equal(r.riskReserve, 304);
  assert.equal(r.contribution, 370);
  assert.equal(r.breakEven, 37);
  assert.ok(calculateSeasonScenario({ ...simple, expectedAttendance: 36 }).contribution < 0);
  assert.ok(calculateSeasonScenario({ ...simple, expectedAttendance: 37 }).contribution >= 0);
});
check("Impossible break-even, zero attendance and sponsor-funded zero threshold", () => {
  const zero = {
    ...simple,
    ticketPrice: 0,
    averageConcessionSpend: 0,
    averageMerchandiseSpend: 0,
    sponsorIncome: 0,
  };
  const r = calculateSeasonScenario({ ...zero, expectedAttendance: 0 });
  assert.equal(r.totalRevenue, 0);
  assert.equal(r.margin, null);
  assert.equal(r.breakEven, null);
  assert.equal(r.feasible, false);
  assert.equal(calculateSeasonScenario({ ...zero, sponsorIncome: 1000 }).breakEven, 0);
  assert.equal(calculateSeasonScenario({ ...simple, venueCapacity: 20 }).feasible, false);
});
check("Invalid or non-finite scenario values fail explicitly", () => {
  for (const patch of [
    { homeMatches: 0 },
    { homeMatches: 1.5 },
    { ticketPrice: -1 },
    { expectedAttendance: NaN },
    { venueCapacity: 0 },
    { complimentaryPct: 101 },
    { weatherRiskPct: 60, operationalRiskPct: 50 },
  ])
    assert.throws(() => calculateSeasonScenario({ ...simple, ...patch }));
});
for (const preset of data.scenarioPresets)
  check(`${preset.name} break-even satisfies the contribution equation`, () => {
    const r = calculateSeasonScenario(preset);
    near(r.contribution, r.totalRevenue - r.seasonCost - r.community - r.riskReserve);
    if (r.breakEven !== null && r.breakEven > 0 && r.feasible) {
      assert.ok(
        calculateSeasonScenario({ ...preset, expectedAttendance: r.breakEven }).contribution >=
          -1e-7,
      );
      assert.ok(
        calculateSeasonScenario({ ...preset, expectedAttendance: r.breakEven - 1 }).contribution <
          0,
      );
    }
  });
check("Passing controls are derived; missing or failing controls never pass", () => {
  assert.equal(controlSummary([]).allPass, false);
  assert.equal(controlSummary([{ difference: 0 }]).allPass, false);
  assert.equal(
    controlSummary([{ status: "PASS", difference: 0, actual: 1, expected: 2 }]).allPass,
    false,
  );
  assert.equal(controlSummary(validateHubModel(data)).allPass, true);
  const corrupt = structuredClone(data);
  corrupt.financeBreakdowns.FY25.monthly[0].outflow += 1;
  assert.ok(validateHubModel(corrupt).some((r) => r.status === "FAIL"));
});
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
for (const period of ["FY24", "FY25"])
  for (const program of ["All", "Men", "Women"])
    for (const view of views)
      check(`${view}/${period}/${program}: export contains scoped data and evidence`, () => {
        const context = {
          view,
          period,
          program,
          sponsorQuery: "",
          sponsorSort: "name",
          decisionFilter: "All",
          scenarioModel: data.scenarioPresets[1],
        };
        const out = buildExport(data, context, "export-view", "2026-10-16T00:00:00Z");
        assert.ok(out.rows.length > 9);
        assert.equal(out.rows[0][0], "Evidence class");
        assert.ok(out.rows[0][1].includes("not PCFC actuals"));
        if (["command", "finance"].includes(view)) {
          const annual = out.rows.find((r) => r[0] === period);
          assert.equal(annual[1], period === "FY24" ? 63200 : 67500);
          assert.equal(annual[2], period === "FY24" ? 60950 : 63700);
        }
        if (view === "programs" || view === "matchday") {
          const fixtureRows = out.rows.filter((r) => /^[MW]-0\d$/.test(r[0]));
          assert.equal(fixtureRows.length, program === "All" ? 8 : 4);
          assert.ok(fixtureRows.every((r) => program === "All" || r[2] === program));
        }
      });
check("Sponsor export obeys search and program together", () => {
  const ctx = {
    view: "commercial",
    period: "FY24",
    program: "Women",
    sponsorQuery: "Harborline",
    sponsorSort: "name",
    decisionFilter: "All",
  };
  const out = buildExport(data, ctx, "export-sponsors");
  assert.equal(out.rows.filter((r) => /^SP-/.test(r[0])).length, 0);
});
check("Export filenames use applicable scope, not stale disabled filters", () => {
  const ctx = {
    view: "finance",
    period: "FY24",
    program: "Women",
    decisionFilter: "High",
    sponsorQuery: "",
    sponsorSort: "name",
    scenarioModel: { ...simple, program: "Men" },
  };
  assert.ok(buildExport(data, ctx).filename.endsWith("fy24-clubwide.csv"));
  assert.ok(buildExport(data, { ...ctx, view: "scenarios" }).filename.endsWith("sample-men.csv"));
  assert.ok(buildExport(data, { ...ctx, view: "decisions" }).filename.endsWith("sample-high.csv"));
});
check("Decision export obeys priority", () => {
  const out = buildExport(data, {
    view: "decisions",
    period: "FY25",
    program: "All",
    decisionFilter: "High",
  });
  const rows = out.rows.filter((r) => /^DEC-/.test(r[0]));
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r[1] === "High"));
});
check("CSV quoting, numeric losses and formula-like text", () => {
  const text = csvText([["comma,value", 'a"b', "line\nbreak", -42, "=SUM(A1)", "@formula"]]);
  assert.ok(text.includes('"comma,value"'));
  assert.ok(text.includes('"a""b"'));
  assert.ok(text.includes('"-42"'));
  assert.ok(text.includes("'=SUM(A1)"));
  assert.ok(text.includes("'@formula"));
});
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/hub-numerical-verification.json",
  JSON.stringify(
    { status: "PASS", cases: cases.length, modelChecks: validateHubModel(data), tests: cases },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      status: "PASS",
      numericalAndExportCases: cases.length,
      calculatedModelControls: validateHubModel(data).length,
    },
    null,
    2,
  ),
);
