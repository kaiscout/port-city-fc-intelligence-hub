import {
  EVIDENCE,
  financeModel,
  selectFixtures,
  fixtureMetrics,
  selectSponsors,
  sponsorMetrics,
  sponsorRisk,
  calculateSeasonScenario,
  controlSummary,
  validateHubModel,
  csvText,
  ratio,
  buildExport,
} from "./model.js";

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
    badge: "Sandbox",
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
    kicker: "Module 01 / Executive control",
    title: "Club operating picture",
    description:
      "Financial resilience, commercial momentum, supporter demand and accountable actions on one decision surface.",
  },
  finance: {
    kicker: "Module 02 / Finance intelligence",
    title: "Cash flow & cost control",
    description:
      "Synthetic cash movement, category concentration and monthly pressure points. Opening balances are unavailable; cash runway cannot be calculated.",
  },
  commercial: {
    kicker: "Module 03 / Commercial intelligence",
    title: "Revenue & partnership intelligence",
    description:
      "Sponsor concentration, delivery health, renewal posture, acquisition conversion, and channel efficiency in one place.",
  },
  matchday: {
    kicker: "Module 04 / Matchday control",
    title: "Fixture readiness & unit economics",
    description:
      "Fixture economics, capacity signals, readiness controls, and cost assumptions designed for action before gates open.",
  },
  programs: {
    kicker: "Module 05 / Program intelligence",
    title: "Program performance & equity",
    description:
      "A consistent comparison of the Men’s and Women’s programs using shared definitions, equivalent KPIs, and visible evidence limits.",
  },
  scenarios: {
    kicker: "Module 06 / Planning intelligence",
    title: "Decision simulation lab",
    description:
      "Adjust attendance, price, match volume, and operating assumptions. Every output is calculated locally and remains clearly illustrative.",
  },
  decisions: {
    kicker: "Module 07 / Executive governance",
    title: "Executive action register",
    description:
      "Prioritized decisions with evidence, recommendation, accountable owner, and timing—ready for an executive operating meeting.",
  },
  quality: {
    kicker: "Module 08 / Data observability",
    title: "Data trust & lineage",
    description:
      "Inspect calculated control results, dataset scope, missing evidence and the limits of the public demonstration.",
  },
  access: {
    kicker: "Module 09 / Platform governance",
    title: "Governance & control",
    description:
      "Route policy, entity permissions, organization scope, transactional audit writes, and a transparent public-role contract.",
  },
};

const viewSignals = {
  command:
    "Use the synthetic cash model to discuss reserve policy and income concentration. Validate current balances and the home/away split before approving a club operating plan.",
  finance:
    "An inflow-to-outflow ratio measures period cash movement, not available liquidity. A 1.05× policy threshold is a proposal for discussion, not an approved club rule.",
  commercial:
    "The 2026 sponsor sample illustrates delivery recovery and renewal ownership. Contract face value is not cash received and does not reconcile to FY25 income.",
  matchday:
    "Attendance upside is meaningful, but contribution should be judged after direct staffing, field and concession costs—not gate revenue alone.",
  programs:
    "Equivalent definitions expose the real difference between programs; opportunity, capacity and fixture volume must be normalized before allocation.",
  scenarios:
    "Test attendance, price and costs against the same contribution equation. Break-even includes attendee costs, community allocation and the explicit risk allowance.",
  decisions:
    "Three decisions affect the operating plan now. Each needs one accountable owner, a due date and evidence that can close the loop.",
  quality:
    "Control results are calculated from the public model and its pipeline manifest. Passing arithmetic controls does not validate PCFC source records or imply stakeholder approval.",
  access:
    "Public access is intentionally read-only. The full application repeats authorization at the route, entity and organization-query boundaries.",
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
  theme: localStorage.getItem("pcfc-theme-v2") || "dark",
  cashMode: "flow",
  decisionFilter: "All",
  paletteIndex: 0,
  sponsorQuery: "",
  sponsorSort: "name",
};
if (!data.financialPeriods.some((period) => period.id === state.period)) state.period = "FY25";
if (!["All", "Men", "Women"].includes(state.program)) state.program = "All";
if (!["light", "dark"].includes(state.theme)) state.theme = "dark";

const baseline =
  data.scenarioPresets.find((scenario) => scenario.id === "baseline") || data.scenarioPresets[0];
let scenarioModel = { ...baseline };
const modelChecks = validateHubModel(data);
const integrity = controlSummary(modelChecks);
const pipelineControls = controlSummary(data.reconciliation.checks);

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
const money = (value) =>
  value == null || !Number.isFinite(value) ? "Not available" : formatCurrency.format(value);
const preciseMoney = (value) =>
  value == null
    ? "Not available"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
const number = (value) =>
  value == null || !Number.isFinite(value) ? "Not available" : formatNumber.format(value);
const compact = (value) => formatCompact.format(Number(value) || 0);
const percent = (value, digits = 1) =>
  value == null || !Number.isFinite(value) ? "Not available" : `${value.toFixed(digits)}%`;
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const selectedFinance = () => financeModel(data, state.period);

function filteredFixtures() {
  return selectFixtures(data, state.program);
}

const filteredSponsors = () =>
  selectSponsors(data, state.program, state.sponsorQuery, state.sponsorSort);
const filteredDecisions = () =>
  data.decisions.filter(
    (row) => state.decisionFilter === "All" || row.priority === state.decisionFilter,
  );
const programLabel = () =>
  state.program === "All" ? "All programs" : `${state.program}’s program`;
