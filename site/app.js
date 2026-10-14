const data = window.PCFC_DATA;
if (!data) throw new Error("PCFC public model was not loaded.");

const $ = (selector, parent = document) => parent.querySelector(selector);

const views = [
  {
    group: "Decision workspace",
    id: "command",
    label: "Command center",
    icon: "gauge",
    hint: "Executive priorities",
  },
  {
    group: "Decision workspace",
    id: "finance",
    label: "Finance & cash",
    icon: "finance",
    hint: "Cash and categories",
  },
  {
    group: "Decision workspace",
    id: "commercial",
    label: "Commercial",
    icon: "commercial",
    hint: "Sponsors and funnel",
  },
  {
    group: "Decision workspace",
    id: "matchday",
    label: "Matchday operations",
    icon: "calendar",
    hint: "Fixtures and readiness",
  },
  {
    group: "Decision workspace",
    id: "programs",
    label: "Program equity",
    icon: "balance",
    hint: "Men and Women",
  },
  {
    group: "Plan & decide",
    id: "scenarios",
    label: "Scenario lab",
    icon: "scenario",
    hint: "Sensitivity testing",
    badge: "Live",
  },
  {
    group: "Plan & decide",
    id: "decisions",
    label: "Decision register",
    icon: "decision",
    hint: "Owners and due dates",
    badge: "4",
  },
  {
    group: "Govern & trust",
    id: "quality",
    label: "Data quality",
    icon: "quality",
    hint: "Controls and lineage",
  },
  {
    group: "Govern & trust",
    id: "access",
    label: "Access & audit",
    icon: "access",
    hint: "Policy and events",
  },
];

const viewCopy = {
  command: {
    kicker: "Executive decision cockpit",
    title: "Know what changed. Decide what happens next.",
    description:
      "A single operating view of cash resilience, demand, commercial concentration, matchday readiness, and accountable actions.",
  },
  finance: {
    kicker: "Finance & cash",
    title: "Protect liquidity before approving growth.",
    description:
      "Reconciled cash movement, category concentration, monthly pressure points, and the evidence behind the modeled position.",
  },
  commercial: {
    kicker: "Commercial performance",
    title: "Turn reach and partnerships into repeatable revenue.",
    description:
      "Sponsor concentration, delivery health, renewal posture, acquisition conversion, and channel efficiency in one place.",
  },
  matchday: {
    kicker: "Matchday operations",
    title: "Make every home fixture operationally ready.",
    description:
      "Fixture economics, capacity signals, readiness controls, and cost assumptions designed for action before gates open.",
  },
  programs: {
    kicker: "Program equity",
    title: "Compare like with like—then fund the driver.",
    description:
      "A consistent comparison of the Men’s and Women’s programs using shared definitions, equivalent KPIs, and visible evidence limits.",
  },
  scenarios: {
    kicker: "Scenario lab",
    title: "Test the decision without pretending it is a forecast.",
    description:
      "Adjust attendance, price, match volume, and operating assumptions. Every output is calculated locally and remains clearly illustrative.",
  },
  decisions: {
    kicker: "Decision register",
    title: "Give every finding an owner and a next move.",
    description:
      "Prioritized decisions with evidence, recommendation, accountable owner, and timing—ready for an executive operating meeting.",
  },
  quality: {
    kicker: "Data quality & lineage",
    title: "Trust is a product feature, not a footnote.",
    description:
      "Control totals, freshness, privacy rules, and source-to-model lineage expose exactly why the public model can be used safely.",
  },
  access: {
    kicker: "Access & audit",
    title: "The interface is not the security boundary.",
    description:
      "Route policy, entity permissions, organization scope, transactional audit writes, and a transparent public-role contract.",
  },
};

const icons = {
  gauge:
    '<svg viewBox="0 0 24 24"><path d="M4 14a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><path d="M7 18h10"/></svg>',
  finance: '<svg viewBox="0 0 24 24"><path d="M4 19V9m5 10V5m6 14v-7m5 7V3"/></svg>',
  commercial:
    '<svg viewBox="0 0 24 24"><path d="M4 7h16v12H4z"/><path d="M8 7V4h8v3M4 12h16"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18m-13 4h3m2 0h3"/></svg>',
  balance:
    '<svg viewBox="0 0 24 24"><path d="M12 3v18M5 6h14M3 17h6l-3-7-3 7Zm12 0h6l-3-7-3 7ZM8 21h8"/></svg>',
  scenario:
    '<svg viewBox="0 0 24 24"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M8 7h8M7 9l4 6m6-6-4 6"/></svg>',
  decision:
    '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="m8 9 2 2 5-5M8 15h8"/></svg>',
  quality:
    '<svg viewBox="0 0 24 24"><path d="m12 3 8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4Z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  access:
    '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7m2-8 4 2v3c0 2-1.5 3.5-4 4-2.5-.5-4-2-4-4v-3l4-2Z"/></svg>',
};

const state = {
  view:
    location.hash.slice(1) && views.some((view) => view.id === location.hash.slice(1))
      ? location.hash.slice(1)
      : "command",
  period: localStorage.getItem("pcfc-period") || "FY25",
  program: localStorage.getItem("pcfc-program") || "All",
  theme: localStorage.getItem("pcfc-theme") || "light",
  cashMode: "flow",
  decisionFilter: "All",
  paletteIndex: 0,
};

const baseline =
  data.scenarioPresets.find((scenario) => scenario.id === "baseline") || data.scenarioPresets[0];
let scenarioModel = { ...baseline, homeMatches: 10 };

const formatCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const formatNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const money = (value) => formatCurrency.format(Math.round(Number(value) || 0));
const number = (value) => formatNumber.format(Math.round(Number(value) || 0));
const compact = (value) => formatCompact.format(Number(value) || 0);
const percent = (value, digits = 1) => `${(Number(value) || 0).toFixed(digits)}%`;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function selectedPeriod() {
  return (
    data.financialPeriods.find((period) => period.id === state.period) ||
    data.financialPeriods.at(-1)
  );
}

function periodScale() {
  const current = data.financialPeriods.at(-1);
  const selected = selectedPeriod();
  return current?.inflow ? selected.inflow / current.inflow : 1;
}

function filteredFixtures() {
  return state.program === "All"
    ? data.fixtures
    : data.fixtures.filter((fixture) => fixture.program === state.program);
}

function renderNav() {
  const groups = [...new Set(views.map((view) => view.group))];
  $("#primary-nav").innerHTML = groups
    .map(
      (group) =>
        `<section class="nav-group"><p class="nav-label">${group}</p>${views
          .filter((view) => view.group === group)
          .map(
            (view) =>
              `<button class="nav-item ${view.id === state.view ? "active" : ""}" data-view="${view.id}" type="button" aria-current="${view.id === state.view ? "page" : "false"}">${icons[view.icon]}<span>${view.label}</span>${view.badge ? `<em>${view.badge}</em>` : ""}</button>`,
          )
          .join("")}</section>`,
    )
    .join("");
}

function viewHeader(actions = true) {
  const copy = viewCopy[state.view];
  return `<header class="view-header"><div><span class="section-kicker">${copy.kicker}</span><h1>${copy.title}</h1><p>${copy.description}</p></div>${
    actions
      ? `<div class="view-actions"><button class="secondary-button" data-action="export-view">⇩ Export view</button><button class="primary-button" data-action="open-decisions">Open decisions →</button></div>`
      : ""
  }</header>`;
}

