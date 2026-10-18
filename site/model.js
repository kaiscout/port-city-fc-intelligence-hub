// Pure selectors and measures shared by the browser and the numerical verification suite.
export const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field]), 0);
export const ratio = (numerator, denominator) => (denominator > 0 ? numerator / denominator : null);
export const EVIDENCE = "Synthetic demonstration data; not PCFC actuals";

export function financeModel(data, periodId = "FY25") {
  const period = data.financialPeriods.find((row) => row.id === periodId);
  if (!period) throw new Error(`Unknown financial period: ${periodId}`);
  const breakdown = data.financeBreakdowns[periodId];
  const monthly = breakdown?.monthly ?? [];
  const income = breakdown?.income ?? [];
  const expenses = breakdown?.expenses ?? [];
  const prior = data.financialPeriods.find((row) => row.endDate < period.startDate);
  return {
    ...period,
    monthly,
    income,
    expenses,
    coverage: ratio(period.inflow, period.outflow),
    netCashMarginPct: period.inflow ? (period.netCash / period.inflow) * 100 : null,
    changeInNet: prior ? period.netCash - prior.netCash : null,
    inflowChangePct: prior ? (period.inflow / prior.inflow - 1) * 100 : null,
    sponsorshipSharePct: income.length
      ? ratio(income.find((row) => row.name === "Sponsorship")?.amount ?? 0, period.inflow) * 100
      : null,
    scope: `${periodId} · club-wide synthetic cash model`,
    breakdownAvailable: Boolean(breakdown),
  };
}