function viewScope() {
  if (state.view === "command")
    return `Finance: ${state.period}, club-wide · Fixtures: 2026 sample, ${programLabel()}`;
  if (state.view === "finance")
    return `${state.period} · Club-wide cash model · No program allocation available`;
  if (state.view === "commercial")
    return `2026 sponsor sample · ${programLabel()} + club-wide accounts · Acquisition: club-wide only`;
  if (["matchday", "programs"].includes(state.view))
    return `2026 fixture sample · ${programLabel()} · ${filteredFixtures().length} example home fixtures`;
  if (state.view === "scenarios")
    return `Independent planning sandbox · ${scenarioModel.program} · ${scenarioModel.homeMatches} assumed home matches`;
  if (state.view === "decisions")
    return `Proposed decisions · ${state.decisionFilter} priorities · PCFC approval pending`;
  if (state.view === "quality")
    return "Synthetic model controls · All published datasets · No club-data assurance";
  return "Public read-only demonstration · Full-application policies shown for reference";
}
function emptyState(message) {
  return `<div class="empty-note" role="note">${message}</div>`;
}
function controlsLabel() {
  return `${integrity.passed}/${integrity.total} model checks ${integrity.allPass ? "pass" : "need review"}`;
}
function evidenceNote() {
  return `<div class="scope-note" id="view-scope"><b>Synthetic demonstration</b><span>${viewScope()}</span><small>Figures illustrate the method; PCFC data and stakeholder approval are pending.</small></div>`;
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
  return `<header class="view-header"><div class="view-identity"><div class="view-label-row"><span class="section-kicker">${copy.kicker}</span><span class="live-module">Synthetic model</span></div><h1>${copy.title}</h1><p>${copy.description}</p></div>${`<div class="view-actions"><button class="secondary-button" data-action="export-view">Export intelligence</button>${actions ? '<button class="primary-button" data-action="open-decisions">Review actions <span>→</span></button>' : ""}</div>`}</header>${evidenceNote()}<section class="intelligence-brief"><div class="signal-orb" aria-hidden="true"><span></span><i></i></div><div><small>Discussion signal</small><p>${viewSignals[state.view]}</p></div><div class="brief-score"><small>Model checks</small><b>${integrity.passed}<span>/${integrity.total}</span></b><em>${integrity.allPass ? "PASS" : "REVIEW"}</em></div></section>`;
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

function metricCard({
  label,
  value,
  delta,
  tone = "",
  tooltip,
  series = [],
  seriesLabel = "",
  evidence = "Calculated",
}) {
  return `<article class="card metric-card" data-metric="${escapeHtml(label)}"><div class="metric-top"><span>${label}</span><span class="metric-live">${evidence}</span><button type="button" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">?</button></div><strong class="metric-value">${value}</strong><span class="metric-delta ${tone}">${delta}</span>${series.length && seriesLabel ? `<div class="metric-trend" aria-label="${escapeHtml(seriesLabel)}">${sparkline(series, tone)}<small>${seriesLabel}</small></div>` : ""}</article>`;
}

function panel(title, subtitle, body, options = {}) {
  return `<article class="card panel ${options.className || ""}"><div class="panel-head"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${options.action || '<button class="panel-menu" type="button" aria-label="Panel options">•••</button>'}</div>${body}</article>`;
}

function lineChart(series, labels, options = {}) {
  const width = 760;
  const height = options.height || 250;
  const pad = { top: 18, right: 20, bottom: 30, left: 45 };
  const values = series.flatMap((item) => item.values);
  if (!values.length) return emptyState("No monthly breakdown is published for this period.");
  const ceiling = Math.max(0, ...values);
  const floor = Math.min(0, ...values);
  const maximum = ceiling > 0 ? ceiling * 1.12 : 1;
  const minimum = floor < 0 ? floor * 1.12 : 0;
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
          ? `<polygon class="chart-area" points="${x(0)},${y(0)} ${points} ${x(labels.length - 1)},${y(0)}"/>`
          : "";
      const dots = item.values
        .map(
          (value, index) =>
            `<circle class="chart-point" tabindex="0" cx="${x(index)}" cy="${y(value)}" r="3.6" data-chart-series="${item.name}" data-value="${value}" data-tooltip="${labels[index]} · ${item.name}: ${options.currency ? money(value) : number(value)}"/>`,
        )
        .join("");
      return `${area}<polyline class="${pathClass}" points="${points}"/>${dots}`;
    })
    .join("");
  return `<div class="chart-wrap ${options.compact ? "compact" : ""}"><svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.label || "Trend chart"}"><defs><linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue-500)" stop-opacity=".24"/><stop offset="1" stop-color="var(--blue-500)" stop-opacity="0"/></linearGradient></defs>${grid}${axes}${paths}</svg></div><div class="legend">${series.map((item, index) => `<span><i style="background:${index === 0 ? "var(--blue-600)" : "var(--teal-600)"}"></i>${item.name}</span>`).join("")}</div>`;
}

