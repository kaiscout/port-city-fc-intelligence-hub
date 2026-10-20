import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "../lib/csv";

type Row = Record<string, string>;

const root = process.cwd();
const rawDir = path.join(root, "data", "raw");
const outputDir = path.join(root, "data", "processed");

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  return `${headers.join(",")}\n${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
}

function number(row: Row, key: string) {
  const raw = cell(row, key).trim();
  if (!raw) throw new Error(`Missing numeric value in ${key}`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric value in ${key}`);
  return value;
}

function cell(row: Row, key: string) {
  const value = row[key];
  if (value === undefined) throw new Error(`Missing CSV column ${key}`);
  return value;
}

function dateKey(value: string) {
  return Number(value.replaceAll("-", ""));
}

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function assertNoDirectIdentifiers(name: string, content: string) {
  const email = /\b[A-Z0-9._%+-]+@(?!example\.test\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;
  if (email.test(content) || phone.test(content)) {
    throw new Error(`${name} contains a direct personal identifier`);
  }
}

async function main() {
  const monthlySource = await readFile(path.join(rawDir, "finance_monthly.csv"), "utf8");
  const categorySource = await readFile(path.join(rawDir, "finance_categories.csv"), "utf8");
  const operatingSource = await readFile(path.join(rawDir, "operating_assumptions.csv"), "utf8");
  const staffingSource = await readFile(path.join(rawDir, "staffing_roles.csv"), "utf8");
  const annualSource = await readFile(path.join(rawDir, "financial_periods.json"), "utf8");
  const annual = JSON.parse(annualSource) as {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    transactions: number;
    inflow: number;
    outflow: number;
    netCash: number;
    referenceDate: string;
    evidence: string;
  }[];
  if (
    annual.length !== 2 ||
    new Set(annual.map((r) => r.id)).size !== 2 ||
    annual.some((r) => r.netCash !== r.inflow - r.outflow)
  )
    throw new Error("Annual controls are invalid");
  const controls = JSON.parse(
    await readFile(path.join(rawDir, "control_totals.json"), "utf8"),
  ) as Record<string, number | string>;

  for (const [name, content] of Object.entries({
    monthlySource,
    categorySource,
    operatingSource,
    staffingSource,
  })) {
    assertNoDirectIdentifiers(name, content);
  }

  const monthly = parseCsv(monthlySource);
  const categories = parseCsv(categorySource);
  const operating = parseCsv(operatingSource);
  const staffing = parseCsv(staffingSource);
  if (new Set(monthly.map((r) => r.MonthStart)).size !== monthly.length)
    throw new Error("Duplicate cash month");

  const dimDate = toCsv(
    ["DateKey", "Date", "Month", "MonthNumber", "Quarter", "Year"],
    monthly.map((row) => {
      const monthStart = cell(row, "MonthStart");
      const date = new Date(`${monthStart}T00:00:00Z`);
      return [
        dateKey(monthStart),
        monthStart,
        date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        date.getUTCMonth() + 1,
        `Q${Math.floor(date.getUTCMonth() / 3) + 1}`,
        date.getUTCFullYear(),
      ];
    }),
  );

  const dimProgram = toCsv(
    ["ProgramKey", "Program"],
    [
      ["CLUB", "Club-wide"],
      ...operating.map((row) => [cell(row, "ProgramKey"), cell(row, "Program")]),
    ],
  );

  const dimMetric = toCsv(
    ["MetricKey", "Metric", "MetricGroup", "Unit"],
    [
      ["FIN_IN", "Cash inflow", "Finance", "USD"],
      ["FIN_OUT", "Cash outflow", "Finance", "USD"],
      ["AVG_ATT", "Average attendance", "Operations", "People"],
      ["TICKET_PRICE", "Ticket price", "Operations", "USD"],
      ["BASE_MATCHES", "Base matches", "Operations", "Count"],
      ["PLAYOFF_MATCHES", "Matches including playoffs", "Operations", "Count"],
      ["CONC_SPEND", "Average concession spend", "Operations", "USD"],
    ],
  );

  const dimCategory = toCsv(
    ["CategoryKey", "Category", "Direction"],
    categories.map((row, index) => [
      `CAT_${String(index + 1).padStart(2, "0")}`,
      cell(row, "Category"),
      cell(row, "Direction"),
    ]),
  );

  const factFinance = toCsv(
    ["DateKey", "ProgramKey", "MetricKey", "Amount", "SourceClass"],
    monthly.flatMap((row) => [
      [
        dateKey(cell(row, "MonthStart")),
        "CLUB",
        "FIN_IN",
        number(row, "Inflow"),
        cell(row, "SourceClass"),
      ],
      [
        dateKey(cell(row, "MonthStart")),
        "CLUB",
        "FIN_OUT",
        number(row, "Outflow"),
        cell(row, "SourceClass"),
      ],
    ]),
  );

  const factFinanceCategory = toCsv(
    ["DateKey", "ProgramKey", "CategoryKey", "Amount", "SourceClass"],
    categories.map((row, index) => [
      20251201,
      "CLUB",
      `CAT_${String(index + 1).padStart(2, "0")}`,
      number(row, "Amount"),
      cell(row, "SourceClass"),
    ]),
  );

  const operationalMetrics = [
    ["AVG_ATT", "AverageAttendance"],
    ["TICKET_PRICE", "TicketPrice"],
    ["BASE_MATCHES", "BaseMatches"],
    ["PLAYOFF_MATCHES", "PlayoffMatches"],
    ["CONC_SPEND", "ConcessionSpend"],
  ] as const;
  const factOperations = toCsv(
    ["DateKey", "ProgramKey", "MetricKey", "Value", "SourceClass"],
    operating.flatMap((row) =>
      operationalMetrics.map(([metricKey, column]) => [
        20250101,
        cell(row, "ProgramKey"),
        metricKey,
        number(row, column),
        cell(row, "SourceClass"),
      ]),
    ),
  );

  const dimStaffingRole = toCsv(
    ["RoleKey", "Role", "CoverageStatus", "SourceClass"],
    staffing.map((row) => [
      cell(row, "RoleKey"),
      cell(row, "Role"),
      cell(row, "CoverageStatus"),
      cell(row, "SourceClass"),
    ]),
  );

  const monthlyInflow = monthly.reduce((sum, row) => sum + number(row, "Inflow"), 0);
  const monthlyOutflow = monthly.reduce((sum, row) => sum + number(row, "Outflow"), 0);
  const categoryInflow = categories
    .filter((row) => cell(row, "Direction") === "Inflow")
    .reduce((sum, row) => sum + number(row, "Amount"), 0);
  const categoryOutflow = categories
    .filter((row) => cell(row, "Direction") === "Outflow")
    .reduce((sum, row) => sum + number(row, "Amount"), 0);

  const outputs = {
    "public-reference.json":
      JSON.stringify(
        {
          referenceDate: annual[0]!.referenceDate,
          financialPeriods: annual,
          incomeCategories: categories
            .filter((r) => r.Direction === "Inflow")
            .map((r) => ({ name: r.Category, amount: Number(r.Amount) })),
          expenseCategories: categories
            .filter((r) => r.Direction === "Outflow")
            .map((r) => ({ name: r.Category, amount: Number(r.Amount) })),
          monthly: monthly.map((r) => ({
            month:
              new Date(`${r.MonthStart}T00:00:00Z`).toLocaleString("en-US", {
                month: "short",
                timeZone: "UTC",
              }) + " 25",
            inflow: Number(r.Inflow),
            outflow: Number(r.Outflow),
            net: Number(r.Inflow) - Number(r.Outflow),
          })),
          operating: operating.map((r) => ({
            program: r.Program,
            averageAttendance: Number(r.AverageAttendance),
            ticketPrice: Number(r.TicketPrice),
            baseMatches: Number(r.BaseMatches),
            playoffMatches: Number(r.PlayoffMatches),
            concessionSpend: Number(r.ConcessionSpend),
          })),
        },
        null,
        2,
      ) + "\n",
    "dim_date.csv": dimDate,
    "dim_program.csv": dimProgram,
    "dim_metric.csv": dimMetric,
    "dim_category.csv": dimCategory,
    "dim_staffing_role.csv": dimStaffingRole,
    "fact_finance.csv": factFinance,
    "fact_finance_category.csv": factFinanceCategory,
    "fact_operations.csv": factOperations,
  };

  const checks = [
    { name: "Monthly inflow to control", expected: controls.inflow, actual: monthlyInflow },
    { name: "Category inflow to control", expected: controls.inflow, actual: categoryInflow },
    { name: "Monthly outflow to control", expected: controls.outflow, actual: monthlyOutflow },
    { name: "Category outflow to control", expected: controls.outflow, actual: categoryOutflow },
    {
      name: "Net cash to control",
      expected: controls.netCash,
      actual: monthlyInflow - monthlyOutflow,
    },
    { name: "Month count", expected: controls.months, actual: monthly.length },
    { name: "Program count", expected: controls.programs, actual: operating.length },
  ].map((check) => ({
    ...check,
    difference: Number(check.actual) - Number(check.expected),
    status: Number(check.actual) === Number(check.expected) ? "PASS" : "FAIL",
  }));
  const current = annual.find((r) => r.id === "FY25");
  if (!current || current.inflow !== monthlyInflow || current.outflow !== monthlyOutflow)
    throw new Error("Annual source does not reconcile to monthly inputs");

  if (checks.some((check) => check.status === "FAIL")) {
    throw new Error(`Reconciliation failed: ${JSON.stringify(checks)}`);
  }

  await mkdir(outputDir, { recursive: true });
  for (const [name, content] of Object.entries(outputs)) {
    await writeFile(path.join(outputDir, name), content, "utf8");
  }

  const reconciliation = {
    generatedAt: "2026-10-12T00:00:00.000Z",
    referenceDate: annual[0]!.referenceDate,
    timestampMeaning:
      "generatedAt is the retained deterministic input-snapshot timestamp, not the execution/build date",
    sourceSha256: {
      "financial_periods.json": sha256(annualSource),
      "finance_monthly.csv": sha256(monthlySource),
      "finance_categories.csv": sha256(categorySource),
      "operating_assumptions.csv": sha256(operatingSource),
      "staffing_roles.csv": sha256(staffingSource),
    },
    classification: "Synthetic demonstration data",
    privacyBoundary:
      "No staff contacts, source payees, bank transactions, private filenames or interview attribution.",
    checks,
    rowCounts: {
      dimDate: monthly.length,
      dimProgram: operating.length + 1,
      dimMetric: 7,
      dimCategory: categories.length,
      dimStaffingRole: staffing.length,
      factFinance: monthly.length * 2,
      factFinanceCategory: categories.length,
      factOperations: operating.length * operationalMetrics.length,
    },
    sha256: Object.fromEntries(
      Object.entries(outputs).map(([name, content]) => [name, sha256(content)]),
    ),
  };
  await writeFile(
    path.join(outputDir, "reconciliation.json"),
    `${JSON.stringify(reconciliation, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify({
      event: "public_dataset.built",
      checks: checks.length,
      outputs: Object.keys(outputs).length + 1,
    }),
  );
}

void main();