function sparkline(values, tone = "primary") {
  const width = 76;
  const height = 27;
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = maximum - minimum || 1;
  const points = values
    .map(
      (value, index) =>
        `${(index / Math.max(1, values.length - 1)) * width},${height - 3 - ((value - minimum) / range) * (height - 6)}`,
    )
    .join(" ");
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${tone === "positive" ? "var(--teal-600)" : tone === "negative" ? "var(--red-600)" : "var(--blue-600)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function metricCard({ label, value, delta, tone = "", tooltip, series = [] }) {
  return `<article class="card metric-card interactive"><div class="metric-top"><span>${label}</span><button type="button" data-tooltip="${tooltip}" aria-label="${tooltip}">i</button></div><strong class="metric-value">${value}</strong><span class="metric-delta ${tone}">${tone === "positive" ? "↗" : tone === "negative" ? "↘" : "—"} ${delta}</span>${series.length ? sparkline(series, tone) : ""}</article>`;
}

function panel(title, subtitle, body, options = {}) {
  return `<article class="card panel ${options.className || ""}"><div class="panel-head"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${options.action || '<button class="panel-menu" type="button" aria-label="Panel options">•••</button>'}</div>${body}</article>`;
}

function lineChart(series, labels, options = {}) {
  const width = 760;
  const height = options.height || 250;
  const pad = { top: 18, right: 20, bottom: 30, left: 45 };
  const values = series.flatMap((item) => item.values);
  const maximum = Math.max(...values) * 1.12;
  const minimum = options.zero === false ? Math.min(...values) * 0.9 : 0;
  const range = maximum - minimum || 1;
  const x = (index) =>
    pad.left + (index / Math.max(1, labels.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (1 - (value - minimum) / range) * (height - pad.top - pad.bottom);
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const yy = pad.top + ratio * (height - pad.top - pad.bottom);
      const value = maximum - ratio * range;
      return `<line class="chart-grid-line" x1="${pad.left}" x2="${width - pad.right}" y1="${yy}" y2="${yy}"/><text class="chart-axis-label" x="${pad.left - 9}" y="${yy + 3}" text-anchor="end">${options.currency ? `$${compact(value)}` : compact(value)}</text>`;
    })
    .join("");
  const axes = labels
    .map((label, index) =>
      index % Math.max(1, Math.ceil(labels.length / 6)) === 0 || index === labels.length - 1
        ? `<text class="chart-axis-label" x="${x(index)}" y="${height - 7}" text-anchor="middle">${label.replace(" 25", "")}</text>`
        : "",
    )
    .join("");
  const paths = series
    .map((item, seriesIndex) => {
      const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
      const pathClass = seriesIndex === 0 ? "chart-path-primary" : "chart-path-secondary";
      const area =
        seriesIndex === 0 && options.area
          ? `<polygon class="chart-area" points="${x(0)},${height - pad.bottom} ${points} ${x(labels.length - 1)},${height - pad.bottom}"/>`
          : "";
      const dots = item.values
        .map(
          (value, index) =>
            `<circle class="chart-point" tabindex="0" cx="${x(index)}" cy="${y(value)}" r="3.6" data-tooltip="${labels[index]} · ${item.name}: ${options.currency ? money(value) : number(value)}"/>`,
        )
        .join("");
      return `${area}<polyline class="${pathClass}" points="${points}"/>${dots}`;
    })
    .join("");
  return `<div class="chart-wrap ${options.compact ? "compact" : ""}"><svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.label || "Trend chart"}"><defs><linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue-500)" stop-opacity=".24"/><stop offset="1" stop-color="var(--blue-500)" stop-opacity="0"/></linearGradient></defs>${grid}${axes}${paths}</svg></div><div class="legend">${series.map((item, index) => `<span><i style="background:${index === 0 ? "var(--blue-600)" : "var(--teal-600)"}"></i>${item.name}</span>`).join("")}</div>`;
}

function groupedBarChart(rows, options = {}) {
  const width = 760;
  const height = options.height || 245;
  const pad = { top: 15, right: 15, bottom: 34, left: 42 };
  const maximum = Math.max(...rows.flatMap((row) => [row.a, row.b || 0])) * 1.12;
  const innerWidth = width - pad.left - pad.right;
  const groupWidth = innerWidth / rows.length;
  const barWidth = Math.min(18, groupWidth * 0.28);
  const y = (value) => pad.top + (1 - value / maximum) * (height - pad.top - pad.bottom);
  const grid = [0, 0.5, 1]
    .map((ratio) => {
      const yy = pad.top + ratio * (height - pad.top - pad.bottom);
      return `<line class="chart-grid-line" x1="${pad.left}" x2="${width - pad.right}" y1="${yy}" y2="${yy}"/><text class="chart-axis-label" x="${pad.left - 8}" y="${yy + 3}" text-anchor="end">$${compact(maximum * (1 - ratio))}</text>`;
    })
    .join("");
  const bars = rows
    .map((row, index) => {
      const center = pad.left + groupWidth * index + groupWidth / 2;
      const aHeight = height - pad.bottom - y(row.a);
      const bHeight = height - pad.bottom - y(row.b || 0);
      return `<rect x="${center - barWidth - 2}" y="${y(row.a)}" width="${barWidth}" height="${aHeight}" rx="3" fill="var(--blue-600)" tabindex="0" data-tooltip="${row.label} inflow · ${money(row.a)}"/><rect x="${center + 2}" y="${y(row.b || 0)}" width="${barWidth}" height="${bHeight}" rx="3" fill="var(--teal-600)" opacity=".72" tabindex="0" data-tooltip="${row.label} outflow · ${money(row.b || 0)}"/><text class="chart-axis-label" x="${center}" y="${height - 9}" text-anchor="middle">${row.label.replace(" 25", "")}</text>`;
    })
    .join("");
  return `<div class="chart-wrap compact"><svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly inflow and outflow">${grid}${bars}</svg></div><div class="legend"><span><i style="background:var(--blue-600)"></i>Inflow</span><span><i style="background:var(--teal-600)"></i>Outflow</span></div>`;
}

function donut(categories, total) {
  const palette = ["#0e638f", "#0c9481", "#27a7d2", "#e4a43d", "#7a88c9", "#93a6b2"];
  let cursor = 0;
  const stops = categories.map((item, index) => {
    const start = cursor;
    cursor += (item.amount / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  });
  return `<div class="donut-layout"><div class="donut" style="background:conic-gradient(${stops.join(",")})"><div class="donut-center"><b>${money(total)}</b><small>modeled income</small></div></div><div class="legend-list">${categories
    .map(
      (item, index) =>
        `<button class="legend-button" data-category="${item.name}" type="button"><i style="background:${palette[index % palette.length]}"></i><span>${item.name}</span><b>${percent((item.amount / total) * 100)}</b></button>`,
    )
    .join("")}</div></div>`;
}

function commandView() {
  const period = selectedPeriod();
  const current = data.financialPeriods.at(-1);
  const prior = data.financialPeriods.at(-2);
  const scale = periodScale();
  const fixtures = filteredFixtures();
  const averageAttendance =
    fixtures.reduce((sum, fixture) => sum + fixture.paid, 0) / Math.max(1, fixtures.length);
  const contribution = fixtures.reduce(
    (sum, fixture) => sum + fixture.totalRevenue - fixture.cost,
    0,
  );
  const margin = (period.netCash / period.inflow) * 100;
  const sponsorShare = (data.incomeCategories[0].amount / current.inflow) * 100;
  const monthly = data.monthlyCash.map((row) => ({
    ...row,
    inflow: row.inflow * scale,
    outflow: row.outflow * scale,
    net: row.net * scale,
  }));
  const plan = monthly.map((row, index) => Math.round(row.inflow * (index < 6 ? 0.94 : 1.05)));
  const cashSeries =
    state.cashMode === "net"
      ? [{ name: "Monthly net", values: monthly.map((row) => row.net) }]
      : [
          { name: "Modeled inflow", values: monthly.map((row) => row.inflow) },
          { name: "Planning line", values: plan },
        ];
  const metricSeries = monthly.map((row) => row.net);
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Net cash", value: money(period.netCash), delta: `${money(period.netCash - prior.netCash)} vs benchmark`, tone: "positive", tooltip: "Modeled inflow less modeled outflow for the selected period.", series: metricSeries })}
      ${metricCard({ label: "Cash coverage", value: `${(period.inflow / period.outflow).toFixed(2)}×`, delta: `${percent(margin)} operating margin`, tone: margin > 4 ? "positive" : "negative", tooltip: "Modeled income divided by modeled operating spend.", series: monthly.map((row) => row.inflow / row.outflow) })}
      ${metricCard({ label: "Sponsor concentration", value: percent(sponsorShare), delta: "Largest modeled income dependency", tone: "negative", tooltip: "Share of modeled income attributed to sponsorship.", series: [48, 50, 51, 54, 55, sponsorShare] })}
      ${metricCard({ label: `${state.program === "All" ? "Average" : state.program} paid attendance`, value: number(averageAttendance), delta: `${money(contribution)} fixture contribution`, tone: "positive", tooltip: "Average paid attendance across the selected program filter.", series: fixtures.map((fixture) => fixture.paid) })}
    </section>
    <section class="dashboard-grid">
      ${panel(
        "Cash position & plan",
        "Switch between gross flow and monthly net movement; hover a point for its modeled value.",
        lineChart(
          cashSeries,
          monthly.map((row) => row.month),
          {
            currency: true,
            area: true,
            label:
              state.cashMode === "net"
                ? "Monthly net cash movement"
                : "Monthly cash position and plan",
          },
        ),
        {
          action: `<div class="segmented" aria-label="Cash chart display"><button class="${state.cashMode === "flow" ? "active" : ""}" data-cash-mode="flow" type="button">Flow</button><button class="${state.cashMode === "net" ? "active" : ""}" data-cash-mode="net" type="button">Net</button></div>`,
        },
      )}
      ${panel(
        "Owner attention queue",
        "The three items most likely to change the operating plan.",
        `<div class="decision-list">${data.decisions
          .slice(0, 3)
          .map(
            (decision) =>
              `<button class="decision-row" data-decision="${decision.id}" type="button"><span class="priority-bar ${decision.priority.toLowerCase()}"></span><span><b>${decision.title}</b><small>${decision.owner} · ${decision.status}</small></span><time>${decision.due}</time></button>`,
          )
          .join(
            "",
          )}</div><button class="ghost-button" data-view="decisions" type="button">View decision register →</button>`,
        { action: '<span class="status-pill risk">3 need attention</span>' },
      )}
    </section>
    <section class="dashboard-grid">
      ${panel("Income mix", "Select a category to open its evidence and management implication.", donut(data.incomeCategories, current.inflow), { action: '<span class="status-pill warn">Concentration watch</span>' })}
      ${panel("Season readiness", "Operating controls required before the first modeled home fixture.", `<div class="readiness-strip"><div class="readiness-step"><span>✓</span><b>Staff coverage</b><small>12 core roles covered</small></div><div class="readiness-step"><span>✓</span><b>Matchday kit</b><small>Core needs mapped</small></div><div class="readiness-step warn"><span>!</span><b>Fixture split</b><small>Evidence gap open</small></div><div class="readiness-step"><span>✓</span><b>Data controls</b><small>7 of 7 pass</small></div></div><div class="callout info" style="margin-top:12px"><b>Recommended operating cadence:</b> review the decision queue weekly, scenario assumptions monthly, and evidence controls at every data refresh.</div>`, { action: '<span class="status-pill good">82% ready</span>' })}
    </section>`;
}

function financeView() {
  const period = selectedPeriod();
  const scale = periodScale();
  const monthly = data.monthlyCash.map((row) => ({
    label: row.month,
    a: row.inflow * scale,
    b: row.outflow * scale,
  }));
  const categories = [...data.expenseCategories].sort((a, b) => b.amount - a.amount);
  const maximum = Math.max(...categories.map((item) => item.amount));
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Modeled income", value: money(period.inflow), delta: `${percent(((period.inflow - data.financialPeriods[0].inflow) / data.financialPeriods[0].inflow) * 100)} vs prior benchmark`, tone: "positive", tooltip: "Synthetic modeled inflow for the selected period.", series: data.monthlyCash.map((row) => row.inflow * scale) })}
      ${metricCard({ label: "Modeled spend", value: money(period.outflow), delta: `${percent((period.outflow / period.inflow) * 100)} of income`, tone: period.outflow / period.inflow < 0.95 ? "positive" : "negative", tooltip: "Synthetic operating outflow for the selected period.", series: data.monthlyCash.map((row) => row.outflow * scale) })}
      ${metricCard({ label: "Net cash", value: money(period.netCash), delta: `${percent((period.netCash / period.inflow) * 100)} margin`, tone: "positive", tooltip: "Modeled income less modeled spend.", series: data.monthlyCash.map((row) => row.net * scale) })}
      ${metricCard({ label: "Largest spend line", value: money(categories[0].amount * scale), delta: categories[0].name, tone: "", tooltip: "Largest modeled expense category in the public dataset.", series: categories.slice(0, 6).map((row) => row.amount) })}
    </section>
    <section class="section-grid">
      <div class="span-8">${panel("Monthly cash rhythm", "The pattern matters more than the annual total: summer outflow pressure follows early-season receipts.", groupedBarChart(monthly), { action: '<span class="status-pill good">Reconciled</span>' })}</div>
      <div class="span-4">${panel("Liquidity brief", "Management interpretation of the selected period.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Coverage ratio</small><b>${(period.inflow / period.outflow).toFixed(2)}×</b><span>Income ÷ operating spend</span></div><div class="scenario-output"><small>Margin</small><b>${percent((period.netCash / period.inflow) * 100)}</b><span>Net cash ÷ income</span></div></div><div class="callout warn" style="margin-top:10px"><b>Decision rule:</b> do not approve an operating case that takes modeled coverage below 1.05× without a named funding source.</div><button class="ghost-button" data-view="scenarios" type="button">Stress-test the threshold →</button>`, { action: '<span class="status-pill warn">Threshold watch</span>' })}</div>
      <div class="span-7">${panel("Expense concentration", "Ranked modeled categories with share of spend.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Modeled value</th><th>Share</th><th>Relative scale</th></tr></thead><tbody>${categories.map((item) => `<tr data-category="${item.name}"><td><strong>${item.name}</strong></td><td>${money(item.amount * scale)}</td><td>${percent((item.amount / data.financialPeriods.at(-1).outflow) * 100)}</td><td><div class="bar-meter"><span><i style="width:${(item.amount / maximum) * 100}%"></i></span></div></td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-finance">Export CSV</button>' })}</div>
      <div class="span-5">${panel("Evidence & commitments", "Confirmed commitments are separated from approximate planning assumptions.", `<div class="decision-list">${data.commitments.map((item) => `<button class="decision-row" data-detail="commitment:${item.item}" type="button"><span class="priority-bar ${item.confidence.includes("Approximate") ? "" : "high"}"></span><span><b>${item.item}</b><small>${item.basis}</small></span><time>${money(item.amount)}</time></button>`).join("")}</div><div class="callout info" style="margin-top:10px">The hub never silently promotes an assumption into an approved actual or forecast.</div>`, { action: '<span class="status-pill good">Evidence labeled</span>' })}</div>
    </section>`;
}

function commercialView() {
  const sponsors =
    state.program === "All"
      ? data.sponsors
      : data.sponsors.filter(
          (sponsor) => sponsor.program === state.program || sponsor.program === "Club-wide",
        );
  const contractValue = sponsors.reduce((sum, sponsor) => sum + sponsor.contractValue, 0);
  const delivered = sponsors.reduce((sum, sponsor) => sum + sponsor.delivered, 0);
  const total = sponsors.reduce((sum, sponsor) => sum + sponsor.total, 0);
  const overdue = sponsors.reduce((sum, sponsor) => sum + sponsor.overdue, 0);
  const purchases = data.funnelStages.find((stage) => stage.stage === "Purchases")?.value || 0;
  const visits = data.funnelStages.find((stage) => stage.stage === "Website visits")?.value || 1;
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Modeled contract value", value: money(contractValue), delta: `${sponsors.length} synthetic accounts`, tone: "positive", tooltip: "Synthetic sponsor portfolio used to demonstrate commercial analysis.", series: sponsors.map((sponsor) => sponsor.contractValue) })}
      ${metricCard({ label: "Delivery completion", value: percent((delivered / total) * 100, 0), delta: `${overdue} overdue deliverables`, tone: overdue ? "negative" : "positive", tooltip: "Delivered assets divided by contracted assets.", series: sponsors.map((sponsor) => (sponsor.delivered / sponsor.total) * 100) })}
      ${metricCard({ label: "Purchase conversion", value: percent((purchases / visits) * 100), delta: "Website visit to purchase", tone: "", tooltip: "Synthetic digital funnel conversion.", series: data.funnelStages.map((stage) => stage.value) })}
      ${metricCard({ label: "Positive renewal intent", value: number(sponsors.filter((sponsor) => sponsor.renewalIntent === "Positive").length), delta: `of ${sponsors.length} modeled accounts`, tone: "positive", tooltip: "Synthetic renewal posture for portfolio demonstration.", series: sponsors.map((sponsor) => sponsor.engagementPct) })}
    </section>
    <section class="section-grid">
      <div class="span-7">${panel("Sponsor portfolio", "Search, sort mentally, and open any row for a focused renewal brief.", `<div style="display:flex;gap:8px;margin-bottom:10px"><input id="sponsor-search" type="search" placeholder="Filter sponsors…" style="flex:1;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);color:var(--ink)"><button class="secondary-button" data-action="export-sponsors">Export</button></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Account</th><th>Program</th><th>Value</th><th>Delivery</th><th>Renewal</th></tr></thead><tbody id="sponsor-table-body">${sponsorRows(sponsors)}</tbody></table></div>`, { action: '<span class="status-pill warn">Renewal watch</span>' })}</div>
      <div class="span-5">${panel("Acquisition funnel", "Each stage is selectable for conversion detail.", `<div class="funnel">${data.funnelStages.map((stage, index) => `<button class="funnel-row" data-detail="funnel:${stage.stage}" type="button" style="border:0;background:transparent;width:100%;text-align:left"><span>${stage.stage}</span><span class="funnel-track"><i style="width:${(stage.value / data.funnelStages[0].value) * 100}%"></i></span><b>${compact(stage.value)}</b></button>${index ? "" : ""}`).join("")}</div>`, { action: '<span class="status-pill good">7 stages</span>' })}</div>
      <div class="span-7">${panel("Channel efficiency", "Synthetic acquisition channels ranked by purchase volume and cost per purchase.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Channel</th><th>Visits</th><th>Purchases</th><th>Conversion</th><th>Cost / purchase</th></tr></thead><tbody>${data.channelPerformance.map((channel) => `<tr><td><strong>${channel.channel}</strong></td><td>${number(channel.visits)}</td><td>${number(channel.purchases)}</td><td>${percent((channel.purchases / channel.visits) * 100)}</td><td>${money(channel.spend / channel.purchases)}</td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-channels">Export CSV</button>' })}</div>
      <div class="span-5">${panel("Commercial risk map", "Prioritize delivery recovery and renewal planning together.", `<div class="risk-matrix"><div class="risk-cell"><small>Low risk · low value</small><br><span class="risk-chip">Riverwalk Coffee</span></div><div class="risk-cell"><small>Delivery risk · low value</small><br><span class="risk-chip">Dockside Legal</span></div><div class="risk-cell"><small>Secure · high value</small><br><span class="risk-chip">Cape Fear Health</span><span class="risk-chip">Bluewater</span></div><div class="risk-cell"><small>Renewal risk · high value</small><br><span class="risk-chip">Harborline Brewing</span></div></div>`, { action: '<span class="status-pill risk">2 interventions</span>' })}</div>
    </section>`;
}

function sponsorRows(sponsors) {
  return sponsors
    .map(
      (sponsor) =>
        `<tr data-detail="sponsor:${sponsor.id}"><td><strong>${sponsor.name}</strong><br><small>${sponsor.tier}</small></td><td>${sponsor.program}</td><td>${money(sponsor.contractValue)}</td><td><div class="bar-meter"><span><i style="width:${(sponsor.delivered / sponsor.total) * 100}%"></i></span><b>${sponsor.delivered}/${sponsor.total}</b></div></td><td><span class="status-pill ${sponsor.renewalIntent === "Positive" ? "good" : sponsor.renewalIntent === "Neutral" ? "warn" : "risk"}">${sponsor.renewalIntent}</span></td></tr>`,
    )
    .join("");
}

function matchdayView() {
  const fixtures = filteredFixtures();
  const contribution = fixtures.reduce(
    (sum, fixture) => sum + fixture.totalRevenue - fixture.cost,
    0,
  );
  const averagePaid =
    fixtures.reduce((sum, fixture) => sum + fixture.paid, 0) / Math.max(1, fixtures.length);
  const fillRate =
    fixtures.reduce((sum, fixture) => sum + fixture.paid / fixture.capacity, 0) /
    Math.max(1, fixtures.length);
  const averageContribution = contribution / Math.max(1, fixtures.length);
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Modeled fixtures", value: number(fixtures.length), delta: `${state.program} program filter`, tone: "", tooltip: "Synthetic fixture records available under the selected program filter.", series: fixtures.map((fixture) => fixture.paid) })}
      ${metricCard({ label: "Average paid attendance", value: number(averagePaid), delta: `${percent(fillRate * 100)} venue fill`, tone: "positive", tooltip: "Paid attendance divided by selected fixtures.", series: fixtures.map((fixture) => fixture.paid) })}
      ${metricCard({ label: "Average contribution", value: money(averageContribution), delta: "Revenue less direct fixture cost", tone: averageContribution > 0 ? "positive" : "negative", tooltip: "Synthetic total fixture revenue minus modeled direct cost.", series: fixtures.map((fixture) => fixture.totalRevenue - fixture.cost) })}
      ${metricCard({ label: "Readiness confidence", value: "82%", delta: "Fixture split remains open", tone: "", tooltip: "Illustrative readiness score across staffing, kit, data, and fixture evidence.", series: [58, 64, 71, 76, 82] })}
    </section>
    ${panel("Modeled fixture book", "Open a fixture to see the unit economics and operating watchpoints.", `<div class="fixture-grid">${fixtures.map((fixture) => `<button class="card fixture-card interactive" data-fixture="${fixture.id}" type="button" style="text-align:left"><span class="fixture-date">${new Date(`${fixture.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fixture.program}</span><h3>vs ${fixture.opponent}</h3><p>${fixture.venue}</p><div class="fixture-metrics"><div><small>Paid</small><b>${number(fixture.paid)}</b></div><div><small>Contribution</small><b>${money(fixture.totalRevenue - fixture.cost)}</b></div></div></button>`).join("")}</div>`, { action: '<button class="secondary-button" data-action="export-fixtures">Export schedule</button>' })}
    <section class="section-grid">
      <div class="span-7">${panel("Matchday unit economics", "Planning assumptions remain visible beside the modeled output.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Cost / driver</th><th>Range</th><th>Basis</th><th>Treatment</th></tr></thead><tbody>${data.matchdayCosts.map((item) => `<tr data-detail="cost:${item.item}"><td><strong>${item.item}</strong></td><td>${item.minimum === item.maximum ? money(item.minimum) : `${money(item.minimum)}–${money(item.maximum)}`}</td><td>${item.basis}</td><td>${item.treatment}</td></tr>`).join("")}</tbody></table></div>`, { action: '<span class="status-pill warn">Assumptions</span>' })}</div>
      <div class="span-5">${panel(
        "Next-fixture checklist",
        "A convenient owner view of the operational minimum.",
        `<div class="decision-list">${data.matchdayNeeds
          .filter((item) => item.scope === "Home")
          .map(
            (item, index) =>
              `<div class="decision-row"><span class="priority-bar ${index === 0 ? "high" : ""}"></span><span><b>${item.item}</b><small>${item.quantity == null ? "Quantity to confirm" : `${item.quantity} required`}</small></span><span class="status-pill ${item.quantity == null ? "warn" : "good"}">${item.quantity == null ? "Check" : "Ready"}</span></div>`,
          )
          .join(
            "",
          )}</div><button class="ghost-button" data-view="decisions" type="button">Escalate an open item →</button>`,
        { action: '<span class="status-pill good">3 ready</span>' },
      )}</div>
    </section>`;
}

function programsView() {
  const programStats = ["Men", "Women"].map((program) => {
    const fixtures = data.fixtures.filter((fixture) => fixture.program === program);
    return {
      program,
      fixtures: fixtures.length,
      paid: fixtures.reduce((sum, fixture) => sum + fixture.paid, 0) / fixtures.length,
      contribution: fixtures.reduce((sum, fixture) => sum + fixture.totalRevenue - fixture.cost, 0),
      returning: fixtures.reduce((sum, fixture) => sum + fixture.returningPct, 0) / fixtures.length,
      revenue: fixtures.reduce((sum, fixture) => sum + fixture.totalRevenue, 0),
    };
  });
  return `${viewHeader()}
    <div class="comparison-grid">${programStats.map((program) => `<article class="card program-card ${program.program.toLowerCase()}"><span class="section-kicker">${program.program}’s program</span><h2>${money(program.revenue)}</h2><p>Modeled fixture revenue across ${program.fixtures} synthetic home fixtures.</p><div class="program-metrics"><div><small>Avg paid attendance</small><b>${number(program.paid)}</b></div><div><small>Total contribution</small><b>${money(program.contribution)}</b></div><div><small>Returning supporters</small><b>${percent(program.returning, 0)}</b></div></div></article>`).join("")}</div>
    <section class="section-grid">
      <div class="span-8">${panel(
        "Equivalent KPI comparison",
        "Both programs use the same definitions and grain.",
        lineChart(
          [
            {
              name: "Men",
              values: [
                programStats[0].paid,
                programStats[0].contribution / 10,
                programStats[0].returning * 30,
              ],
            },
            {
              name: "Women",
              values: [
                programStats[1].paid,
                programStats[1].contribution / 10,
                programStats[1].returning * 30,
              ],
            },
          ],
          ["Paid attendance", "Contribution index", "Return index"],
          { zero: true, label: "Program comparison", compact: true },
        ),
        { action: '<span class="status-pill good">Like-for-like</span>' },
      )}</div>
      <div class="span-4">${panel("Allocation guardrails", "Questions to answer before reallocating shared resources.", `<div class="decision-list"><div class="decision-row"><span class="priority-bar high"></span><span><b>Is the KPI definition identical?</b><small>Use one attendance and contribution definition.</small></span></div><div class="decision-row"><span class="priority-bar"></span><span><b>Is the fixture opportunity equivalent?</b><small>Normalize for capacity and match volume.</small></span></div><div class="decision-row"><span class="priority-bar"></span><span><b>Is the evidence complete?</b><small>Do not turn unknown home/away mix into a finding.</small></span></div></div>`, { action: '<span class="status-pill warn">Governed</span>' })}</div>
      <div class="span-12">${panel("Program evidence table", "Fixture-level data supporting the comparison.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Fixture</th><th>Program</th><th>Paid</th><th>Revenue</th><th>Cost</th><th>Contribution</th><th>Returning</th></tr></thead><tbody>${data.fixtures.map((fixture) => `<tr data-fixture="${fixture.id}"><td><strong>${fixture.opponent}</strong></td><td>${fixture.program}</td><td>${number(fixture.paid)}</td><td>${money(fixture.totalRevenue)}</td><td>${money(fixture.cost)}</td><td>${money(fixture.totalRevenue - fixture.cost)}</td><td>${percent(fixture.returningPct, 0)}</td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-programs">Export comparison</button>' })}</div>
    </section>`;
}

function scenarioCalculation(model = scenarioModel) {
  const paidAttendance =
    Math.min(model.expectedAttendance, model.venueCapacity) * (1 - model.complimentaryPct / 100);
  const ticket = paidAttendance * model.ticketPrice;
  const concession =
    model.expectedAttendance *
    (model.concessionParticipationPct / 100) *
    model.averageConcessionSpend;
  const merchandise =
    model.expectedAttendance *
    (model.merchandiseParticipationPct / 100) *
    model.averageMerchandiseSpend;
  const perMatchRevenue = ticket + concession + merchandise;
  const variableSeasonRevenue = perMatchRevenue * model.homeMatches;
  const directCost =
    model.marketingSpend +
    model.staffing +
    model.security +
    model.officials +
    model.venueCosts +
    model.transportation +
    model.equipment;
  const seasonCost = directCost * model.homeMatches;
  const totalRevenue = variableSeasonRevenue + model.sponsorIncome;
  const community = totalRevenue * (model.communityAllocationPct / 100);
  const riskReserve =
    variableSeasonRevenue * ((model.weatherRiskPct + model.operationalRiskPct) / 100);
  const contribution = totalRevenue - seasonCost - community - riskReserve;
  const revenuePerAttendee =
    model.ticketPrice * (1 - model.complimentaryPct / 100) +
    (model.concessionParticipationPct / 100) * model.averageConcessionSpend +
    (model.merchandiseParticipationPct / 100) * model.averageMerchandiseSpend;
  const breakEven = Math.max(
    0,
    (seasonCost - model.sponsorIncome) / Math.max(1, model.homeMatches * revenuePerAttendee),
  );
  return {
    paidAttendance,
    ticket,
    concession,
    merchandise,
    totalRevenue,
    seasonCost,
    community,
    riskReserve,
    contribution,
    breakEven,
    margin: totalRevenue ? (contribution / totalRevenue) * 100 : 0,
  };
}

function rangeControl(name, label, minimum, maximum, step, formatter = number) {
  const value = scenarioModel[name];
  return `<div class="range-control"><label for="scenario-${name}">${label}</label><output id="output-${name}">${formatter(value)}</output><input id="scenario-${name}" data-scenario-input="${name}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}"><div class="range-scale"><span>${formatter(minimum)}</span><span>${formatter(maximum)}</span></div></div>`;
}

function scenariosView() {
  const result = scenarioCalculation();
  return `${viewHeader(false)}
    <div class="callout info" style="margin-bottom:14px"><b>Illustrative sandbox—not an approved club forecast.</b> Inputs are synthetic planning assumptions. Nothing is written to a server; exports remain on your device.</div>
    <section class="scenario-layout">
      ${panel("Scenario assumptions", "Use a preset or move any driver. Outputs recalculate immediately.", `<div class="segmented" style="margin-bottom:16px">${data.scenarioPresets.map((preset) => `<button data-preset="${preset.id}" class="${preset.id === scenarioModel.id ? "active" : ""}">${preset.name}</button>`).join("")}</div><div class="scenario-controls">${rangeControl("expectedAttendance", "Expected attendance", 500, 4000, 50)}${rangeControl("ticketPrice", "Average ticket price", 8, 30, 1, money)}${rangeControl("homeMatches", "Home matches", 4, 16, 1)}${rangeControl("complimentaryPct", "Complimentary tickets", 0, 25, 1, (value) => percent(value, 0))}${rangeControl("concessionParticipationPct", "Concession participation", 15, 70, 1, (value) => percent(value, 0))}${rangeControl("averageConcessionSpend", "Average concession spend", 5, 20, 0.5, money)}${rangeControl("sponsorIncome", "Allocated sponsor income", 0, 30000, 500, money)}</div><div style="display:flex;gap:8px;margin-top:18px"><button class="secondary-button" data-action="reset-scenario">Reset</button><button class="primary-button" data-action="export-scenario">Export scenario</button></div>`, { action: '<span class="status-pill warn">Local only</span>' })}
      ${panel("Modeled outcome", "Every figure updates from the visible assumptions.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Total revenue</small><b id="scenario-revenue">${money(result.totalRevenue)}</b><span>Tickets + ancillary + sponsor allocation</span></div><div class="scenario-output"><small>Contribution</small><b id="scenario-contribution">${money(result.contribution)}</b><span id="scenario-margin">${percent(result.margin)} contribution margin</span></div><div class="scenario-output"><small>Break-even attendance</small><b id="scenario-break-even">${number(result.breakEven)}</b><span>Per home fixture</span></div><div class="scenario-output"><small>Risk reserve</small><b id="scenario-risk">${money(result.riskReserve)}</b><span>Weather + operational sensitivity</span></div></div><div class="scenario-waterfall" id="scenario-waterfall">${waterfall(result)}</div><div class="callout ${result.contribution >= 0 ? "info" : "warn"}" id="scenario-callout"><b>${result.contribution >= 0 ? "Positive modeled contribution." : "Modeled downside case."}</b> ${result.contribution >= 0 ? "Review reserve coverage before approval." : "Change attendance, pricing, cost, or funding assumptions before approval."}</div>`, { action: '<span class="status-pill good" id="scenario-status">Calculated</span>' })}
    </section>`;
}

function waterfall(result) {
  const items = [
    { label: "Revenue", value: result.totalRevenue, className: "" },
    { label: "Direct costs", value: result.seasonCost, className: "negative" },
    { label: "Community", value: result.community, className: "negative" },
    { label: "Risk reserve", value: result.riskReserve, className: "negative" },
    { label: "Contribution", value: Math.abs(result.contribution), className: "total" },
  ];
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return items
    .map(
      (item) =>
        `<div class="waterfall-column ${item.className}"><b>${money(item.className === "negative" ? -item.value : item.value)}</b><i style="height:${Math.max(4, (item.value / maximum) * 118)}px"></i><span>${item.label}</span></div>`,
    )
    .join("");
}

function decisionsView() {
  const filtered =
    state.decisionFilter === "All"
      ? data.decisions
      : data.decisions.filter((decision) => decision.priority === state.decisionFilter);
  return `${viewHeader(false)}
    <div class="segmented" style="margin-bottom:14px"><button data-decision-filter="All" class="${state.decisionFilter === "All" ? "active" : ""}">All ${data.decisions.length}</button><button data-decision-filter="High" class="${state.decisionFilter === "High" ? "active" : ""}">High priority</button><button data-decision-filter="Medium" class="${state.decisionFilter === "Medium" ? "active" : ""}">Medium priority</button></div>
    <section class="decision-board">${filtered.map((decision) => `<button class="card decision-card interactive" data-decision="${decision.id}" type="button" style="text-align:left"><div style="display:flex;justify-content:space-between"><span class="status-pill ${decision.priority.toLowerCase()}">${decision.priority}</span><small style="color:var(--muted)">${decision.id}</small></div><h3>${decision.title}</h3><p>${decision.evidence}</p><div class="decision-meta"><div><small>Owner</small><b>${decision.owner}</b></div><div><small>Timing</small><b>${decision.due}</b></div></div></button>`).join("")}</section>
    <section class="section-grid"><div class="span-8">${panel("Decision operating rhythm", "A recruiter-facing example of how the hub moves analysis into governance.", `<div class="lineage"><div class="lineage-node"><div><b>Signal</b><small>Metric moves or control fails</small></div></div><div class="lineage-node"><div><b>Evidence</b><small>Source and definition reviewed</small></div></div><div class="lineage-node"><div><b>Finding</b><small>Impact and uncertainty stated</small></div></div><div class="lineage-node"><div><b>Decision</b><small>Owner and recommendation named</small></div></div><div class="lineage-node"><div><b>Follow-through</b><small>Action and outcome reviewed</small></div></div></div>`, { action: '<span class="status-pill good">Governed</span>' })}</div><div class="span-4">${panel("Meeting convenience", "Use the register as the standing agenda.", `<div class="callout info"><b>15-minute sequence</b><br>1. Review high-priority decisions.<br>2. Confirm evidence gaps.<br>3. Assign the next action.<br>4. Record what changed.</div><button class="primary-button" data-action="print-view" style="margin-top:12px">Print meeting brief</button>`, { action: '<span class="status-pill">Weekly</span>' })}</div></section>`;
}

function qualityView() {
  return `${viewHeader(false)}
    <section class="section-grid">
      <div class="span-5">${panel("Trust score", "All seven public-release controls currently pass.", `<div class="quality-score"><div class="score-ring"><div><b>100</b><small>release score</small></div></div><div><h3 style="margin:0 0 8px">Safe to demonstrate</h3><p style="margin:0;color:var(--muted);font-size:10px">The score covers deterministic reconciliation, public-field privacy, date coverage, program coverage, and arithmetic integrity. It is not a claim that the synthetic figures are audited club results.</p><button class="ghost-button" data-detail="evidence" type="button">Read the boundary →</button></div></div>`, { action: '<span class="status-pill good">7 / 7 pass</span>' })}</div>
      <div class="span-7">${panel("Source-to-decision lineage", "Every visual follows the same reproducible path.", `<div class="lineage"><div class="lineage-node"><div><b>Sanitized inputs</b><small>CSV + assumptions</small></div></div><div class="lineage-node"><div><b>Validated pipeline</b><small>Typed transformations</small></div></div><div class="lineage-node"><div><b>Star model</b><small>Facts + dimensions</small></div></div><div class="lineage-node"><div><b>Decision layer</b><small>Measures + rules</small></div></div><div class="lineage-node"><div><b>Owner action</b><small>Register + audit</small></div></div></div>`, { action: '<span class="status-pill good">Reproducible</span>' })}</div>
      <div class="span-8">${panel("Release controls", "Zero difference is required before a public build is eligible for release.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Control</th><th>Owner</th><th>Difference</th><th>Status</th></tr></thead><tbody>${data.qualityChecks.map((check) => `<tr><td><strong>${check.name}</strong></td><td>${check.owner}</td><td>${check.difference.toFixed(2)}</td><td><span class="status-pill pass">${check.status}</span></td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-quality">Export evidence</button>' })}</div>
      <div class="span-4">${panel("Freshness & ownership", "The public model makes staleness visible.", `<div class="decision-list"><div class="decision-row"><span class="priority-bar"></span><span><b>Financial model</b><small>Business analyst · deterministic build</small></span><time>14 Oct</time></div><div class="decision-row"><span class="priority-bar"></span><span><b>Operating assumptions</b><small>Operations lead · review required</small></span><time>Quarterly</time></div><div class="decision-row"><span class="priority-bar high"></span><span><b>Fixture split</b><small>Evidence owner not yet confirmed</small></span><time>Open</time></div></div>`, { action: '<span class="status-pill warn">1 gap</span>' })}</div>
    </section>`;
}

function accessView() {
  const rows = [
    ["Executive views", "Yes", "Yes", "Yes", "Yes", "Yes"],
    ["Scenario read", "Yes", "Yes", "Yes", "Yes", "Yes"],
    ["Scenario write", "No", "Yes", "Yes", "No", "No"],
    ["Commercial records", "No", "Yes", "Yes", "Limited", "No"],
    ["Operations imports", "No", "Yes", "Limited", "Yes", "No"],
    ["Users & permissions", "No", "Yes", "No", "No", "No"],
  ];
  return `${viewHeader(false)}
    <section class="section-grid">
      <div class="span-8">${panel("Permission contract", "The public role can inspect analysis but cannot mutate club records.", `<div class="data-table-wrap"><div class="permission-grid"><div class="permission-head">Capability</div><div class="permission-head">Public viewer</div><div class="permission-head">Admin</div><div class="permission-head">Analyst</div><div class="permission-head">Operations</div><div class="permission-head">Commercial</div>${rows.flatMap((row) => row.map((value, index) => `<div class="${index === 0 ? "permission-label" : value === "Yes" ? "permission-yes" : value === "Limited" ? "permission-limited" : "permission-no"}">${value}</div>`)).join("")}</div></div>`, { action: '<span class="status-pill good">Least privilege</span>' })}</div>
      <div class="span-4">${panel("Public role", "What a recruiter can and cannot do in this deployment.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Views</small><b>9</b><span>Decision workspaces</span></div><div class="scenario-output"><small>Server writes</small><b>0</b><span>Mutations disabled</span></div></div><div class="callout info" style="margin-top:10px"><b>Security boundary:</b> the full application repeats permission checks on server routes and organization-scopes database queries. Hiding a button is never treated as authorization.</div>`, { action: '<span class="status-pill">Read-only</span>' })}</div>
      <div class="span-12">${panel("Audit evidence", "Synthetic examples show the shape of an accountable operating trail.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Actor role</th><th>Action</th><th>Object</th><th>Result</th></tr></thead><tbody>${data.auditEvents.map((event) => `<tr><td>${event.time}</td><td><strong>${event.actor}</strong></td><td>${event.action}</td><td>${event.object}</td><td><span class="status-pill good">${event.result}</span></td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-audit">Export audit</button>' })}</div>
    </section>`;
}

const renderers = {
  command: commandView,
  finance: financeView,
  commercial: commercialView,
  matchday: matchdayView,
  programs: programsView,
  scenarios: scenariosView,
  decisions: decisionsView,
  quality: qualityView,
  access: accessView,
};

function render() {
  document.documentElement.dataset.theme = state.theme;
  renderNav();
  $("#breadcrumb-view").textContent =
    views.find((view) => view.id === state.view)?.label || "Command center";
  $("#filter-summary").textContent =
    `${state.period} · ${state.program === "All" ? "All programs" : `${state.program}’s program`}`;
  $("#period-filter").value = state.period;
  $("#program-filter").value = state.program;
  $("#workspace").innerHTML = renderers[state.view]();
  document.title = `${views.find((view) => view.id === state.view)?.label || "Hub"} | Port City FC`;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function navigate(view) {
  if (!renderers[view]) return;
  state.view = view;
  if (location.hash.slice(1) !== view) history.pushState(null, "", `#${view}`);
  closePalette();
  closeRail();
  closeDrawer();
  render();
  $("#workspace").focus({ preventScroll: true });
}

function openDrawer(kicker, title, body) {
  $("#drawer-kicker").textContent = kicker;
  $("#drawer-title").textContent = title;
  $("#drawer-body").innerHTML = body;
  $("#detail-drawer").classList.add("open");
  $("#detail-drawer").setAttribute("aria-hidden", "false");
  $("#drawer-scrim").classList.add("open");
  $("#drawer-close").focus();
}

function closeDrawer() {
  $("#detail-drawer").classList.remove("open");
  $("#detail-drawer").setAttribute("aria-hidden", "true");
  $("#drawer-scrim").classList.remove("open");
}

function evidenceDrawer() {
  openDrawer(
    "Public evidence contract",
    "Safe by construction",
    `<div class="callout info"><b>Portfolio simulation</b><br>${data.meta.evidenceBoundary}</div><div class="drawer-section"><h3>Included</h3><p>Synthetic control totals, generalized operating assumptions, role-only staffing coverage, modeled fixtures, calculated measures, and reproducible lineage.</p></div><div class="drawer-section"><h3>Explicitly excluded</h3><p>Bank and transaction rows, payees, staff or sponsor contacts, private filenames, attributed messages, credentials, and production database access.</p></div><div class="drawer-section"><h3>How to read the dashboard</h3><p>“Modeled” and “synthetic” values prove the analytical method. “Evidence gap” means the hub refuses to invent an operational fact. A public number is never presented as an audited club actual.</p></div><div class="drawer-section"><button class="primary-button" data-view="quality">Open data quality →</button></div>`,
  );
}

function decisionDrawer(id) {
  const decision = data.decisions.find((item) => item.id === id);
  if (!decision) return;
  openDrawer(
    `${decision.id} · ${decision.priority} priority`,
    decision.title,
    `<span class="status-pill ${decision.priority.toLowerCase()}">${decision.status}</span><div class="drawer-section"><h3>Evidence</h3><p>${decision.evidence}</p></div><div class="drawer-section"><h3>Recommendation</h3><p>${decision.recommendation}</p></div><div class="drawer-section"><div class="drawer-kpis"><div><small>Accountable owner</small><b>${decision.owner}</b></div><div><small>Decision timing</small><b>${decision.due}</b></div></div></div><div class="drawer-section"><h3>Meeting prompt</h3><p>What evidence would change this recommendation, and who owns the next observable action?</p></div>`,
  );
}

function fixtureDrawer(id) {
  const fixture = data.fixtures.find((item) => item.id === id);
  if (!fixture) return;
  const contribution = fixture.totalRevenue - fixture.cost;
  openDrawer(
    `${fixture.program} · ${fixture.competition}`,
    `Port City FC vs ${fixture.opponent}`,
    `<p style="color:var(--muted);margin-top:0">${new Date(`${fixture.date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · ${fixture.venue}</p><div class="drawer-kpis"><div><small>Paid attendance</small><b>${number(fixture.paid)}</b></div><div><small>Capacity fill</small><b>${percent((fixture.paid / fixture.capacity) * 100)}</b></div><div><small>Total revenue</small><b>${money(fixture.totalRevenue)}</b></div><div><small>Contribution</small><b>${money(contribution)}</b></div></div><div class="drawer-section"><h3>Operating signal</h3><p>${fixture.paid < fixture.projected ? `Paid attendance is ${number(fixture.projected - fixture.paid)} below the modeled projection.` : "Paid attendance meets or exceeds the modeled projection."} Returning supporters are modeled at ${percent(fixture.returningPct, 0)}.</p></div><div class="drawer-section"><h3>Evidence class</h3><p>Synthetic fixture record for demonstrating drill-down, unit economics, and program comparison.</p></div>`,
  );
}

function categoryDrawer(name) {
  const item = [...data.incomeCategories, ...data.expenseCategories].find(
    (row) => row.name === name,
  );
  if (!item) return;
  const income = data.incomeCategories.some((row) => row.name === name);
  const total = income ? data.financialPeriods.at(-1).inflow : data.financialPeriods.at(-1).outflow;
  openDrawer(
    `${income ? "Income" : "Expense"} category`,
    name,
    `<div class="drawer-kpis"><div><small>Modeled value</small><b>${money(item.amount)}</b></div><div><small>Share of ${income ? "income" : "spend"}</small><b>${percent((item.amount / total) * 100)}</b></div></div><div class="drawer-section"><h3>Management interpretation</h3><p>${income && name === "Sponsorship" ? "This category is the largest modeled income dependency. Renewal ownership and delivery evidence should be treated as a liquidity control." : income ? "Review whether growth in this category is repeatable, attributable, and supported by an accountable acquisition channel." : "Review whether the cost is committed, variable, or avoidable before using it in a downside case."}</p></div><div class="drawer-section"><h3>Evidence class</h3><p>Synthetic, deterministic category total produced by the public source-to-model pipeline.</p></div>`,
  );
}

function sponsorDrawer(id) {
  const sponsor = data.sponsors.find((item) => item.id === id);
  if (!sponsor) return;
  openDrawer(
    `${sponsor.id} · ${sponsor.tier} tier`,
    sponsor.name,
    `<div class="drawer-kpis"><div><small>Modeled contract</small><b>${money(sponsor.contractValue)}</b></div><div><small>Delivery</small><b>${sponsor.delivered} / ${sponsor.total}</b></div><div><small>Estimated reach</small><b>${compact(sponsor.estimatedReach)}</b></div><div><small>Engagement</small><b>${percent(sponsor.engagementPct)}</b></div></div><div class="drawer-section"><h3>Renewal posture</h3><p>${sponsor.renewalIntent}. ${sponsor.overdue ? `${sponsor.overdue} modeled deliverable${sponsor.overdue === 1 ? " is" : "s are"} overdue.` : "No modeled deliverables are overdue."}</p></div><div class="drawer-section"><h3>Recommended next action</h3><p>${sponsor.nextAction}</p></div><div class="drawer-section"><h3>Public treatment</h3><p>Synthetic account identity and commercial measures only; no contact fields are included in the deployment.</p></div>`,
  );
}

function genericDetail(value) {
  const [type, key] = value.split(":");
  if (type === "commitment") {
    const item = data.commitments.find((row) => row.item === key);
    if (item)
      openDrawer(
        item.confidence,
        item.item,
        `<div class="drawer-kpis"><div><small>Modeled amount</small><b>${money(item.amount)}</b></div><div><small>Basis</small><b>${item.basis}</b></div></div><div class="drawer-section"><h3>Use in decisions</h3><p>Keep this commitment visible when testing liquidity and match-volume scenarios. Approximate values must be confirmed before forecast approval.</p></div>`,
      );
  } else if (type === "cost") {
    const item = data.matchdayCosts.find((row) => row.item === key);
    if (item)
      openDrawer(
        "Matchday cost assumption",
        item.item,
        `<div class="drawer-kpis"><div><small>Minimum</small><b>${money(item.minimum)}</b></div><div><small>Maximum</small><b>${money(item.maximum)}</b></div></div><div class="drawer-section"><h3>Basis</h3><p>${item.basis}</p></div><div class="drawer-section"><h3>Treatment</h3><p>${item.treatment}</p></div>`,
      );
  } else if (type === "funnel") {
    const index = data.funnelStages.findIndex((row) => row.stage === key);
    const item = data.funnelStages[index];
    const previous = index > 0 ? data.funnelStages[index - 1] : null;
    if (item)
      openDrawer(
        "Acquisition funnel",
        item.stage,
        `<div class="drawer-kpis"><div><small>Modeled volume</small><b>${number(item.value)}</b></div><div><small>Step conversion</small><b>${previous ? percent((item.value / previous.value) * 100) : "Top of funnel"}</b></div></div><div class="drawer-section"><h3>Analyst prompt</h3><p>${index < 2 ? "Validate reach quality before increasing media spend." : "Investigate the largest adjacent-stage loss before optimizing a lower-volume step."}</p></div>`,
      );
  } else if (type === "sponsor") sponsorDrawer(key);
  else if (value === "evidence") evidenceDrawer();
}

function showAlerts() {
  openDrawer(
    "Operating alerts",
    "Three items need attention",
    `<div class="decision-list">${data.decisions
      .slice(0, 3)
      .map(
        (decision) =>
          `<button class="decision-row" data-decision="${decision.id}"><span class="priority-bar ${decision.priority.toLowerCase()}"></span><span><b>${decision.title}</b><small>${decision.owner}</small></span><time>${decision.due}</time></button>`,
      )
      .join(
        "",
      )}</div><div class="drawer-section"><p>Alerts are generated from transparent rules in this public simulation. The production workflow would write acknowledged actions to the audit trail.</p></div>`,
  );
}

function showToast(title, detail = "") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✓</span><div><b>${title}</b>${detail ? `<small>${detail}</small>` : ""}</div>`;
  $("#toast-region").append(toast);
  setTimeout(() => toast.remove(), 3800);
}

function rowsToCsv(rows) {
  return rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function downloadCsv(filename, rows) {
  const blob = new Blob([rowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast("Export prepared", `${filename} was generated from the current public view.`);
}

function exportFor(action) {
  if (action === "export-finance")
    downloadCsv("pcfc-finance-model.csv", [
      ["Month", "Inflow", "Outflow", "Net"],
      ...data.monthlyCash.map((row) => [row.month, row.inflow, row.outflow, row.net]),
    ]);
  else if (action === "export-sponsors")
    downloadCsv("pcfc-sponsor-portfolio.csv", [
      ["Account", "Tier", "Program", "Value", "Delivered", "Total", "Overdue", "Renewal"],
      ...data.sponsors.map((item) => [
        item.name,
        item.tier,
        item.program,
        item.contractValue,
        item.delivered,
        item.total,
        item.overdue,
        item.renewalIntent,
      ]),
    ]);
  else if (action === "export-channels")
    downloadCsv("pcfc-channel-performance.csv", [
      ["Channel", "Visits", "Purchases", "Spend"],
      ...data.channelPerformance.map((item) => [
        item.channel,
        item.visits,
        item.purchases,
        item.spend,
      ]),
    ]);
  else if (action === "export-fixtures" || action === "export-programs")
    downloadCsv("pcfc-fixture-model.csv", [
      ["Fixture", "Date", "Program", "Opponent", "Venue", "Paid", "Revenue", "Cost"],
      ...filteredFixtures().map((item) => [
        item.id,
        item.date,
        item.program,
        item.opponent,
        item.venue,
        item.paid,
        item.totalRevenue,
        item.cost,
      ]),
    ]);
  else if (action === "export-quality")
    downloadCsv("pcfc-reconciliation-evidence.csv", [
      ["Control", "Owner", "Difference", "Status"],
      ...data.qualityChecks.map((item) => [item.name, item.owner, item.difference, item.status]),
    ]);
  else if (action === "export-audit")
    downloadCsv("pcfc-audit-evidence.csv", [
      ["Time", "Actor role", "Action", "Object", "Result"],
      ...data.auditEvents.map((item) => [
        item.time,
        item.actor,
        item.action,
        item.object,
        item.result,
      ]),
    ]);
  else if (action === "export-scenario") {
    const result = scenarioCalculation();
    downloadCsv("pcfc-scenario-model.csv", [
      ["Input / output", "Value"],
      ...Object.entries(scenarioModel),
      ...Object.entries(result),
    ]);
  } else {
    downloadCsv(`pcfc-${state.view}-view.csv`, [
      ["View", "Period", "Program", "Generated"],
      [state.view, state.period, state.program, new Date().toISOString()],
    ]);
  }
}

function resetScenario(preset = baseline) {
  scenarioModel = { ...preset, homeMatches: 10 };
  render();
  showToast("Scenario reset", `${scenarioModel.name} assumptions restored.`);
}

function updateScenario() {
  const result = scenarioCalculation();
  $("#scenario-revenue").textContent = money(result.totalRevenue);
  $("#scenario-contribution").textContent = money(result.contribution);
  $("#scenario-margin").textContent = `${percent(result.margin)} contribution margin`;
  $("#scenario-break-even").textContent = number(result.breakEven);
  $("#scenario-risk").textContent = money(result.riskReserve);
  $("#scenario-waterfall").innerHTML = waterfall(result);
  $("#scenario-callout").className = `callout ${result.contribution >= 0 ? "info" : "warn"}`;
  $("#scenario-callout").innerHTML =
    `<b>${result.contribution >= 0 ? "Positive modeled contribution." : "Modeled downside case."}</b> ${result.contribution >= 0 ? "Review reserve coverage before approval." : "Change attendance, pricing, cost, or funding assumptions before approval."}`;
}

function paletteItems(query = "") {
  const normalized = query.trim().toLowerCase();
  return views.filter((view) => `${view.label} ${view.hint}`.toLowerCase().includes(normalized));
}

function renderPalette() {
  const results = paletteItems($("#palette-input").value);
  state.paletteIndex = clamp(state.paletteIndex, 0, Math.max(0, results.length - 1));
  $("#palette-results").innerHTML = results.length
    ? results
        .map(
          (view, index) =>
            `<button class="palette-result ${index === state.paletteIndex ? "selected" : ""}" data-view="${view.id}" type="button"><span>${icons[view.icon]}</span><span><b>${view.label}</b><small>${view.hint}</small></span><kbd>Open</kbd></button>`,
        )
        .join("")
    : '<div class="empty-note">No workspace matches that search.</div>';
}

function openPalette() {
  $("#palette-backdrop").hidden = false;
  $("#palette-input").value = "";
  state.paletteIndex = 0;
  renderPalette();
  setTimeout(() => $("#palette-input").focus(), 0);
}

function closePalette() {
  $("#palette-backdrop").hidden = true;
}

function openRail() {
  $("#app-rail").classList.add("open");
  $("#mobile-scrim").classList.add("open");
}

function closeRail() {
  $("#app-rail").classList.remove("open");
  $("#mobile-scrim").classList.remove("open");
}

function handleAction(action) {
  if (action.startsWith("export")) exportFor(action);
  else if (action === "open-decisions") navigate("decisions");
  else if (action === "print-view") window.print();
  else if (action === "reset-scenario") resetScenario();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, tr, [data-category]");
  if (!target) return;
  if (target.dataset.cashMode) {
    state.cashMode = target.dataset.cashMode;
    render();
    showToast(
      "Cash view updated",
      state.cashMode === "net"
        ? "Showing modeled monthly net movement."
        : "Showing inflow and planning flow together.",
    );
  } else if (target.dataset.view) navigate(target.dataset.view);
  else if (target.dataset.decision) decisionDrawer(target.dataset.decision);
  else if (target.dataset.fixture) fixtureDrawer(target.dataset.fixture);
  else if (target.dataset.category) categoryDrawer(target.dataset.category);
  else if (target.dataset.detail) genericDetail(target.dataset.detail);
  else if (target.dataset.action) handleAction(target.dataset.action);
  else if (target.dataset.preset) {
    const preset = data.scenarioPresets.find((item) => item.id === target.dataset.preset);
    if (preset) resetScenario(preset);
  } else if (target.dataset.decisionFilter) {
    state.decisionFilter = target.dataset.decisionFilter;
    render();
  } else if (target.dataset.closeModal) {
    $(`#${target.dataset.closeModal}`).hidden = true;
  } else if (target.classList.contains("panel-menu")) {
    showToast(
      "Panel controls",
      "Use the page export, filters, or an interactive chart mark for more detail.",
    );
  }
});

$("#period-filter").addEventListener("change", (event) => {
  state.period = event.target.value;
  localStorage.setItem("pcfc-period", state.period);
  render();
  showToast("Period updated", `${state.period} is now applied across the workspace.`);
});

$("#program-filter").addEventListener("change", (event) => {
  state.program = event.target.value;
  localStorage.setItem("pcfc-program", state.program);
  render();
  showToast(
    "Program filter updated",
    `${state.program === "All" ? "All programs" : `${state.program}’s program`} selected.`,
  );
});

$("#workspace").addEventListener("input", (event) => {
  if (event.target.dataset.scenarioInput) {
    scenarioModel = {
      ...scenarioModel,
      id: "custom",
      name: "Custom",
      [event.target.dataset.scenarioInput]: Number(event.target.value),
    };
    const output = $(`#output-${event.target.dataset.scenarioInput}`);
    if (output) {
      const formatters = {
        ticketPrice: money,
        complimentaryPct: (value) => percent(value, 0),
        concessionParticipationPct: (value) => percent(value, 0),
        averageConcessionSpend: money,
        sponsorIncome: money,
      };
      output.textContent = (formatters[event.target.dataset.scenarioInput] || number)(
        Number(event.target.value),
      );
    }
    updateScenario();
  } else if (event.target.id === "sponsor-search") {
    const query = event.target.value.toLowerCase();
    const filtered = data.sponsors.filter((sponsor) =>
      `${sponsor.name} ${sponsor.tier} ${sponsor.program}`.toLowerCase().includes(query),
    );
    $("#sponsor-table-body").innerHTML = sponsorRows(filtered);
  }
});

$("#search-trigger").addEventListener("click", openPalette);
$("#palette-input").addEventListener("input", () => {
  state.paletteIndex = 0;
  renderPalette();
});
$("#palette-backdrop").addEventListener("click", (event) => {
  if (event.target === $("#palette-backdrop")) closePalette();
});
$("#tour-button").addEventListener("click", () => {
  $("#tour-backdrop").hidden = false;
});
$("#tour-backdrop").addEventListener("click", (event) => {
  if (event.target === $("#tour-backdrop")) $("#tour-backdrop").hidden = true;
});
$("#theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("pcfc-theme", state.theme);
  document.documentElement.dataset.theme = state.theme;
  showToast(
    `${state.theme === "dark" ? "Dark" : "Light"} theme applied`,
    "Your display preference is stored only in this browser.",
  );
});
$("#notification-button").addEventListener("click", showAlerts);
$("#evidence-button").addEventListener("click", evidenceDrawer);
$("#drawer-close").addEventListener("click", closeDrawer);
$("#drawer-scrim").addEventListener("click", closeDrawer);
$("#mobile-menu").addEventListener("click", openRail);
$("#rail-close").addEventListener("click", closeRail);
$("#mobile-scrim").addEventListener("click", closeRail);
$("#workspace-switcher").addEventListener("click", () =>
  showToast(
    "Executive workspace",
    "The public deployment contains one privacy-safe read-only workspace.",
  ),
);
$(".profile-button").addEventListener("click", () => {
  openDrawer(
    "Portfolio viewer",
    "Read-only public role",
    '<div class="callout info"><b>Safe demonstration access</b><br>This role can inspect every analytical workspace, change local filters, test scenarios, and export public model outputs. It cannot write to club systems or view private records.</div><div class="drawer-section"><h3>Session behavior</h3><p>Theme and filter preferences are stored only in this browser. Scenario calculations run locally and are never persisted to a production database.</p></div><div class="drawer-section"><button class="primary-button" data-view="access" type="button">Review the permission contract →</button></div>',
  );
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
  } else if (event.key === "Escape") {
    closePalette();
    closeDrawer();
    $("#tour-backdrop").hidden = true;
    closeRail();
  } else if (
    !$("#palette-backdrop").hidden &&
    ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)
  ) {
    const results = paletteItems($("#palette-input").value);
    if (event.key === "ArrowDown")
      state.paletteIndex = clamp(state.paletteIndex + 1, 0, results.length - 1);
    else if (event.key === "ArrowUp")
      state.paletteIndex = clamp(state.paletteIndex - 1, 0, results.length - 1);
    else if (event.key === "Enter" && results[state.paletteIndex])
      navigate(results[state.paletteIndex].id);
    renderPalette();
    event.preventDefault();
  }
});

document.addEventListener("pointerover", (event) => {
  const target = event.target.closest("[data-tooltip]");
  if (!target) return;
  const tooltip = $("#tooltip");
  tooltip.textContent = target.dataset.tooltip;
  const rect = target.getBoundingClientRect();
  tooltip.style.left = `${clamp(rect.left + rect.width / 2 - 80, 8, innerWidth - 240)}px`;
  tooltip.style.top = `${clamp(rect.top - 40, 8, innerHeight - 60)}px`;
  tooltip.classList.add("visible");
});

document.addEventListener("pointerout", (event) => {
  if (event.target.closest("[data-tooltip]")) $("#tooltip").classList.remove("visible");
});

window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if (renderers[view]) {
    state.view = view;
    render();
  }
});

render();
