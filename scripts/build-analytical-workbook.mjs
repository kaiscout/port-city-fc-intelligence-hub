import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = process.cwd();
const outputDir = path.join(root, "outputs", "01a128c4-1c8c-71b0-819c-29eaae5a311f");
const dataDir = path.join(root, "data", "processed");
const fontFamily = "Aptos";
const colors = {
  navy: "#061A2D",
  navy2: "#0B2942",
  teal: "#00A896",
  orange: "#F59E0B",
  blue: "#2F80ED",
  ink: "#142033",
  muted: "#607086",
  line: "#D7E0E8",
  pale: "#F4F7FA",
  green: "#DCFCE7",
  greenInk: "#166534",
  white: "#FFFFFF",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function readCsv(name) {
  return parseCsv(await fs.readFile(path.join(dataDir, name), "utf8"));
}

function styleBase(sheet, range = "A1:Z100") {
  sheet.showGridLines = false;
  sheet.getRange(range).format.font = {
    name: fontFamily,
    size: 10,
    color: colors.ink,
  };
}

function styleTitle(sheet, title, subtitle, endColumn = "N") {
  sheet.mergeCells(`A1:${endColumn}2`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${endColumn}2`).format = {
    fill: colors.navy,
    font: { name: fontFamily, size: 22, bold: true, color: colors.white },
    verticalAlignment: "center",
  };
  sheet.mergeCells(`A3:${endColumn}3`);
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange(`A3:${endColumn}3`).format = {
    fill: colors.navy2,
    font: { name: fontFamily, size: 10, color: "#D8E5EF" },
    verticalAlignment: "center",
  };
  sheet.getRange("1:1").format.rowHeight = 24;
  sheet.getRange("2:2").format.rowHeight = 24;
  sheet.getRange("3:3").format.rowHeight = 24;
}

function styleHeader(range) {
  range.format = {
    fill: colors.navy2,
    font: { name: fontFamily, bold: true, color: colors.white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.line },
  };
  range.format.rowHeight = 24;
}

function addKpi(sheet, labelRange, valueRange, label, formula, numberFormat, accent) {
  sheet.mergeCells(labelRange);
  sheet.getRange(labelRange.split(":")[0]).values = [[label]];
  sheet.getRange(labelRange).format = {
    fill: colors.pale,
    font: { name: fontFamily, size: 10, bold: true, color: colors.muted },
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  sheet.mergeCells(valueRange);
  sheet.getRange(valueRange.split(":")[0]).formulas = [[formula]];
  sheet.getRange(valueRange).format = {
    fill: colors.white,
    font: { name: fontFamily, size: 20, bold: true, color: accent },
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
    numberFormat,
  };
}

const [dateRows, metricRows, categoryRows, financeRows, categoryFactRows, operationsRows] =
  await Promise.all([
    readCsv("dim_date.csv"),
    readCsv("dim_metric.csv"),
    readCsv("dim_category.csv"),
    readCsv("fact_finance.csv"),
    readCsv("fact_finance_category.csv"),
    readCsv("fact_operations.csv"),
  ]);
const reconciliation = JSON.parse(
  await fs.readFile(path.join(dataDir, "reconciliation.json"), "utf8"),
);

const metricByKey = new Map(metricRows.slice(1).map((row) => [row[0], row]));
const categoryByKey = new Map(categoryRows.slice(1).map((row) => [row[0], row]));

const monthly = dateRows.slice(1).map((dateRow) => {
  const financeForMonth = financeRows.slice(1).filter((row) => row[0] === dateRow[0]);
  const inflow = Number(financeForMonth.find((row) => row[2] === "FIN_IN")?.[3] ?? 0);
  const outflow = Number(financeForMonth.find((row) => row[2] === "FIN_OUT")?.[3] ?? 0);
  return [dateRow[2], inflow, outflow];
});
const categories = categoryFactRows.slice(1).map((fact) => {
  const category = categoryByKey.get(fact[2]);
  return [category?.[1] ?? fact[2], category?.[2] ?? "", Number(fact[3])];
});
const assumptions = operationsRows.slice(1).map((fact) => {
  const metric = metricByKey.get(fact[2]);
  return [
    fact[1] === "MEN" ? "Men's" : "Women's",
    metric?.[1] ?? fact[2],
    Number(fact[3]),
    metric?.[3] ?? "",
    fact[4],
  ];
});

await fs.mkdir(outputDir, { recursive: true });
const filename = path.join(outputDir, "PortCityFC_Analytics_Companion.xlsx");
const existing = await fs.access(filename).then(
  () => true,
  () => false,
);
const workbook = existing
  ? await SpreadsheetFile.importXlsx(await FileBlob.load(filename))
  : Workbook.create();

if (!existing) {
  // Create every sheet before formulas are written.
  const ownership = workbook.worksheets.add("Ownership Snapshot");
  const monthlySheet = workbook.worksheets.add("Monthly Cash");
  const categorySheet = workbook.worksheets.add("Income & Expense");
  const operationsSheet = workbook.worksheets.add("Operating Assumptions");
  const reconciliationSheet = workbook.worksheets.add("Reconciliation");
  const schemaSheet = workbook.worksheets.add("Star Schema");
  const dictionarySheet = workbook.worksheets.add("Data Dictionary");
  const readmeSheet = workbook.worksheets.add("Read Me");

  // Monthly cash fact view.
  styleBase(monthlySheet, "A1:F20");
  styleTitle(
    monthlySheet,
    "Monthly Cash Movement",
    "Synthetic FY25 demonstration dataset • formulas reconcile to the published control totals",
    "F",
  );
  monthlySheet.getRange("A5:F5").values = [
    ["Month", "Inflow", "Outflow", "Net cash", "Cumulative net", "Evidence class"],
  ];
  styleHeader(monthlySheet.getRange("A5:F5"));
  monthlySheet.getRange("A6:C17").values = monthly;
  monthlySheet.getRange("D6").formulas = [["=B6-C6"]];
  monthlySheet.getRange("D6:D17").fillDown();
  monthlySheet.getRange("E6").formulas = [["=D6"]];
  monthlySheet.getRange("E7").formulas = [["=E6+D7"]];
  monthlySheet.getRange("E7:E17").fillDown();
  monthlySheet.getRange("F6:F17").values = monthly.map(() => ["Synthetic demonstration data"]);
  monthlySheet.getRange("A18").values = [["Control total"]];
  monthlySheet.getRange("B18").formulas = [["=SUM(B6:B17)"]];
  monthlySheet.getRange("C18").formulas = [["=SUM(C6:C17)"]];
  monthlySheet.getRange("D18").formulas = [["=SUM(D6:D17)"]];
  monthlySheet.getRange("E18").formulas = [["=E17"]];
  monthlySheet.getRange("A18:F18").format = {
    fill: "#E7F6F3",
    font: { name: fontFamily, bold: true, color: colors.navy },
    borders: { preset: "all", style: "thin", color: colors.line },
  };
  monthlySheet.getRange("B6:E18").format.numberFormat = "$#,##0;[Red]-$#,##0";
  monthlySheet.getRange("A5:F18").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  monthlySheet.getRange("A5:F18").format.rowHeight = 22;
  monthlySheet.getRange("A:A").format.columnWidth = 12;
  monthlySheet.getRange("B:E").format.columnWidth = 14;
  monthlySheet.getRange("F:F").format.columnWidth = 28;
  monthlySheet.freezePanes.freezeRows(5);
  monthlySheet.tables.add("A5:F18", true, "MonthlyCashTable").style = "TableStyleMedium2";

  // Income and expense category view.
  styleBase(categorySheet, "A1:E22");
  styleTitle(
    categorySheet,
    "Income & Expense Mix",
    "Category totals are synthetic and reconcile exactly to the FY25 demonstration controls",
    "E",
  );
  categorySheet.getRange("A5:E5").values = [
    ["Category", "Direction", "Amount", "% of direction", "Evidence class"],
  ];
  styleHeader(categorySheet.getRange("A5:E5"));
  categorySheet.getRange("A6:C19").values = categories;
  categorySheet.getRange("D6").formulas = [["=C6/SUMIF($B$6:$B$19,B6,$C$6:$C$19)"]];
  categorySheet.getRange("D6:D19").fillDown();
  categorySheet.getRange("E6:E19").values = categories.map(() => ["Synthetic demonstration data"]);
  categorySheet.getRange("C6:C19").format.numberFormat = "$#,##0";
  categorySheet.getRange("D6:D19").format.numberFormat = "0.0%";
  categorySheet.getRange("A5:E19").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  categorySheet.getRange("A:A").format.columnWidth = 30;
  categorySheet.getRange("B:B").format.columnWidth = 13;
  categorySheet.getRange("C:D").format.columnWidth = 15;
  categorySheet.getRange("E:E").format.columnWidth = 28;
  categorySheet.freezePanes.freezeRows(5);
  categorySheet.tables.add("A5:E19", true, "CategoryMixTable").style = "TableStyleMedium2";

  // Operating assumptions.
  styleBase(operationsSheet, "A1:E20");
  styleTitle(
    operationsSheet,
    "Modeled Football Operations",
    "Sanitized planning assumptions • not historical audited performance",
    "E",
  );
  operationsSheet.getRange("A5:E5").values = [
    ["Program", "Metric", "Value", "Unit", "Evidence class"],
  ];
  styleHeader(operationsSheet.getRange("A5:E5"));
  operationsSheet.getRange("A6:E15").values = assumptions;
  operationsSheet.getRange("C6:C15").format.numberFormat = "0.0";
  operationsSheet.getRange("A5:E15").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  operationsSheet.getRange("A:A").format.columnWidth = 14;
  operationsSheet.getRange("B:B").format.columnWidth = 32;
  operationsSheet.getRange("C:D").format.columnWidth = 12;
  operationsSheet.getRange("E:E").format.columnWidth = 30;
  operationsSheet.freezePanes.freezeRows(5);
  operationsSheet.tables.add("A5:E15", true, "OperatingAssumptionsTable").style =
    "TableStyleMedium2";

  // Reconciliation controls.
  styleBase(reconciliationSheet, "A1:G20");
  styleTitle(
    reconciliationSheet,
    "Source-to-Model Reconciliation",
    `Generated ${reconciliation.generatedAt.slice(0, 10)} • deterministic pipeline • ${reconciliation.classification}`,
    "G",
  );
  reconciliationSheet.getRange("A5:G5").values = [
    ["Control", "Expected", "Actual", "Difference", "Status", "Owner", "Release gate"],
  ];
  styleHeader(reconciliationSheet.getRange("A5:G5"));
  const checks = reconciliation.checks.map((check) => [
    check.name,
    check.expected,
    check.actual,
    check.difference,
    check.status,
    "Analytics owner",
    check.status === "PASS" ? "Cleared" : "Blocked",
  ]);
  reconciliationSheet.getRange(`A6:G${5 + checks.length}`).values = checks;
  reconciliationSheet.getRange(`B6:D${5 + checks.length}`).format.numberFormat = "#,##0.00";
  reconciliationSheet.getRange(`E6:E${5 + checks.length}`).format = {
    fill: colors.green,
    font: { name: fontFamily, bold: true, color: colors.greenInk },
    horizontalAlignment: "center",
  };
  reconciliationSheet.getRange(`A5:G${5 + checks.length}`).format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  reconciliationSheet.getRange("A:A").format.columnWidth = 31;
  reconciliationSheet.getRange("B:D").format.columnWidth = 14;
  reconciliationSheet.getRange("E:G").format.columnWidth = 16;
  reconciliationSheet.freezePanes.freezeRows(5);
  reconciliationSheet.tables.add(`A5:G${5 + checks.length}`, true, "ReconciliationTable").style =
    "TableStyleMedium4";

  // Star schema and RLS design.
  styleBase(schemaSheet, "A1:G35");
  styleTitle(
    schemaSheet,
    "Analytics Model & Security",
    "Power BI companion design • conformed dimensions • one-direction filters • program-level RLS",
    "G",
  );
  schemaSheet.getRange("A5:G5").values = [
    ["Table", "Type", "Grain", "Primary key", "Foreign keys", "Measures / use", "RLS scope"],
  ];
  styleHeader(schemaSheet.getRange("A5:G5"));
  const schemaRows = [
    [
      "DimDate",
      "Dimension",
      "One row per month",
      "DateKey",
      "—",
      "Calendar slicing",
      "All programs",
    ],
    [
      "DimProgram",
      "Dimension",
      "One row per program",
      "ProgramKey",
      "—",
      "Program labels",
      "Role filter",
    ],
    [
      "DimMetric",
      "Dimension",
      "One row per metric",
      "MetricKey",
      "—",
      "Metric labels and units",
      "All metrics",
    ],
    [
      "DimCategory",
      "Dimension",
      "One row per category",
      "CategoryKey",
      "—",
      "Income / expense grouping",
      "All categories",
    ],
    [
      "FactFinance",
      "Fact",
      "Month × finance metric",
      "Composite",
      "Date, Program, Metric",
      "Inflow, outflow, net, margin",
      "Program-filtered",
    ],
    [
      "FactFinanceCategory",
      "Fact",
      "Period × category",
      "Composite",
      "Date, Program, Category",
      "Category amount",
      "Program-filtered",
    ],
    [
      "FactOperations",
      "Fact",
      "Period × program × metric",
      "Composite",
      "Date, Program, Metric",
      "Attendance, price, fixtures",
      "Program-filtered",
    ],
  ];
  schemaSheet.getRange("A6:G12").values = schemaRows;
  schemaSheet.getRange("A5:G12").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  schemaSheet.getRange("A15:G15").values = [
    ["Relationship", "From", "To", "Cardinality", "Filter direction", "Active", "Purpose"],
  ];
  styleHeader(schemaSheet.getRange("A15:G15"));
  const relationships = [
    [
      "Finance_Date",
      "DimDate[DateKey]",
      "FactFinance[DateKey]",
      "1:*",
      "Single",
      "Yes",
      "Monthly finance slicing",
    ],
    [
      "Finance_Program",
      "DimProgram[ProgramKey]",
      "FactFinance[ProgramKey]",
      "1:*",
      "Single",
      "Yes",
      "RLS propagation",
    ],
    [
      "Finance_Metric",
      "DimMetric[MetricKey]",
      "FactFinance[MetricKey]",
      "1:*",
      "Single",
      "Yes",
      "Finance measure filter",
    ],
    [
      "Category_Date",
      "DimDate[DateKey]",
      "FactFinanceCategory[DateKey]",
      "1:*",
      "Single",
      "Yes",
      "Category period",
    ],
    [
      "Category_Program",
      "DimProgram[ProgramKey]",
      "FactFinanceCategory[ProgramKey]",
      "1:*",
      "Single",
      "Yes",
      "RLS propagation",
    ],
    [
      "Category_Category",
      "DimCategory[CategoryKey]",
      "FactFinanceCategory[CategoryKey]",
      "1:*",
      "Single",
      "Yes",
      "Category slicing",
    ],
    [
      "Operations_Date",
      "DimDate[DateKey]",
      "FactOperations[DateKey]",
      "1:*",
      "Single",
      "Yes",
      "Operations period",
    ],
    [
      "Operations_Program",
      "DimProgram[ProgramKey]",
      "FactOperations[ProgramKey]",
      "1:*",
      "Single",
      "Yes",
      "RLS propagation",
    ],
    [
      "Operations_Metric",
      "DimMetric[MetricKey]",
      "FactOperations[MetricKey]",
      "1:*",
      "Single",
      "Yes",
      "Operations measure filter",
    ],
  ];
  schemaSheet.getRange("A16:G24").values = relationships;
  schemaSheet.getRange("A15:G24").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  schemaSheet.getRange("A:A").format.columnWidth = 21;
  schemaSheet.getRange("B:C").format.columnWidth = 26;
  schemaSheet.getRange("D:F").format.columnWidth = 15;
  schemaSheet.getRange("G:G").format.columnWidth = 26;
  schemaSheet.freezePanes.freezeRows(5);

  // Data dictionary.
  styleBase(dictionarySheet, "A1:F30");
  styleTitle(
    dictionarySheet,
    "Data Dictionary",
    "Field definitions for the sanitized public analytical model",
    "F",
  );
  dictionarySheet.getRange("A5:F5").values = [
    ["Dataset", "Field", "Type", "Definition", "Classification", "Validation"],
  ];
  styleHeader(dictionarySheet.getRange("A5:F5"));
  const dictionaryRows = [
    [
      "FactFinance",
      "Amount",
      "Decimal",
      "Synthetic cash movement value",
      "Synthetic",
      "Reconciles to control",
    ],
    ["FactFinance", "MetricKey", "Text", "FIN_IN or FIN_OUT", "Synthetic", "FK to DimMetric"],
    [
      "FactFinanceCategory",
      "Amount",
      "Decimal",
      "Synthetic category total",
      "Synthetic",
      "Reconciles by direction",
    ],
    [
      "FactOperations",
      "Value",
      "Decimal",
      "Sanitized planning assumption",
      "Assumption",
      "Allowed metric list",
    ],
    ["DimProgram", "ProgramKey", "Text", "CLUB, MEN or WOMEN", "Public", "Unique and non-null"],
    ["DimDate", "DateKey", "Integer", "YYYYMMDD surrogate key", "Public", "Unique and non-null"],
    ["DimCategory", "Direction", "Text", "Inflow or Outflow", "Public", "Allowed value list"],
    [
      "Reconciliation",
      "Status",
      "Text",
      "PASS when expected equals actual",
      "Control",
      "No release on failure",
    ],
  ];
  dictionarySheet.getRange("A6:F13").values = dictionaryRows;
  dictionarySheet.getRange("A5:F13").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  dictionarySheet.getRange("A:B").format.columnWidth = 23;
  dictionarySheet.getRange("C:C").format.columnWidth = 13;
  dictionarySheet.getRange("D:D").format.columnWidth = 38;
  dictionarySheet.getRange("E:F").format.columnWidth = 20;
  dictionarySheet.freezePanes.freezeRows(5);

  // Read-me sheet.
  styleBase(readmeSheet, "A1:F25");
  styleTitle(
    readmeSheet,
    "Port City FC Analytics Companion",
    "Recruiter-ready evidence pack for the sanitized, read-only portfolio demonstration",
    "F",
  );
  readmeSheet.mergeCells("A5:F5");
  readmeSheet.getRange("A5").values = [["Purpose"]];
  styleHeader(readmeSheet.getRange("A5:F5"));
  readmeSheet.mergeCells("A6:F7");
  readmeSheet.getRange("A6").values = [
    [
      "This workbook mirrors the web hub's ownership view, demonstrates a reproducible model boundary, and makes every published figure traceable to a synthetic or sanitized analytical source.",
    ],
  ];
  readmeSheet.getRange("A6:F7").format = { wrapText: true, verticalAlignment: "center" };
  readmeSheet.getRange("A9:B9").values = [["Sheet", "Reviewer use"]];
  styleHeader(readmeSheet.getRange("A9:B9"));
  readmeSheet.getRange("A10:B16").values = [
    ["Ownership Snapshot", "Executive decision view and evidence boundary"],
    ["Monthly Cash", "Formula-driven cash movement and cumulative position"],
    ["Income & Expense", "Category composition and contribution"],
    ["Operating Assumptions", "Modeled football operations inputs"],
    ["Reconciliation", "Source-to-model release controls"],
    ["Star Schema", "Model grain, relationships and RLS design"],
    ["Data Dictionary", "Definitions, classification and validation rules"],
  ];
  readmeSheet.getRange("A9:B16").format.borders = {
    preset: "all",
    style: "thin",
    color: colors.line,
  };
  readmeSheet.mergeCells("A18:F18");
  readmeSheet.getRange("A18").values = [["Evidence boundary"]];
  styleHeader(readmeSheet.getRange("A18:F18"));
  readmeSheet.mergeCells("A19:F22");
  readmeSheet.getRange("A19").values = [
    [
      reconciliation.privacyBoundary +
        " This workbook is a portfolio artifact, not an audited financial statement or production planning source.",
    ],
  ];
  readmeSheet.getRange("A19:F22").format = {
    fill: colors.pale,
    font: { name: fontFamily, color: colors.ink },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  readmeSheet.getRange("A:A").format.columnWidth = 28;
  readmeSheet.getRange("B:F").format.columnWidth = 20;

  // Executive ownership snapshot (kept first for one-click presentation).
  styleBase(ownership, "A1:V42");
  styleTitle(
    ownership,
    "Port City FC — Ownership Snapshot",
    "Synthetic demonstration data • modeled operations • decision support, not audited reporting",
    "N",
  );
  for (const column of ["A:C", "E:G", "I:K", "M:N"]) {
    ownership.getRange(column).format.columnWidth = 11;
  }
  ownership.getRange("D:D").format.columnWidth = 3;
  ownership.getRange("H:H").format.columnWidth = 3;
  ownership.getRange("L:L").format.columnWidth = 3;
  addKpi(
    ownership,
    "A5:C5",
    "A6:C8",
    "FY25 CASH INFLOW",
    "='Monthly Cash'!B18",
    "$#,##0",
    colors.teal,
  );
  addKpi(
    ownership,
    "E5:G5",
    "E6:G8",
    "FY25 CASH OUTFLOW",
    "='Monthly Cash'!C18",
    "$#,##0",
    colors.orange,
  );
  addKpi(ownership, "I5:K5", "I6:K8", "NET CASH", "='Monthly Cash'!D18", "$#,##0", colors.blue);
  addKpi(ownership, "M5:N5", "M6:N8", "CASH MARGIN", "=I6/A6", "0.0%", colors.navy);

  const cashChart = ownership.charts.add("line", monthlySheet.getRange("A5:C17"));
  cashChart.title = "Cash movement by month";
  cashChart.titleTextStyle.fontSize = 12;
  cashChart.titleTextStyle.typeface = fontFamily;
  cashChart.legend = { position: "top", textStyle: { typeface: fontFamily } };
  cashChart.xAxis = { axisType: "textAxis", textStyle: { typeface: fontFamily, fontSize: 9 } };
  cashChart.yAxis = {
    numberFormatCode: "$#,##0",
    numberFormatSourceLinked: false,
    textStyle: { typeface: fontFamily, fontSize: 9 },
  };
  cashChart.setPosition("A10", "H25");
  cashChart.series.items[0].fill = colors.teal;
  cashChart.series.items[1].fill = colors.orange;

  const expenseChart = ownership.charts.add("bar", [
    categorySheet.getRange("A5:A11"),
    categorySheet.getRange("C5:C11"),
  ]);
  expenseChart.title = "Largest modeled income categories";
  expenseChart.titleTextStyle.fontSize = 12;
  expenseChart.titleTextStyle.typeface = fontFamily;
  expenseChart.hasLegend = false;
  expenseChart.xAxis = {
    numberFormatCode: "$#,##0",
    numberFormatSourceLinked: false,
    textStyle: { typeface: fontFamily, fontSize: 9 },
  };
  expenseChart.yAxis = { textStyle: { typeface: fontFamily, fontSize: 9 } };
  expenseChart.setPosition("I10", "N25");
  expenseChart.series.items[0].fill = colors.blue;

  ownership.mergeCells("A27:N27");
  ownership.getRange("A27").values = [["OWNER DECISIONS"]];
  styleHeader(ownership.getRange("A27:N27"));
  for (const range of ["A28:D28", "E28:G28", "H28:K28", "L28:N28"]) ownership.mergeCells(range);
  ownership.getRange("A28").values = [["DECISION"]];
  ownership.getRange("E28").values = [["ACCOUNTABILITY"]];
  ownership.getRange("H28").values = [["EVIDENCE & GATE"]];
  ownership.getRange("L28").values = [["STATUS & CADENCE"]];
  styleHeader(ownership.getRange("A28:N28"));
  const decisionRows = [
    [
      "Protect sponsorship concentration",
      "Commercial lead • 30 days",
      "Synthetic mix • pipeline coverage",
      "OPEN • monthly",
    ],
    [
      "Set field and venue guardrails",
      "Operations lead • pre-season",
      "Modeled cost • contracted ceiling",
      "OPEN • weekly",
    ],
    [
      "Approve scenario governance",
      "Executive sponsor • immediate",
      "Audited workflow • named approver",
      "READY • quarterly",
    ],
    [
      "Validate attendance assumptions",
      "Analytics lead • next fixture",
      "Sanitized input • ticket scan source",
      "OPEN • post-match",
    ],
  ];
  for (let row = 29; row <= 32; row += 1) {
    for (const range of [
      `A${row}:D${row}`,
      `E${row}:G${row}`,
      `H${row}:K${row}`,
      `L${row}:N${row}`,
    ]) {
      ownership.mergeCells(range);
    }
    const values = decisionRows[row - 29];
    ownership.getRange(`A${row}`).values = [[values[0]]];
    ownership.getRange(`E${row}`).values = [[values[1]]];
    ownership.getRange(`H${row}`).values = [[values[2]]];
    ownership.getRange(`L${row}`).values = [[values[3]]];
  }
  ownership.getRange("A29:N32").format = {
    fill: colors.pale,
    font: { name: fontFamily, size: 9, color: colors.ink },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.line },
  };
  ownership.getRange("A29:N32").format.rowHeight = 30;
  ownership.mergeCells("A34:N34");
  ownership.getRange("A34").values = [["EVIDENCE BOUNDARY"]];
  styleHeader(ownership.getRange("A34:N34"));
  ownership.mergeCells("A35:N37");
  ownership.getRange("A35").values = [
    [
      "All public figures are synthetic or sanitized assumptions. The reproducible pipeline reconciles every displayed finance total; private staff contacts, transaction rows, payees, source filenames, and interview attribution are excluded.",
    ],
  ];
  ownership.getRange("A35:N37").format = {
    fill: "#FFF7E6",
    font: { name: fontFamily, size: 10, color: "#7C4A03" },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: "#F3C977" },
  };
  ownership.freezePanes.freezeRows(3);
  ownership.tabColor = colors.teal;
}

// Refresh the existing eight-sheet artifact in place; preserve charts, tables and layout.
const ownership = workbook.worksheets.getItem("Ownership Snapshot");
const monthlySheet = workbook.worksheets.getItem("Monthly Cash");
const categorySheet = workbook.worksheets.getItem("Income & Expense");
const operationsSheet = workbook.worksheets.getItem("Operating Assumptions");
const reconciliationSheet = workbook.worksheets.getItem("Reconciliation");
const readmeSheet = workbook.worksheets.getItem("Read Me");
const reference = JSON.parse(
  await fs.readFile(path.join(dataDir, "public-reference.json"), "utf8"),
);
monthlySheet.getRange("A1").values = [["Monthly Cash Receipts & Payments"]];
monthlySheet.getRange("A6:C17").values = monthly;
monthlySheet.getRange("B6:C17").format.font.color = "#0000FF";
monthlySheet.getRange("D6:E18").format.font.color = "#000000";
monthlySheet.getRange("B6:E18").format.numberFormat = '$#,##0;($#,##0);"–"';
categorySheet.getRange("A6:C19").values = categories;
categorySheet.getRange("C6:C19").format.font.color = "#0000FF";
categorySheet.getRange("D6:D19").formulas = categories.map((_, i) => [
  `=IF(SUMIF($B$6:$B$19,B${i + 6},$C$6:$C$19)=0,"n.a.",C${i + 6}/SUMIF($B$6:$B$19,B${i + 6},$C$6:$C$19))`,
]);
categorySheet.getRange("D6:D19").format.font = { color: "#000000", italic: true };
operationsSheet.getRange("A6:E15").values = assumptions;
operationsSheet.getRange("C6:C15").format.font.color = "#0000FF";
reconciliationSheet.getRange("A3").values = [
  ["Source reference 2026-10-12 · refreshed for candidate 6.0 · synthetic controls"],
];
reconciliationSheet.getRange("A6:C12").values = reconciliation.checks.map((c) => [
  c.name,
  c.expected,
  c.actual,
]);
const sheetControlFormulas = {
  "Monthly inflow to control": "='Monthly Cash'!B18",
  "Category inflow to control": `=SUMIF('Income & Expense'!B6:B19,"Inflow",'Income & Expense'!C6:C19)`,
  "Monthly outflow to control": "='Monthly Cash'!C18",
  "Category outflow to control": `=SUMIF('Income & Expense'!B6:B19,"Outflow",'Income & Expense'!C6:C19)`,
  "Net cash to control": "='Monthly Cash'!D18",
  "Month count": "=COUNTA('Monthly Cash'!A6:A17)",
  "Program count": `=IF(COUNTIF('Operating Assumptions'!A6:A15,"Men's")>0,1,0)+IF(COUNTIF('Operating Assumptions'!A6:A15,"Women's")>0,1,0)`,
};
reconciliationSheet.getRange("C6:C12").formulas = reconciliation.checks.map((c) => [
  sheetControlFormulas[c.name],
]);
reconciliationSheet.getRange("C6:C12").format.font.color = "#008000";
reconciliationSheet.getRange("D6:D12").formulas = reconciliation.checks.map((_, i) => [
  `=C${i + 6}-B${i + 6}`,
]);
reconciliationSheet.getRange("E6:E12").formulas = reconciliation.checks.map((_, i) => [
  `=IF(ABS(D${i + 6})<0.005,"PASS","FAIL")`,
]);
reconciliationSheet.getRange("G6:G12").formulas = reconciliation.checks.map((_, i) => [
  `=IF(E${i + 6}="PASS","Cleared","Blocked")`,
]);
reconciliationSheet.getRange("D6:D12").format.font.color = "#142033";
reconciliationSheet.getRange("D6:D12").conditionalFormats.add("cellIs", {
  operator: "greaterThan",
  formula: "0.004999",
  format: { fill: "#FEE2E2", font: { color: "#B91C1C", bold: true } },
});
reconciliationSheet.getRange("D6:D12").conditionalFormats.add("cellIs", {
  operator: "lessThan",
  formula: "-0.004999",
  format: { fill: "#FEE2E2", font: { color: "#B91C1C", bold: true } },
});
ownership.getRange("I5").values = [["FY25 NET CASH CHANGE"]];
ownership.getRange("M6").formulas = [['=IF(A6=0,"n.a.",I6/A6)']];
for (const r of ["A6:C8", "E6:G8", "I6:K8", "M6:N8"])
  ownership.getRange(r).format.font.color = colors.ink;
ownership.charts.items[0].title = "Monthly cash receipts & payments · FY25";
ownership.charts.items[1].title = "FY25 synthetic income categories";
ownership.getRange("A27").values = [["SUGGESTED REVIEW ACTIONS · NOT APPROVED CLUB DECISIONS"]];
ownership.getRange("E29").values = [["Commercial lead · proposed"]];
ownership.getRange("E30").values = [["Operations lead · proposed"]];
ownership.getRange("E31").values = [["Executive sponsor · proposed"]];
ownership.getRange("E32").values = [["Analytics lead · proposed"]];
ownership.getRange("H29").values = [["Synthetic concentration only"]];
ownership.getRange("H30").values = [["Do not add commitments to ledger"]];
ownership.getRange("H31").values = [["Versioned workflow; club review needed"]];
ownership.getRange("H32").values = [["Sample ≠ complete season"]];
for (let row = 29; row <= 32; row++)
  ownership.getRange(`L${row}`).values = [["PROPOSED · unassigned"]];
ownership.getRange("A35").values = [
  [
    "Source reference 2026-10-12. Synthetic portfolio model, not certified PCFC accounts. Net cash change is not bank balance, profit or runway. FY24 has annual totals only. Private records and public demonstration data remain separate.",
  ],
];
ownership.mergeCells("A39:N39");
ownership.getRange("A39").values = [["ANNUAL COMPARISON · USD · SYNTHETIC"]];
styleHeader(ownership.getRange("A39:N39"));
const annualRows = reference.financialPeriods.map((p) => [p.id, p.inflow, p.outflow]);
ownership.getRange("A40:N42").clear();
for (let r = 40; r <= 42; r++)
  for (const group of [
    ["A", "C"],
    ["E", "G"],
    ["I", "K"],
    ["M", "N"],
  ])
    ownership.mergeCells(`${group[0]}${r}:${group[1]}${r}`);
for (const [col, label] of [
  ["A", "Period"],
  ["E", "Inflow"],
  ["I", "Outflow"],
  ["M", "Net cash change"],
])
  ownership.getRange(`${col}40`).values = [[label]];
for (const [i, row] of annualRows.entries()) {
  const r = i + 41;
  ownership.getRange(`A${r}`).values = [[row[0]]];
  ownership.getRange(`E${r}`).values = [[row[1]]];
  ownership.getRange(`I${r}`).values = [[row[2]]];
  ownership.getRange(`M${r}`).formulas = [[`=E${r}-I${r}`]];
}
ownership.getRange("E41:N42").format.numberFormat = '$#,##0;($#,##0);"–"';
ownership.getRange("A40:N42").format.rowHeight = 24;
ownership.getRange("A40:N42").format.font.color = colors.ink;
readmeSheet.getRange("A3").values = [
  ["Candidate 6.0 · source reference 2026-10-12 · prepared 2026-10-18, not published"],
];
readmeSheet.getRange("B11").values = [
  ["Cash receipts/payments and cumulative net change, not balance"],
];
readmeSheet.getRange("A19").values = [
  [
    reconciliation.privacyBoundary +
      " Formula recalculation and artifact rendering are checked with the bundled workbook engine; this does not establish a native Excel refresh. Power BI source checks are separate from Desktop rendering. Private operating records are not included.",
  ],
];

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (used) {
    used.format.verticalAlignment = "center";
  }
}

workbook.recalculate();

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,drawing",
  maxChars: 9000,
  tableMaxRows: 4,
  tableMaxCols: 8,
});
await fs.writeFile(
  path.join(outputDir, "workbook-inspection.ndjson"),
  summary.ndjson ?? String(summary),
);

const formulaErrors = [];
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (!used) continue;
  const values = JSON.stringify(used.values ?? []);
  if (/#[A-Z0-9/?!]+/.test(values)) formulaErrors.push(sheet.name);
}
if (formulaErrors.length) {
  throw new Error(`Formula errors detected on: ${formulaErrors.join(", ")}`);
}

const preview = await workbook.render({
  sheetName: "Ownership Snapshot",
  range: "A1:N42",
  scale: 1,
  format: "png",
});
await fs.writeFile(
  path.join(outputDir, "ownership-snapshot-preview.png"),
  new Uint8Array(await preview.arrayBuffer()),
);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "PortCityFC_Analytics_Companion.xlsx"));
const controlValues = reconciliationSheet.getRange("D6:E12").values;
if (controlValues.some((row) => Math.abs(Number(row[0])) >= 0.005 || row[1] !== "PASS"))
  throw new Error("Workbook reconciliation failed");
console.log(
  JSON.stringify({
    monthly: monthlySheet.getRange("B18:E18").values,
    annual: ownership.getRange("A41:N42").values,
    checks: controlValues,
  }),
);

console.log(
  JSON.stringify(
    {
      workbook: path.join(outputDir, "PortCityFC_Analytics_Companion.xlsx"),
      preview: path.join(outputDir, "ownership-snapshot-preview.png"),
      sheets: workbook.worksheets.items.map((sheet) => sheet.name),
      reconciliationChecks: reconciliation.checks.length,
    },
    null,
    2,
  ),
);