export function selectFixtures(data, program = "All") {
  return data.fixtures
    .filter((row) => program === "All" || row.program === program)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function fixtureMetrics(fixtures) {
  const paid = sum(fixtures, "paid");
  const capacity = sum(fixtures, "capacity");
  const revenue = sum(fixtures, "totalRevenue");
  const cost = sum(fixtures, "cost");
  return {
    count: fixtures.length,
    paid,
    capacity,
    revenue,
    cost,
    ticketRevenue: sum(fixtures, "ticketRevenue"),
    contribution: revenue - cost,
    averagePaid: ratio(paid, fixtures.length),
    averageContribution: ratio(revenue - cost, fixtures.length),
    fillPct: capacity ? (paid / capacity) * 100 : null,
    returningPct: ratio(
      fixtures.reduce((total, row) => total + row.paid * row.returningPct, 0),
      paid,
    ),
    contributionMarginPct: revenue ? ((revenue - cost) / revenue) * 100 : null,
  };
}

export function selectSponsors(data, program = "All", query = "", sort = "name") {
  const term = query.trim().toLocaleLowerCase("en-US");
  const rows = data.sponsors.filter(
    (row) =>
      (program === "All" || row.program === program || row.program === "Club-wide") &&
      `${row.name} ${row.tier} ${row.program}`.toLocaleLowerCase("en-US").includes(term),
  );
  return rows.sort((a, b) => {
    const order =
      sort === "value"
        ? b.contractValue - a.contractValue
        : sort === "delivery"
          ? a.delivered / a.total - b.delivered / b.total
          : a.name.localeCompare(b.name);
    return order || a.id.localeCompare(b.id);
  });
}

export function sponsorMetrics(rows) {
  const delivered = sum(rows, "delivered");
  const total = sum(rows, "total");
  return {
    count: rows.length,
    value: sum(rows, "contractValue"),
    delivered,
    total,
    deliveryPct: total ? (delivered / total) * 100 : null,
    overdue: sum(rows, "overdue"),
    positive: rows.filter((row) => row.renewalIntent === "Positive").length,
  };
}

export function sponsorRisk(row) {
  return row.overdue > 0
    ? "Delivery recovery"
    : row.renewalIntent === "Positive"
      ? "No open delivery exception"
      : "Renewal discussion";
}

export function calculateSeasonScenario(model) {
  const numericKeys = [
    "expectedAttendance",
    "venueCapacity",
    "ticketPrice",
    "homeMatches",
    "complimentaryPct",
    "concessionParticipationPct",
    "averageConcessionSpend",
    "merchandiseParticipationPct",
    "averageMerchandiseSpend",
    "sponsorIncome",
    "communityAllocationPct",
    "weatherRiskPct",
    "operationalRiskPct",
    "marketingSpend",
    "staffing",
    "security",
    "officials",
    "venueCosts",
    "transportation",
    "equipment",
    "variableCostPerAttendee",
  ];
  for (const key of numericKeys)
    if (!Number.isFinite(model[key]) || model[key] < 0)
      throw new Error(`Invalid scenario input: ${key}`);
  if (model.venueCapacity <= 0 || model.homeMatches < 1 || !Number.isInteger(model.homeMatches))
    throw new Error("Capacity and whole home-match count must be positive");
  for (const key of numericKeys.filter((key) => key.endsWith("Pct")))
    if (model[key] > 100) throw new Error(`Invalid percentage: ${key}`);
  if (model.weatherRiskPct + model.operationalRiskPct > 100)
    throw new Error("Combined risk allowance cannot exceed 100%");
  const attendance = Math.min(model.expectedAttendance, model.venueCapacity);
  const paidAttendance = attendance * (1 - model.complimentaryPct / 100);
  const ticket = paidAttendance * model.ticketPrice * model.homeMatches;
  const concession =
    ((attendance * model.concessionParticipationPct) / 100) *
    model.averageConcessionSpend *
    model.homeMatches;
  const merchandise =
    ((attendance * model.merchandiseParticipationPct) / 100) *
    model.averageMerchandiseSpend *
    model.homeMatches;
  const variableSeasonRevenue = ticket + concession + merchandise;
  const directCostPerMatch = [
    "marketingSpend",
    "staffing",
    "security",
    "officials",
    "venueCosts",
    "transportation",
    "equipment",
  ].reduce((total, key) => total + model[key], 0);
  const fixedSeasonCost = directCostPerMatch * model.homeMatches;
  const attendeeCost = attendance * model.variableCostPerAttendee * model.homeMatches;
  const seasonCost = fixedSeasonCost + attendeeCost;
  const totalRevenue = variableSeasonRevenue + model.sponsorIncome;
  const communityRate = model.communityAllocationPct / 100;
  const riskRate = (model.weatherRiskPct + model.operationalRiskPct) / 100;
  const community = totalRevenue * communityRate;
  const riskReserve = variableSeasonRevenue * riskRate;
  const contribution = totalRevenue - seasonCost - community - riskReserve;
  const unitRevenue =
    model.ticketPrice * (1 - model.complimentaryPct / 100) +
    (model.concessionParticipationPct / 100) * model.averageConcessionSpend +
    (model.merchandiseParticipationPct / 100) * model.averageMerchandiseSpend;
  const unitContribution =
    unitRevenue * (1 - communityRate - riskRate) - model.variableCostPerAttendee;
  const unfundedFixedCost = fixedSeasonCost - model.sponsorIncome * (1 - communityRate);
  const breakEven =
    unfundedFixedCost <= 0
      ? 0
      : unitContribution > 0
        ? Math.ceil(unfundedFixedCost / (model.homeMatches * unitContribution) - 1e-10)
        : null;
  return {
    attendance,
    paidAttendance,
    ticket,
    concession,
    merchandise,
    variableSeasonRevenue,
    directCostPerMatch,
    fixedSeasonCost,
    attendeeCost,
    totalRevenue,
    seasonCost,
    community,
    riskReserve,
    contribution,
    unitContribution,
    breakEven,
    feasible: breakEven !== null && breakEven <= model.venueCapacity,
    margin: ratio(contribution, totalRevenue) === null ? null : (contribution / totalRevenue) * 100,
  };
}

export function controlSummary(checks = []) {
  const passed = checks.filter(
    (row) =>
      typeof row.status === "string" &&
      row.status.toUpperCase() === "PASS" &&
      row.difference === 0 &&
      row.actual === row.expected,
  ).length;
  return { passed, total: checks.length, allPass: checks.length > 0 && passed === checks.length };
}

export function validateHubModel(data) {
  const checks = [];
  const equal = (name, expected, actual, scope) =>
    checks.push({
      name,
      expected,
      actual,
      difference: Number.isFinite(actual) ? actual - expected : null,
      status: Number.isFinite(actual) && Math.abs(actual - expected) < 0.000001 ? "PASS" : "FAIL",
      scope,
    });
  for (const period of data.financialPeriods) {
    equal(
      `${period.id} net cash arithmetic`,
      period.netCash,
      period.inflow - period.outflow,
      "Synthetic finance",
    );
    const breakdown = data.financeBreakdowns[period.id];
    if (!breakdown) continue;
    equal(
      `${period.id} monthly inflow`,
      period.inflow,
      sum(breakdown.monthly, "inflow"),
      "Synthetic finance",
    );
    equal(
      `${period.id} monthly outflow`,
      period.outflow,
      sum(breakdown.monthly, "outflow"),
      "Synthetic finance",
    );
    equal(
      `${period.id} monthly net`,
      period.netCash,
      sum(breakdown.monthly, "net"),
      "Synthetic finance",
    );
    equal(
      `${period.id} income categories`,
      period.inflow,
      sum(breakdown.income, "amount"),
      "Synthetic finance",
    );
    equal(
      `${period.id} expense categories`,
      period.outflow,
      sum(breakdown.expenses, "amount"),
      "Synthetic finance",
    );
    equal(
      `${period.id} monthly row arithmetic`,
      0,
      breakdown.monthly.filter((row) => row.net !== row.inflow - row.outflow).length,
      "Synthetic finance",
    );
  }
  for (const [name, key] of [
    ["Monthly inflow to control", "inflow"],
    ["Monthly outflow to control", "outflow"],
    ["Net cash to control", "netCash"],
  ]) {
    equal(
      `FY25 ${key} to pipeline manifest`,
      data.reconciliation.checks.find((row) => row.name === name)?.actual,
      data.financialPeriods.find((row) => row.id === "FY25")[key],
      "Published bundle to source-model control",
    );
  }
  equal(
    "Pipeline manifest check count",
    7,
    data.reconciliation.checks.length,
    "Pipeline manifest contract",
  );
  equal(
    "Pipeline result consistency",
    0,
    data.reconciliation.checks.filter(
      (row) =>
        row.status !== "PASS" ||
        row.actual !== row.expected ||
        row.difference !== row.actual - row.expected,
    ).length,
    "Pipeline manifest contract",
  );
  equal(
    "Channel visits to funnel visits",
    data.funnelStages.find((row) => row.stage === "Website visits").value,
    sum(data.channelPerformance, "visits"),
    "2026 club-wide acquisition sample",
  );
  equal(
    "Channel purchases to funnel purchases",
    data.funnelStages.find((row) => row.stage === "Purchases").value,
    sum(data.channelPerformance, "purchases"),
    "2026 club-wide acquisition sample",
  );
  equal(
    "Sponsor receipts to FY25 sponsorship",
    data.financeBreakdowns.FY25.income.find((row) => row.name === "Sponsorship").amount,
    sum(data.sponsorReceipts, "amount"),
    "FY25 synthetic cash receipts",
  );
  equal(
    "Fixture bounds and revenue",
    0,
    data.fixtures.filter(
      (row) =>
        row.paid > row.capacity ||
        row.paid < 0 ||
        row.ticketRevenue > row.totalRevenue ||
        row.cost < 0 ||
        row.returningPct < 0 ||
        row.returningPct > 100,
    ).length,
    "2026 fixture sample",
  );
  equal(
    "Sponsor deliverable bounds",
    0,
    data.sponsors.filter(
      (row) =>
        row.delivered > row.total ||
        row.delivered < 0 ||
        row.overdue < 0 ||
        row.overdue > row.total - row.delivered ||
        row.contractValue < 0,
    ).length,
    "2026 sponsor sample",
  );
  for (const program of ["All", "Men", "Women"]) {
    const rows = selectFixtures(data, program);
    const metrics = fixtureMetrics(rows);
    equal(
      `${program} fixture contribution`,
      sum(rows, "totalRevenue") - sum(rows, "cost"),
      metrics.contribution,
      "2026 fixture sample",
    );
  }
  equal(
    "Fixture program partition",
    data.fixtures.length,
    selectFixtures(data, "Men").length + selectFixtures(data, "Women").length,
    "2026 fixture sample",
  );
  equal(
    "Distinct fixture IDs",
    data.fixtures.length,
    new Set(data.fixtures.map((row) => row.id)).size,
    "2026 fixture sample",
  );
  equal(
    "Distinct sponsor IDs",
    data.sponsors.length,
    new Set(data.sponsors.map((row) => row.id)).size,
    "2026 sponsor sample",
  );
  return checks;
}

export function csvText(rows) {
  return rows
    .map((row) =>
      row
        .map((raw) => {
          const value =
            typeof raw === "string" && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : String(raw ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}

export function buildExport(
  data,
  context,
  action = "export-view",
  generatedAt = new Date().toISOString(),
) {
  const finance = financeModel(data, context.period);
  const fixtures = selectFixtures(data, context.program);
  const sponsors = selectSponsors(data, context.program, context.sponsorQuery, context.sponsorSort);
  const decisions = data.decisions.filter(
    (row) => context.decisionFilter === "All" || row.priority === context.decisionFilter,
  );
  const kind = action === "export-view" ? context.view : action.replace("export-", "");
  const rows = [
    ["Evidence class", EVIDENCE],
    ["Project", data.meta.product],
    ["Release", data.meta.release],
    ["Input snapshot UTC", data.meta.snapshotAt],
    ["Build UTC", data.meta.builtAt],
    ["Export UTC", generatedAt],
    ["View", context.view],
  ];
  const section = (title, header, values) => rows.push([], [title], header, ...values);
  const annual = () =>
    section(
      "Annual synthetic cash totals · club-wide",
      ["Period", "Inflow", "Outflow", "Net cash movement", "Inflow/outflow", "Net cash margin %"],
      [
        [
          finance.id,
          finance.inflow,
          finance.outflow,
          finance.netCash,
          finance.coverage,
          finance.netCashMarginPct,
        ],
      ],
    );
  const financeDetail = () => {
    section(
      "Monthly synthetic cash · selected fiscal period",
      ["Period", "Month", "Inflow", "Outflow", "Net"],
      finance.monthly.map((row) => [finance.id, row.month, row.inflow, row.outflow, row.net]),
    );
    if (!finance.breakdownAvailable)
      rows.push(
        [],
        [
          "Availability",
          `${finance.id} has annual totals only. Monthly and category detail unavailable.`,
        ],
      );
    section(
      "Synthetic cash categories · selected fiscal period",
      ["Period", "Direction", "Category", "Amount", "Share %"],
      [
        ...finance.income.map((row) => [
          finance.id,
          "Inflow",
          row.name,
          row.amount,
          (row.amount / finance.inflow) * 100,
        ]),
        ...finance.expenses.map((row) => [
          finance.id,
          "Outflow",
          row.name,
          row.amount,
          (row.amount / finance.outflow) * 100,
        ]),
      ],
    );
  };
  const fixtureDetail = () => {
    rows.push([], ["Fixture scope", `2026 synthetic home-fixture sample · ${context.program}`]);
    section(
      "Synthetic fixture records",
      [
        "Fixture",
        "Date",
        "Program",
        "Opponent",
        "Venue",
        "Capacity",
        "Projected",
        "Paid",
        "Ticket revenue",
        "Total revenue",
        "Direct cost",
        "Direct contribution",
        "Returning %",
      ],
      fixtures.map((row) => [
        row.id,
        row.date,
        row.program,
        row.opponent,
        row.venue,
        row.capacity,
        row.projected,
        row.paid,
        row.ticketRevenue,
        row.totalRevenue,
        row.cost,
        row.totalRevenue - row.cost,
        row.returningPct,
      ]),
    );
    section(
      "Selected program measures",
      [
        "Program",
        "Fixtures",
        "Paid",
        "Capacity",
        "Revenue",
        "Cost",
        "Direct contribution",
        "Average paid",
        "Average contribution",
        "Aggregate fill %",
        "Paid-weighted returning %",
      ],
      (context.program === "All" ? ["Men", "Women"] : [context.program]).map((program) => {
        const m = fixtureMetrics(fixtures.filter((row) => row.program === program));
        return [
          program,
          m.count,
          m.paid,
          m.capacity,
          m.revenue,
          m.cost,
          m.contribution,
          m.averagePaid,
          m.averageContribution,
          m.fillPct,
          m.returningPct,
        ];
      }),
    );
  };
  const sponsorDetail = () => {
    rows.push(
      [],
      [
        "Sponsor scope",
        `2026 synthetic contracts · ${context.program} plus club-wide · search: ${context.sponsorQuery || "(none)"} · sort: ${context.sponsorSort}`,
      ],
    );
    section(
      "Visible synthetic sponsor accounts",
      [
        "ID",
        "Account",
        "Contract period",
        "Tier",
        "Program",
        "Contract face value",
        "Delivered",
        "Contracted",
        "Overdue",
        "Renewal intent",
        "Follow-up rule",
        "Next action",
      ],
      sponsors.map((row) => [
        row.id,
        row.name,
        row.period,
        row.tier,
        row.program,
        row.contractValue,
        row.delivered,
        row.total,
        row.overdue,
        row.renewalIntent,
        sponsorRisk(row),
        row.nextAction,
      ]),
    );
    section(
      "Visible sponsor measures",
      ["Measure", "Value"],
      Object.entries(sponsorMetrics(sponsors)),
    );
  };
  const channelDetail = () => {
    rows.push(
      [],
      ["Acquisition scope", data.meta.acquisitionScope],
      [
        "Filters",
        "Sponsor program, search and finance period do not filter the club-wide acquisition sample",
      ],
    );
    section(
      "Club-wide synthetic channels",
      ["Channel", "Visits", "Purchases", "Spend", "Conversion %", "Cost per purchase"],
      data.channelPerformance.map((row) => [
        row.channel,
        row.visits,
        row.purchases,
        row.spend,
        ratio(row.purchases, row.visits) * 100,
        ratio(row.spend, row.purchases),
      ]),
    );
    section(
      "Club-wide synthetic funnel",
      ["Stage", "Volume", "Step conversion %"],
      data.funnelStages.map((row, index) => [
        row.stage,
        row.value,
        index ? ratio(row.value, data.funnelStages[index - 1].value) * 100 : null,
      ]),
    );
  };
  const decisionDetail = () =>
    section(
      "Proposed decisions · approval pending",
      [
        "ID",
        "Priority",
        "Title",
        "Proposed owner",
        "Timing",
        "Status",
        "Evidence",
        "Recommendation",
      ],
      decisions.map((row) => [
        row.id,
        row.priority,
        row.title,
        row.owner,
        row.due,
        row.status,
        row.evidence,
        row.recommendation,
      ]),
    );
  if (["command", "finance"].includes(kind)) {
    annual();
    financeDetail();
  }
  if (["command", "fixtures", "programs", "matchday"].includes(kind)) fixtureDetail();
  if (["commercial", "sponsors"].includes(kind)) sponsorDetail();
  if (["commercial", "channels"].includes(kind)) channelDetail();
  if (["command", "decisions"].includes(kind)) decisionDetail();
  if (kind === "finance" || kind === "matchday")
    section(
      "Independent planning assumptions · not added to cash totals",
      ["Item", "Amount", "Basis", "Evidence"],
      data.commitments.map((row) => [row.item, row.amount, row.basis, row.confidence]),
    );
  if (kind === "matchday") {
    section(
      "Synthetic home-kit requirements · availability unverified",
      ["Item", "Assumed quantity", "Status"],
      data.matchdayNeeds
        .filter((row) => row.scope === "Home")
        .map((row) => [
          row.item,
          row.quantity,
          row.quantity == null ? "Unspecified" : "Quantity mapped",
        ]),
    );
    section(
      "Generalized matchday cost assumptions",
      ["Item", "Minimum", "Maximum", "Basis", "Treatment"],
      data.matchdayCosts.map((row) => [
        row.item,
        row.minimum,
        row.maximum,
        row.basis,
        row.treatment,
      ]),
    );
  }
  if (["scenarios", "scenario"].includes(kind)) {
    rows.push(
      [],
      [
        "Scenario scope",
        "Independent season planning model; no connection to historical cash or contract records",
      ],
    );
    section(
      "Scenario inputs · monetary cost inputs per fixture except season sponsor allocation",
      ["Input", "Value"],
      Object.entries(context.scenarioModel),
    );
    section(
      "Calculated season outputs",
      ["Output", "Value"],
      Object.entries(calculateSeasonScenario(context.scenarioModel)),
    );
  }
  if (kind === "quality") {
    section(
      "Hub model checks",
      ["Control", "Expected", "Actual", "Difference", "Status", "Scope"],
      validateHubModel(data).map((row) => [
        row.name,
        row.expected,
        row.actual,
        row.difference,
        row.status,
        row.scope,
      ]),
    );
    section(
      "Pipeline manifest checks",
      ["Control", "Expected", "Actual", "Difference", "Status"],
      data.reconciliation.checks.map((row) => [
        row.name,
        row.expected,
        row.actual,
        row.difference,
        row.status,
      ]),
    );
  }
  if (kind === "access")
    section(
      "Full application policy reference · not public-site authentication",
      ["Role", "Permission"],
      Object.entries(data.permissions).flatMap(([role, permissions]) =>
        permissions.map((permission) => [role, permission]),
      ),
    );
  if (["access", "audit"].includes(kind))
    section(
      "Synthetic audit examples · not this site's activity log",
      ["Time", "Actor role", "Action", "Object", "Result"],
      data.auditEvents.map((row) => [row.time, row.actor, row.action, row.object, row.result]),
    );
  if (rows.length <= 6) throw new Error(`No export implementation for ${kind}`);
  const scopeToken = [
    "command",
    "commercial",
    "sponsors",
    "fixtures",
    "matchday",
    "programs",
  ].includes(kind)
    ? context.program.toLowerCase()
    : ["scenario", "scenarios"].includes(kind)
      ? context.scenarioModel.program.toLowerCase()
      : kind === "decisions"
        ? context.decisionFilter.toLowerCase()
        : "clubwide";
  return {
    filename: `pcfc-${kind}-${["command", "finance"].includes(kind) ? context.period.toLowerCase() : "sample"}-${scopeToken}.csv`,
    rows,
  };
}