function groupedBarChart(rows, options = {}) {
  if (!rows.length) return emptyState("No monthly breakdown is published for this period.");
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
  const period = selectedFinance();
  const fixtures = filteredFixtures();
  const fixture = fixtureMetrics(fixtures);
  const monthly = period.monthly;
  const cashSeries =
    state.cashMode === "net"
      ? [{ name: "Monthly net", values: monthly.map((row) => row.net) }]
      : [
          { name: "Modeled inflow", values: monthly.map((row) => row.inflow) },
          { name: "Modeled outflow", values: monthly.map((row) => row.outflow) },
        ];
  const metricSeries = monthly.map((row) => row.net);
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Net cash movement", value: money(period.netCash), delta: period.changeInNet == null ? `${state.period} · no earlier benchmark` : `${money(period.changeInNet)} change vs FY24`, tone: period.netCash >= 0 ? "positive" : "negative", tooltip: `${state.period} synthetic inflow less outflow. This is a period movement, not an available bank balance.`, series: metricSeries, seriesLabel: monthly.length ? "Monthly net · Jan–Dec 2025" : "" })}
      ${metricCard({ label: "Inflow / outflow", value: `${period.coverage.toFixed(2)}×`, delta: `${percent(period.netCashMarginPct)} net cash margin`, tooltip: "Synthetic cash inflow divided by cash outflow. It is not cash runway or accrual operating margin." })}
      ${metricCard({ label: "Sponsorship share", value: percent(period.sponsorshipSharePct), delta: period.breakdownAvailable ? `${state.period} synthetic cash receipts` : "FY24 category breakdown unavailable", tooltip: "Sponsorship category cash inflow divided by total cash inflow in the same fiscal period." })}
      ${metricCard({ label: "Sample average paid attendance", value: number(fixture.averagePaid), delta: `2026 · ${fixtures.length} example home fixtures`, tooltip: "Sum of paid attendance divided by the number of selected 2026 synthetic fixtures. Independent of the finance period.", series: fixtures.map((row) => row.paid), seriesLabel: "Dated fixture sequence · May–Jul 2026" })}
    </section>
    <section class="dashboard-grid">
      ${panel(
        "Cash movement",
        `${state.period} · club-wide synthetic cash flows. Negative net months remain below zero.`,
        lineChart(
          cashSeries,
          monthly.map((row) => row.month),
          {
            currency: true,
            area: true,
            label:
              state.cashMode === "net"
                ? "Monthly net cash movement"
                : "Monthly synthetic inflow and outflow",
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
      ${panel("Income mix", `${state.period} · category cash inflow; select a category for its definition.`, period.income.length ? donut(period.income, period.inflow) : emptyState("FY24 has annual control totals only. No category mix has been inferred."), { action: '<span class="status-pill">Synthetic finance</span>' })}
      ${panel("Stakeholder review gates", "Open items are requests for validation, not operational readiness scores.", `<div class="readiness-strip"><div class="readiness-step warn"><span>?</span><b>Club actuals</b><small>Reconciliation pending</small></div><div class="readiness-step warn"><span>?</span><b>Reserve policy</b><small>Owner approval pending</small></div><div class="readiness-step warn"><span>?</span><b>Fixture split</b><small>Operations confirmation</small></div><div class="readiness-step"><span>✓</span><b>Model arithmetic</b><small>${controlsLabel()}</small></div></div><div class="callout info" style="margin-top:12px"><b>Proposed next step:</b> approve a scoped validation pilot, nominate finance and operations data owners, and agree the decision definitions.</div><button class="ghost-button" data-action="presentation-brief">Open owner briefing →</button>`, { action: '<span class="status-pill warn">Approval pending</span>' })}
    </section>`;
}

function financeView() {
  const period = selectedFinance();
  const monthly = period.monthly.map((row) => ({
    label: row.month,
    a: row.inflow,
    b: row.outflow,
  }));
  const categories = [...period.expenses].sort((a, b) => b.amount - a.amount);
  const maximum = Math.max(1, ...categories.map((item) => item.amount));
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Cash inflow", value: money(period.inflow), delta: period.inflowChangePct == null ? "No earlier benchmark published" : `${percent(period.inflowChangePct)} vs FY24`, tooltip: `${state.period} synthetic cash inflow; club-wide.`, series: period.monthly.map((row) => row.inflow), seriesLabel: "Monthly inflow · Jan–Dec 2025" })}
      ${metricCard({ label: "Cash outflow", value: money(period.outflow), delta: `${percent((period.outflow / period.inflow) * 100)} of cash inflow`, tooltip: `${state.period} synthetic cash outflow; club-wide.`, series: period.monthly.map((row) => row.outflow), seriesLabel: "Monthly outflow · Jan–Dec 2025" })}
      ${metricCard({ label: "Net cash movement", value: money(period.netCash), delta: `${percent(period.netCashMarginPct)} net cash margin`, tooltip: "Period cash inflow less cash outflow. No opening bank balance is provided.", series: period.monthly.map((row) => row.net), seriesLabel: "Monthly net · Jan–Dec 2025" })}
      ${metricCard({ label: "Largest outflow category", value: money(categories[0]?.amount), delta: categories[0]?.name ?? "FY24 category breakdown unavailable", tooltip: "Largest category in the selected period's synthetic expense breakdown. No category amounts are inferred." })}
    </section>
    <section class="section-grid">
      <div class="span-8">${panel("Monthly cash rhythm", `${state.period} · monthly detail is available only when published in the input model.`, groupedBarChart(monthly), { action: `<span class="status-pill">${period.breakdownAvailable ? "Synthetic breakdown" : "Annual totals only"}</span>` })}</div>
      <div class="span-4">${panel("Cash-flow interpretation", "Period movement does not establish available liquidity.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Inflow / outflow</small><b>${period.coverage.toFixed(2)}×</b><span>Cash inflow ÷ cash outflow</span></div><div class="scenario-output"><small>Net cash margin</small><b>${percent(period.netCashMarginPct)}</b><span>Net movement ÷ cash inflow</span></div></div><div class="callout warn" style="margin-top:10px"><b>Policy proposal:</b> discuss a 1.05× minimum cash-flow ratio with ownership. No bank balance, cash runway, approved budget or debt position is established here.</div><button class="ghost-button" data-view="scenarios" type="button">Explore an independent scenario →</button>`, { action: '<span class="status-pill warn">Owner validation needed</span>' })}</div>
      <div class="span-7">${panel("Expense concentration", `${state.period} · amounts and shares use the same selected-period denominator.`, categories.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Modeled value</th><th>Share</th><th>Relative scale</th></tr></thead><tbody>${categories.map((item) => `<tr data-category="${item.name}"><td><strong>${item.name}</strong></td><td>${money(item.amount)}</td><td>${percent((item.amount / period.outflow) * 100)}</td><td><div class="bar-meter"><span><i style="width:${(item.amount / maximum) * 100}%"></i></span></div></td></tr>`).join("")}</tbody></table></div>` : emptyState("FY24 expense categories are unavailable. Annual outflow is retained without fabricating a breakdown."), { action: '<button class="secondary-button" data-action="export-finance">Export cash model</button>' })}</div>
      <div class="span-5">${panel("Planning assumptions", "Generalized examples; independent of fiscal-period cash totals.", `<div class="decision-list">${data.commitments.map((item) => `<button class="decision-row" data-detail="commitment:${item.item}" type="button"><span class="priority-bar"></span><span><b>${item.item}</b><small>${item.confidence} · ${item.basis}</small></span><time>${money(item.amount)}</time></button>`).join("")}</div><div class="callout info" style="margin-top:10px">These assumptions are not additional expenses to add to the cash ledger. Amounts and allocation require PCFC confirmation.</div>`, { action: '<span class="status-pill warn">Assumptions</span>' })}</div>
    </section>`;
}

function commercialView() {
  const sponsors = filteredSponsors();
  const metrics = sponsorMetrics(sponsors);
  const purchases = data.funnelStages.find((stage) => stage.stage === "Purchases")?.value || 0;
  const visits = data.funnelStages.find((stage) => stage.stage === "Website visits")?.value || 1;
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Sample contract face value", value: money(metrics.value), delta: `${metrics.count} accounts matching program + search`, tooltip: "2026 synthetic contract face values for the visible accounts. This is neither cash collected nor recognized FY25 revenue." })}
      ${metricCard({ label: "Delivery completion", value: percent(metrics.deliveryPct), delta: `${metrics.delivered}/${metrics.total} assets · ${metrics.overdue} overdue`, tone: metrics.overdue ? "negative" : "", tooltip: "Sum of delivered assets divided by sum of contracted assets for visible accounts. Empty selections are not reported as zero percent." })}
      ${metricCard({ label: "Club-wide purchase conversion", value: percent((purchases / visits) * 100), delta: "2026 acquisition sample · program filter not applied", tooltip: "Club-wide sample purchases divided by website visits. No program attribution is published; sponsor search does not filter acquisition." })}
      ${metricCard({ label: "Positive renewal intent", value: number(metrics.positive), delta: `of ${metrics.count} visible accounts`, tooltip: "Count of visible synthetic accounts with a Positive intent. Intent does not establish a signed renewal." })}
    </section>
    <section class="section-grid">
      <div class="span-7">${panel("Sponsor portfolio", "2026 sample · club-wide accounts are included once in a program view and are not allocated between programs.", `<div class="portfolio-controls"><input id="sponsor-search" aria-label="Search sponsor portfolio" type="search" placeholder="Filter sponsors…" value="${escapeHtml(state.sponsorQuery)}"><select id="sponsor-sort" aria-label="Sort sponsor portfolio"><option value="name" ${state.sponsorSort === "name" ? "selected" : ""}>Account A–Z</option><option value="value" ${state.sponsorSort === "value" ? "selected" : ""}>Value: high to low</option><option value="delivery" ${state.sponsorSort === "delivery" ? "selected" : ""}>Delivery: low to high</option></select><button class="secondary-button" data-action="export-sponsors">Export visible</button></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Account</th><th>Program</th><th>Face value</th><th>Delivery</th><th>Intent</th></tr></thead><tbody id="sponsor-table-body">${sponsorRows(sponsors)}</tbody></table></div>${sponsors.length ? "" : emptyState("No accounts match both the selected program and search. Clear the search to widen the selection.")}`, { action: '<span class="status-pill">Synthetic accounts</span>' })}</div>
      <div class="span-5">${panel("Acquisition funnel", "2026 club-wide sample · program and sponsor-search filters do not apply. These stages are illustrative, not tracked people across systems.", `<div class="funnel">${data.funnelStages.map((stage) => `<button class="funnel-row" data-detail="funnel:${stage.stage}" type="button" style="border:0;background:transparent;width:100%;text-align:left"><span>${stage.stage}</span><span class="funnel-track"><i style="width:${(stage.value / data.funnelStages[0].value) * 100}%"></i></span><b>${compact(stage.value)}</b></button>`).join("")}</div>`, { action: '<span class="status-pill">Club-wide sample</span>' })}</div>
      <div class="span-7">${panel("Channel efficiency", "2026 club-wide sample · visits and purchases reconcile to the funnel. Sponsor filters do not apply.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Channel</th><th>Visits</th><th>Purchases</th><th>Conversion</th><th>Cost / purchase</th></tr></thead><tbody>${data.channelPerformance.map((channel) => `<tr><td><strong>${channel.channel}</strong></td><td>${number(channel.visits)}</td><td>${number(channel.purchases)}</td><td>${percent((channel.purchases / channel.visits) * 100)}</td><td>${preciseMoney(ratio(channel.spend, channel.purchases))}</td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-channels">Export channels</button>' })}</div>
      <div class="span-5">${panel("Account follow-up", "Rule: overdue assets → delivery recovery; otherwise positive intent → no open delivery exception; other intents → renewal discussion.", sponsors.length ? `<div class="decision-list">${sponsors.map((row) => `<button class="decision-row" data-detail="sponsor:${row.id}"><span class="priority-bar ${row.overdue ? "high" : ""}"></span><span><b>${row.name}</b><small>${sponsorRisk(row)}</small></span><time>${row.overdue} overdue</time></button>`).join("")}</div>` : emptyState("No visible accounts to assess."), { action: `<span class="status-pill ${metrics.overdue ? "warn" : ""}">${sponsors.filter((row) => row.overdue > 0).length} recovery accounts</span>` })}</div>
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
  const metrics = fixtureMetrics(fixtures);
  const needs = data.matchdayNeeds.filter((item) => item.scope === "Home");
  const specified = needs.filter((item) => item.quantity != null).length;
  return `${viewHeader()}
    <section class="metric-grid">
      ${metricCard({ label: "Sample home fixtures", value: number(metrics.count), delta: `2026 · ${programLabel()}`, tooltip: "Count of selected synthetic home-fixture examples. Not a complete approved season schedule." })}
      ${metricCard({ label: "Average paid attendance", value: number(metrics.averagePaid), delta: `${percent(metrics.fillPct)} aggregate capacity fill`, tooltip: "Average = total paid / fixtures. Aggregate fill = total paid / total fixture capacity, not an unweighted average of venue percentages.", series: fixtures.map((row) => row.paid), seriesLabel: "Dated fixture sequence · May–Jul 2026" })}
      ${metricCard({ label: "Average direct contribution", value: money(metrics.averageContribution), delta: "Per sample home fixture · before shared overhead", tooltip: "Sum of sample fixture revenue minus sample direct cost, divided by fixture count. Not total-club profit.", series: fixtures.map((row) => row.totalRevenue - row.cost), seriesLabel: "Dated fixture sequence · May–Jul 2026" })}
      ${metricCard({ label: "Home-kit quantities specified", value: `${specified}/${needs.length}`, delta: "Requirements mapped · availability unverified", tooltip: "Number of home-kit requirement rows with a numeric quantity. This is not a readiness score or confirmation of physical availability." })}
    </section>
    ${panel("Modeled fixture book", "Open a fixture to see the unit economics and operating watchpoints.", `<div class="fixture-grid">${fixtures.map((fixture) => `<button class="card fixture-card interactive" data-fixture="${fixture.id}" type="button" style="text-align:left"><span class="fixture-date">${new Date(`${fixture.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fixture.program}</span><h3>vs ${fixture.opponent}</h3><p>${fixture.venue}</p><div class="fixture-metrics"><div><small>Paid</small><b>${number(fixture.paid)}</b></div><div><small>Contribution</small><b>${money(fixture.totalRevenue - fixture.cost)}</b></div></div></button>`).join("")}</div>`, { action: '<button class="secondary-button" data-action="export-fixtures">Export schedule</button>' })}
    <section class="section-grid">
      <div class="span-7">${panel("Matchday unit economics", "Planning assumptions remain visible beside the modeled output.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Cost / driver</th><th>Range</th><th>Basis</th><th>Treatment</th></tr></thead><tbody>${data.matchdayCosts.map((item) => `<tr data-detail="cost:${item.item}"><td><strong>${item.item}</strong></td><td>${item.minimum === item.maximum ? money(item.minimum) : `${money(item.minimum)}–${money(item.maximum)}`}</td><td>${item.basis}</td><td>${item.treatment}</td></tr>`).join("")}</tbody></table></div>`, { action: '<span class="status-pill warn">Assumptions</span>' })}</div>
      <div class="span-5">${panel(
        "Home-fixture requirements",
        "Synthetic requirement quantities; the operations owner must confirm availability.",
        `<div class="decision-list">${needs
          .map(
            (item, index) =>
              `<div class="decision-row"><span class="priority-bar ${index === 0 ? "high" : ""}"></span><span><b>${item.item}</b><small>${item.quantity == null ? "Quantity to confirm" : `${item.quantity} assumed required`}</small></span><span class="status-pill ${item.quantity == null ? "warn" : ""}">${item.quantity == null ? "Unspecified" : "Quantity mapped"}</span></div>`,
          )
          .join(
            "",
          )}</div><button class="ghost-button" data-view="decisions" type="button">Escalate an open item →</button>`,
        {
          action: `<span class="status-pill warn">${needs.length - specified} quantities unspecified</span>`,
        },
      )}</div>
    </section>`;
}

function programsView() {
  const fixtures = filteredFixtures();
  const programStats = (state.program === "All" ? ["Men", "Women"] : [state.program]).map(
    (program) => ({
      program,
      ...fixtureMetrics(fixtures.filter((row) => row.program === program)),
    }),
  );
  return `${viewHeader()}
    <div class="comparison-grid">${programStats.map((program) => `<article class="card program-card ${program.program.toLowerCase()}"><span class="section-kicker">${program.program}’s program · 2026 sample</span><h2>${money(program.revenue)}</h2><p>Synthetic revenue across ${program.count} example home fixtures.</p><div class="program-metrics"><div><small>Avg paid attendance</small><b>${number(program.averagePaid)}</b></div><div><small>Direct contribution</small><b>${money(program.contribution)}</b></div><div><small>Paid-weighted returning share</small><b>${percent(program.returningPct)}</b></div></div></article>`).join("")}</div>
    <section class="section-grid">
      <div class="span-8">${panel(
        "Like-for-like measures",
        "Each column retains its unit. Contribution is normalized per home fixture; return share is weighted by paid attendance.",
        `<div class="data-table-wrap"><table class="data-table" id="program-comparison"><thead><tr><th>Program</th><th>Fixtures</th><th>Paid / fixture</th><th>Direct contribution / fixture</th><th>Capacity fill</th><th>Returning share</th></tr></thead><tbody>${programStats.map((row) => `<tr><td><strong>${row.program}</strong></td><td>${row.count}</td><td>${number(row.averagePaid)}</td><td>${money(row.averageContribution)}</td><td>${percent(row.fillPct)}</td><td>${percent(row.returningPct)}</td></tr>`).join("")}</tbody></table></div>`,
        { action: '<span class="status-pill">2026 sample</span>' },
      )}</div>
      <div class="span-4">${panel("Allocation guardrails", "Questions to answer before reallocating shared resources.", `<div class="decision-list"><div class="decision-row"><span class="priority-bar high"></span><span><b>Is the KPI definition identical?</b><small>Use one attendance and contribution definition.</small></span></div><div class="decision-row"><span class="priority-bar"></span><span><b>Is the fixture opportunity equivalent?</b><small>Normalize for capacity and match volume.</small></span></div><div class="decision-row"><span class="priority-bar"></span><span><b>Is the evidence complete?</b><small>Do not turn unknown home/away mix into a finding.</small></span></div></div>`, { action: '<span class="status-pill warn">Governed</span>' })}</div>
      <div class="span-12">${panel("Program evidence table", "Selected 2026 synthetic fixtures. Shared overhead and full-season opportunity are not supplied.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Fixture</th><th>Program</th><th>Paid</th><th>Revenue</th><th>Direct cost</th><th>Direct contribution</th><th>Returning</th></tr></thead><tbody>${fixtures.map((fixture) => `<tr data-fixture="${fixture.id}"><td><strong>${fixture.opponent}</strong></td><td>${fixture.program}</td><td>${number(fixture.paid)}</td><td>${money(fixture.totalRevenue)}</td><td>${money(fixture.cost)}</td><td>${money(fixture.totalRevenue - fixture.cost)}</td><td>${percent(fixture.returningPct, 0)}</td></tr>`).join("")}</tbody></table></div>`, { action: '<button class="secondary-button" data-action="export-programs">Export comparison</button>' })}</div>
    </section>`;
}

function scenarioCalculation(model = scenarioModel) {
  return calculateSeasonScenario(model);
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
      ${panel(
        "Scenario assumptions",
        "All costs below are per home fixture except sponsor funding, which is a single season allocation.",
        `<div class="segmented" style="margin-bottom:16px">${data.scenarioPresets.map((preset) => `<button data-preset="${preset.id}" class="${preset.id === scenarioModel.id ? "active" : ""}">${preset.name}</button>`).join("")}</div><div class="scenario-controls"><label>Scenario program<select id="scenario-program" aria-label="Scenario program"><option ${scenarioModel.program === "Men" ? "selected" : ""}>Men</option><option ${scenarioModel.program === "Women" ? "selected" : ""}>Women</option></select></label>${rangeControl("expectedAttendance", "Demand per home fixture", 0, 8000, 1)}${rangeControl("venueCapacity", "Venue capacity", 500, 10000, 100)}${rangeControl("ticketPrice", "Average paid ticket price", 0, 40, 1, preciseMoney)}${rangeControl("homeMatches", "Assumed home matches", 1, 16, 1)}${rangeControl("complimentaryPct", "Complimentary share of attendance", 0, 100, 1, (value) => percent(value, 0))}${rangeControl("concessionParticipationPct", "Concession participation", 0, 100, 1, (value) => percent(value, 0))}${rangeControl("averageConcessionSpend", "Average concession spend", 0, 25, 0.25, preciseMoney)}${rangeControl("sponsorIncome", "Season sponsor allocation", 0, 50000, 500, preciseMoney)}</div><details class="assumption-details"><summary>All cost, allocation and risk assumptions</summary><div class="scenario-controls">${[
          ["marketingSpend", "Marketing / fixture"],
          ["staffing", "Staffing / fixture"],
          ["security", "Security / fixture"],
          ["officials", "Officials / fixture"],
          ["venueCosts", "Venue / fixture"],
          ["transportation", "Transport / fixture"],
          ["equipment", "Equipment / fixture"],
        ]
          .map(([key, label]) => rangeControl(key, label, 0, 30000, 50, preciseMoney))
          .join(
            "",
          )}${rangeControl("variableCostPerAttendee", "Consumables cost / attendee", 0, 20, 0.1, preciseMoney)}${rangeControl("merchandiseParticipationPct", "Merchandise participation", 0, 100, 1, (value) => percent(value, 0))}${rangeControl("averageMerchandiseSpend", "Average merchandise spend", 0, 100, 1, preciseMoney)}${rangeControl("communityAllocationPct", "Community allocation / total revenue", 0, 100, 1, (value) => percent(value, 0))}${rangeControl("weatherRiskPct", "Weather allowance / variable receipts", 0, 50, 1, (value) => percent(value, 0))}${rangeControl("operationalRiskPct", "Operational allowance / variable receipts", 0, 50, 1, (value) => percent(value, 0))}</div></details><div style="display:flex;gap:8px;margin-top:18px"><button class="secondary-button" data-action="reset-scenario">Reset</button><button class="primary-button" data-action="export-scenario">Export full scenario</button></div>`,
        { action: '<span class="status-pill warn">Planning assumptions</span>' },
      )}
      ${panel("Season scenario outcome", "Attendance and all attendee-linked receipts are capped at venue capacity. Expected paid attendance may be fractional in the planning equation.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Season revenue</small><b id="scenario-revenue">${money(result.totalRevenue)}</b><span>Tickets + concessions + merchandise + sponsor funding</span></div><div class="scenario-output"><small>Contribution after risk allowance</small><b id="scenario-contribution">${money(result.contribution)}</b><span id="scenario-margin">${percent(result.margin)} of scenario revenue</span></div><div class="scenario-output"><small>Break-even total attendance</small><b id="scenario-break-even">${breakEvenLabel(result)}</b><span id="scenario-feasibility">${result.feasible ? "Per home fixture · within capacity" : "Not achievable within current capacity"}</span></div><div class="scenario-output"><small>Season risk allowance</small><b id="scenario-risk">${money(result.riskReserve)}</b><span>Planning deduction, not an observed expense</span></div></div><div class="scenario-waterfall" id="scenario-waterfall">${waterfall(result)}</div><div id="scenario-detail">${scenarioDetail(result)}</div><div class="callout ${result.contribution >= 0 ? "info" : "warn"}" id="scenario-callout"><b>${result.contribution >= 0 ? "Positive scenario contribution." : "Negative scenario contribution."}</b> Validate assumptions, funding and an authorized cash balance before any approval.</div>`, { action: '<span class="status-pill" id="scenario-status">Calculated from assumptions</span>' })}
    </section>`;
}

function breakEvenLabel(result) {
  return result.breakEven === null ? "No finite solution" : number(result.breakEven);
}
function scenarioDetail(result) {
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Season equation component</th><th>Amount</th></tr></thead><tbody>${[
    ["Ticket receipts", result.ticket],
    ["Concession receipts", result.concession],
    ["Merchandise receipts", result.merchandise],
    ["Sponsor allocation (once per season)", scenarioModel.sponsorIncome],
    ["Fixed direct costs × home matches", -result.fixedSeasonCost],
    ["Attendance-linked consumables cost", -result.attendeeCost],
    ["Community allocation", -result.community],
    ["Risk allowance", -result.riskReserve],
    ["Contribution after allowance", result.contribution],
  ]
    .map(([label, value]) => `<tr><td>${label}</td><td>${preciseMoney(value)}</td></tr>`)
    .join(
      "",
    )}</tbody></table></div><p class="method-note">Break-even is the smallest whole total attendance per home fixture for which this same equation reaches zero. Sponsor funding is reduced by community allocation; risk applies only to attendee-linked receipts. No home/away allocation is assumed to be club-approved.</p>`;
}

function waterfall(result) {
  const items = [
    { label: "Revenue", value: result.totalRevenue, className: "" },
    { label: "Direct costs", value: result.seasonCost, className: "negative" },
    { label: "Community", value: result.community, className: "negative" },
    { label: "Risk reserve", value: result.riskReserve, className: "negative" },
    { label: "Contribution", value: result.contribution, className: "total" },
  ];
  const maximum = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return items
    .map(
      (item) =>
        `<div class="waterfall-column ${item.className} ${item.value < 0 ? "negative" : ""}"><b>${money(item.className === "negative" ? -item.value : item.value)}</b><i style="height:${Math.max(4, (Math.abs(item.value) / maximum) * 118)}px"></i><span>${item.label}</span></div>`,
    )
    .join("");
}

function decisionsView() {
  const filtered = filteredDecisions();
  return `${viewHeader(false)}
    <div class="segmented" style="margin-bottom:14px"><button data-decision-filter="All" class="${state.decisionFilter === "All" ? "active" : ""}">All ${data.decisions.length}</button><button data-decision-filter="High" class="${state.decisionFilter === "High" ? "active" : ""}">High priority</button><button data-decision-filter="Medium" class="${state.decisionFilter === "Medium" ? "active" : ""}">Medium priority</button></div>
    <section class="decision-board">${filtered.map((decision) => `<button class="card decision-card interactive" data-decision="${decision.id}" type="button" style="text-align:left"><div style="display:flex;justify-content:space-between"><span class="status-pill ${decision.priority.toLowerCase()}">${decision.priority}</span><small style="color:var(--muted)">${decision.id}</small></div><h3>${decision.title}</h3><p>${decision.evidence}</p><div class="decision-meta"><div><small>Owner</small><b>${decision.owner}</b></div><div><small>Timing</small><b>${decision.due}</b></div></div></button>`).join("")}</section>
    <section class="section-grid"><div class="span-8">${panel("Decision operating rhythm", "A recruiter-facing example of how the hub moves analysis into governance.", `<div class="lineage"><div class="lineage-node"><div><b>Signal</b><small>Metric moves or control fails</small></div></div><div class="lineage-node"><div><b>Evidence</b><small>Source and definition reviewed</small></div></div><div class="lineage-node"><div><b>Finding</b><small>Impact and uncertainty stated</small></div></div><div class="lineage-node"><div><b>Decision</b><small>Owner and recommendation named</small></div></div><div class="lineage-node"><div><b>Follow-through</b><small>Action and outcome reviewed</small></div></div></div>`, { action: '<span class="status-pill good">Governed</span>' })}</div><div class="span-4">${panel("Meeting convenience", "Use the register as the standing agenda.", `<div class="callout info"><b>15-minute sequence</b><br>1. Review high-priority decisions.<br>2. Confirm evidence gaps.<br>3. Assign the next action.<br>4. Record what changed.</div><button class="primary-button" data-action="print-view" style="margin-top:12px">Print meeting brief</button>`, { action: '<span class="status-pill">Weekly</span>' })}</div></section>`;
}

function qualityView() {
  const controlTable = (checks) =>
    `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Control</th><th>Expected</th><th>Calculated</th><th>Difference</th><th>Result</th></tr></thead><tbody>${checks.map((check) => `<tr><td><strong>${check.name}</strong>${check.scope ? `<br><small>${check.scope}</small>` : ""}</td><td>${check.expected}</td><td>${check.actual}</td><td>${check.difference == null ? "Unknown" : check.difference.toFixed(2)}</td><td><span class="status-pill ${check.status === "PASS" ? "pass" : "risk"}">${check.status}</span></td></tr>`).join("")}</tbody></table></div>`;
  return `${viewHeader(false)}
    <section class="section-grid">
      <div class="span-5">${panel("Calculated control results", "Arithmetic and coverage of the synthetic model; not a club-data assurance score.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Hub checks</small><b>${integrity.passed}/${integrity.total}</b><span>Calculated from the browser input model</span></div><div class="scenario-output"><small>Pipeline checks</small><b>${pipelineControls.passed}/${pipelineControls.total}</b><span>Read from the generated reconciliation manifest</span></div></div><div class="callout info" style="margin-top:12px">Neither count measures privacy completeness, production readiness, or stakeholder acceptance. Privacy scanning and application testing have separate release records.</div><button class="ghost-button" data-detail="evidence" type="button">Read the evidence boundary →</button>`, { action: `<span class="status-pill ${integrity.allPass && pipelineControls.allPass ? "pass" : "risk"}">${integrity.allPass && pipelineControls.allPass ? "Arithmetic checks pass" : "Review required"}</span>` })}</div>
      <div class="span-7">${panel("Dataset lineage & grain", "The finance ledger, operational examples and assumptions are separate scopes.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Dataset</th><th>Grain / coverage</th><th>Evidence class</th></tr></thead><tbody><tr><td>Financial periods</td><td>FY24 and FY25 · club-wide annual cash</td><td>Synthetic control totals</td></tr><tr><td>Monthly / category finance</td><td>FY25 only · no program allocation</td><td>Synthetic breakdown</td></tr><tr><td>Fixtures</td><td>2026 · eight example home fixtures</td><td>Synthetic operational sample</td></tr><tr><td>Sponsor contracts</td><td>2026 · six account examples</td><td>Synthetic contract face value</td></tr><tr><td>Acquisition</td><td>2026 club-wide sample · no program split</td><td>Synthetic stages and channels</td></tr><tr><td>Operating assumptions</td><td>Independent planning examples</td><td>Generalized assumptions; confirmation needed</td></tr></tbody></table></div>`, { action: '<span class="status-pill">Scope explicit</span>' })}</div>
      <div class="span-12">${panel("Hub integrity checks", "Recalculated from the published inputs on build and in the browser.", controlTable(modelChecks), { action: '<button class="secondary-button" data-action="export-quality">Export all controls</button>' })}</div>
      <div class="span-8">${panel("Source-model reconciliation", "Actual rows from data/processed/reconciliation.json; a missing or failed check is never treated as a pass.", controlTable(data.reconciliation.checks), { action: `<span class="status-pill">${pipelineControls.passed}/${pipelineControls.total} pass</span>` })}</div>
      <div class="span-4">${panel("Snapshot & approval status", "Fixed demonstration inputs; no live data connector or scheduled refresh.", `<div class="decision-list"><div class="decision-row"><span><b>Input snapshot</b><small>${new Date(data.meta.snapshotAt).toISOString().slice(0, 10)} · synthetic dataset</small></span></div><div class="decision-row"><span><b>Site build</b><small>${new Date(data.meta.builtAt).toISOString()} · UTC</small></span></div><div class="decision-row"><span><b>PCFC acceptance</b><small>Pending · data owners and KPI definitions to be agreed</small></span></div><div class="decision-row"><span><b>Home/away split</b><small>Unconfirmed · do not extrapolate the fixture sample</small></span></div></div>`, { action: '<span class="status-pill warn">Approval pending</span>' })}</div>
    </section>`;
}

function accessView() {
  const roleColumns = [
    ["Administrator", "ADMINISTRATOR"],
    ["Executive", "EXECUTIVE"],
    ["Analyst", "ANALYST"],
    ["Commercial", "COMMERCIAL"],
    ["Marketing", "MARKETING"],
    ["Operations", "MATCHDAY_OPERATIONS"],
  ];
  const rows = [
    ["Executive pages", "dashboard:read"],
    ["Scenario read", "scenarios:read"],
    ["Scenario write", "scenarios:write"],
    ["Sponsor records", "sponsors:read"],
    ["Operations pages", "operations:read"],
    ["Import write", "imports:write"],
    ["User management", "users:write"],
  ];
  return `${viewHeader(false)}
    <section class="section-grid">
      <div class="span-8">${panel("Full-application permission reference", "Derived from lib/rbac.ts at build time. These are local application roles, not authenticated roles in this public website.", `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Capability</th>${roleColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${rows.map(([label, permission]) => `<tr><td>${label}<br><small>${permission}</small></td>${roleColumns.map(([, role]) => `<td>${data.permissions[role].includes("*") || data.permissions[role].includes(permission) ? "Yes" : "No"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`, { action: '<span class="status-pill">Implementation reference</span>' })}</div>
      <div class="span-4">${panel("Public demonstration", "Anyone with the public URL can inspect these synthetic records.", `<div class="scenario-output-grid"><div class="scenario-output"><small>Views</small><b>${views.length}</b><span>Decision workspaces</span></div><div class="scenario-output"><small>Server writes</small><b>0</b><span>Static local calculations only</span></div></div><div class="callout info" style="margin-top:10px">This deployment has no club database or role-based sign-in. The repository's PostgreSQL and transactional audit workflow is demonstrated separately. Local filters are a convenience, not access control.</div>`, { action: '<span class="status-pill">Public read-only</span>' })}</div>
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
  $("#filter-summary").textContent = viewScope();
  $("#period-filter").value = state.period;
  $("#program-filter").value = state.program;
  const periodApplicable = ["command", "finance"].includes(state.view);
  const programApplicable = ["command", "commercial", "matchday", "programs"].includes(state.view);
  $("#period-filter").disabled = !periodApplicable;
  $("#program-filter").disabled = !programApplicable;
  $("#period-filter").title = periodApplicable
    ? "Applies to club-wide cash measures only"
    : "Not applicable: this view has its own explicit sample or planning scope";
  $("#program-filter").title = programApplicable
    ? "Filters the 2026 sponsor or fixture sample; club-wide accounts are included once"
    : "Not applicable: no program allocation is published for this view";
  $("#controls-summary").textContent = controlsLabel();
  $("#rail-status").textContent = `Public demo · ${controlsLabel()} · read only`;
  $("#workspace-model-label").textContent = periodApplicable
    ? `${state.period} finance · 2026 sample`
    : "Synthetic demonstration";
  $("#workspace").innerHTML = renderers[state.view]();
  document.title = `${views.find((view) => view.id === state.view)?.label || "Hub"} | Port City FC`;
  $("#tooltip").classList.remove("visible");
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
    "How to interpret the evidence",
    `<div class="callout info"><b>${EVIDENCE}</b><br>${data.meta.evidenceBoundary}</div><div class="drawer-section"><h3>Evidence classes</h3><p><b>Synthetic:</b> invented public control totals and operational examples. <b>Calculated:</b> arithmetic over those synthetic inputs. <b>Assumption:</b> generalized planning input requiring PCFC confirmation. <b>Unavailable:</b> no value is inferred.</p></div><div class="drawer-section"><h3>Separate scopes</h3><p>FY24 contains annual totals only. FY25 has a monthly and category cash model without program allocation. Fixtures and sponsor contracts are a separate 2026 sample; contract face value is not cash received. Acquisition is club-wide and has no program attribution. Scenario outputs are independent planning cases.</p></div><div class="drawer-section"><h3>Validation boundary</h3><p>${controlsLabel()}; ${pipelineControls.passed}/${pipelineControls.total} pipeline checks pass. These controls establish internal arithmetic and coverage only. They do not certify private documents, bank balances, data freshness, business assumptions or stakeholder acceptance.</p></div><div class="drawer-section"><button class="primary-button" data-view="quality">Inspect calculated controls →</button></div>`,
  );
}

function presentationBody() {
  const finance = financeModel(data, "FY25");
  const sponsors = sponsorMetrics(data.sponsors);
  return `<div class="callout info"><b>PCFC stakeholder review · proposal for a validation pilot</b><p>${EVIDENCE}. This briefing demonstrates the analytical method. It sets out approval requests for validation and ownership decisions; it does not establish the club's current financial position.</p></div><div class="drawer-section"><h3>1 · Agree the reserve decision</h3><p>The FY25 synthetic model has ${money(finance.inflow)} inflow, ${money(finance.outflow)} outflow and ${money(finance.netCash)} net movement (${percent(finance.netCashMarginPct)} of inflow). The ratio is ${finance.coverage.toFixed(2)}×. No opening balance or payment schedule is supplied, so cash runway is unknown.</p><p><b>Request:</b> nominate a finance data owner, approve the cash-movement definition, and agree how to set a reserve policy using authorized balances.</p></div><div class="drawer-section"><h3>2 · Assign sponsor delivery ownership</h3><p>FY25 sponsorship is ${percent(finance.sponsorshipSharePct)} of synthetic cash inflow. Separately, the 2026 sample contains ${sponsors.count} accounts, ${money(sponsors.value)} contract face value and ${sponsors.overdue} overdue assets across ${data.sponsors.filter((row) => row.overdue > 0).length} accounts. These samples are not the same accounting period or measure.</p><p><b>Request:</b> confirm actual accounts, contract dates, receipt treatment and one accountable owner per deliverable before adopting the renewal workflow.</p></div><div class="drawer-section"><h3>3 · Validate fixture economics before extrapolation</h3><p>The eight 2026 home-fixture examples illustrate direct contribution and paid-attendance comparisons. They do not establish an approved schedule, home/away split or shared-cost allocation. The scenario model exposes every assumption and uses one equation for contribution and break-even.</p><p><b>Request:</b> operations to confirm the schedule, attendance definition, direct-cost basis and allocation of season commitments.</p></div><div class="drawer-section"><h3>Proposed pilot and acceptance</h3><p>Run one agreed reporting period in parallel with existing records. Reconcile cash totals and one fixture end to end; have finance, commercial and operations reviewers sign the KPI definitions, filter/export results and exceptions. Production hosting, access, recovery and support ownership are separate adoption gates.</p><p><b>Success measure:</b> agreed source totals reconcile without unexplained differences; named reviewers can trace each presented KPI to its approved scope and definition.</p></div><div class="drawer-section"><h3>Presentation route · 8 minutes</h3><p>Context and evidence boundary → cash flow → sponsor exception → fixture drill-down → scenario sensitivity → decision register and the three approval requests.</p></div>`;
}

function presentationBrief() {
  openDrawer(
    "Owner briefing · synthetic demonstration",
    "Decisions for the validation pilot",
    `${presentationBody()}<button class="primary-button" data-action="print-owner-brief">Print owner briefing</button>`,
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
  const finance = selectedFinance();
  const item = [...finance.income, ...finance.expenses].find((row) => row.name === name);
  if (!item) return;
  const income = finance.income.some((row) => row.name === name);
  const total = income ? finance.inflow : finance.outflow;
  openDrawer(
    `${state.period} · club-wide synthetic ${income ? "inflow" : "outflow"} category`,
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
    "Proposed stakeholder agenda",
    `<div class="decision-list">${data.decisions
      .slice(0, 3)
      .map(
        (decision) =>
          `<button class="decision-row" data-decision="${decision.id}"><span class="priority-bar ${decision.priority.toLowerCase()}"></span><span><b>${decision.title}</b><small>${decision.owner}</small></span><time>${decision.due}</time></button>`,
      )
      .join(
        "",
      )}</div><div class="drawer-section"><p>This is a curated demonstration agenda, not a live operational alert feed. Owner roles and timing are proposals requiring PCFC agreement.</p></div>`,
  );
}

function showToast(title, detail = "") {
  $("#toast-region")
    .querySelectorAll(".toast")
    .forEach((item) => {
      if (item.dataset.title === title) item.remove();
    });
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.title = title;
  toast.innerHTML = `<span>✓</span><div><b>${title}</b>${detail ? `<small>${detail}</small>` : ""}</div>`;
  $("#toast-region").append(toast);
  while ($("#toast-region").children.length > 3) $("#toast-region").firstElementChild.remove();
  setTimeout(() => toast.remove(), 3800);
}

function downloadCsv(filename, rows) {
  const blob = new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast("Export prepared", `${filename} includes evidence, scope, inputs and measures.`);
}

function exportFor(action) {
  const result = buildExport(data, { ...state, scenarioModel }, action);
  downloadCsv(result.filename, result.rows);
}

function resetScenario(preset = baseline) {
  scenarioModel = { ...preset };
  render();
  showToast("Scenario reset", `${scenarioModel.name} assumptions restored.`);
}

function updateScenario() {
  const result = scenarioCalculation();
  $("#scenario-revenue").textContent = money(result.totalRevenue);
  $("#scenario-contribution").textContent = money(result.contribution);
  $("#scenario-margin").textContent = `${percent(result.margin)} of scenario revenue`;
  $("#scenario-break-even").textContent = breakEvenLabel(result);
  $("#scenario-feasibility").textContent = result.feasible
    ? "Per home fixture · within capacity"
    : "Not achievable within current capacity";
  $("#scenario-risk").textContent = money(result.riskReserve);
  $("#scenario-waterfall").innerHTML = waterfall(result);
  $("#scenario-detail").innerHTML = scenarioDetail(result);
  $("#view-scope").innerHTML =
    `<b>Synthetic demonstration</b><span>${viewScope()}</span><small>Independent assumptions; PCFC approval pending.</small>`;
  $("#filter-summary").textContent = viewScope();
  $("#scenario-callout").className = `callout ${result.contribution >= 0 ? "info" : "warn"}`;
  $("#scenario-callout").innerHTML =
    `<b>${result.contribution >= 0 ? "Positive scenario contribution." : "Negative scenario contribution."}</b> Validate assumptions, funding and an authorized cash balance before approval.`;
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
  else if (action === "presentation-brief") presentationBrief();
  else if (action === "print-owner-brief") {
    $("#presentation-print").innerHTML =
      `<h1>Port City FC · stakeholder review briefing</h1>${presentationBody()}<p>Input snapshot: ${data.meta.snapshotAt} · Release: ${data.meta.release}</p>`;
    document.body.classList.add("print-owner");
    window.print();
  }
}
window.addEventListener("afterprint", () => document.body.classList.remove("print-owner"));

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
        : "Showing synthetic inflow and outflow for the selected fiscal period.",
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
  showToast(
    "Finance period updated",
    `${state.period} applies to club-wide cash measures. The 2026 sample is independent.`,
  );
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
      const key = event.target.dataset.scenarioInput;
      const formatter = key.endsWith("Pct")
        ? (value) => percent(value, 0)
        : key === "expectedAttendance" || key === "homeMatches" || key === "venueCapacity"
          ? number
          : preciseMoney;
      output.textContent = formatter(Number(event.target.value));
    }
    $("#workspace")
      .querySelectorAll("[data-preset]")
      .forEach((button) => button.classList.remove("active"));
    updateScenario();
  } else if (event.target.id === "sponsor-search") {
    state.sponsorQuery = event.target.value;
    $("#workspace").innerHTML = commercialView();
    $("#sponsor-search").focus({ preventScroll: true });
  }
});

$("#workspace").addEventListener("change", (event) => {
  if (event.target.id === "sponsor-sort") {
    state.sponsorSort = event.target.value;
    $("#workspace").innerHTML = commercialView();
  }
  if (event.target.id === "scenario-program") {
    scenarioModel = { ...scenarioModel, program: event.target.value, id: "custom", name: "Custom" };
    $("#workspace")
      .querySelectorAll("[data-preset]")
      .forEach((button) => button.classList.remove("active"));
    updateScenario();
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
  localStorage.setItem("pcfc-theme-v2", state.theme);
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
    closeDrawer();
    closePalette();
    closeRail();
    render();
  }
});

render();
