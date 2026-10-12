import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectName = "PortCityFCCompanion";
const output = path.join(root, "powerbi", projectName);
const pageId = "7fbebda91d314240a001";

async function write(relative: string, content: string) {
  const target = path.join(output, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

async function writeJson(relative: string, value: unknown) {
  await write(relative, JSON.stringify(value, null, 2));
}

function measureProjection(table: string, property: string) {
  return {
    field: {
      Measure: {
        Expression: { SourceRef: { Entity: table } },
        Property: property,
      },
    },
    queryRef: `${table}.${property}`,
    nativeQueryRef: property,
  };
}

function columnProjection(table: string, property: string) {
  return {
    field: {
      Column: {
        Expression: { SourceRef: { Entity: table } },
        Property: property,
      },
    },
    queryRef: `${table}.${property}`,
    nativeQueryRef: property,
  };
}

async function visual(
  id: string,
  visualType: string,
  position: { x: number; y: number; z: number; height: number; width: number },
  queryState: Record<string, unknown>,
) {
  await writeJson(
    path.join(`${projectName}.Report`, "definition", "pages", pageId, "visuals", id, "visual.json"),
    {
      $schema:
        "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.7.0/schema.json",
      name: id,
      position: { ...position, tabOrder: position.z },
      visual: {
        visualType,
        query: { queryState },
        drillFilterOtherVisuals: true,
      },
    },
  );
}

function csvTable(
  table: string,
  filename: string,
  columns: { name: string; source: string; type: string; extra?: string }[],
) {
  const mType = (type: string) => (type === "Int64.Type" ? "Int64.Type" : `type ${type}`);
  const types = columns.map(({ source, type }) => `{"${source}", ${mType(type)}}`).join(", ");
  const columnDefinitions = columns
    .map(
      ({ name, source, type, extra }) =>
        `\tcolumn '${name}'\n\t\tdataType: ${type === "number" ? "double" : type === "date" ? "dateTime" : type === "Int64.Type" ? "int64" : "string"}\n\t\tsourceColumn: ${source}\n${extra ? `\t\t${extra}\n` : ""}`,
    )
    .join("\n");
  return `table '${table}'\n${columnDefinitions}\n\tpartition '${table}' = m\n\t\tmode: import\n\t\tsource =\n\t\t\tlet\n\t\t\t\tSource = Csv.Document(File.Contents(DataRoot & "${filename}"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),\n\t\t\t\tHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),\n\t\t\t\tTyped = Table.TransformColumnTypes(Headers, {${types}}, "en-US")\n\t\t\tin\n\t\t\t\tTyped\n`;
}

async function main() {
  await writeJson(`${projectName}.pbip`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
    version: "1.0",
    artifacts: [{ report: { path: `${projectName}.Report` } }],
    settings: { enableAutoRecovery: true },
  });
  await writeJson(`${projectName}.Report/definition.pbir`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
    version: "4.0",
    datasetReference: { byPath: { path: `../${projectName}.SemanticModel` } },
  });
  await writeJson(`${projectName}.Report/definition/version.json`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
    version: "2.0.0",
  });
  await writeJson(`${projectName}.Report/definition/report.json`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.2.0/schema.json",
    settings: {
      useStylableVisualContainerHeader: true,
      exportDataMode: "AllowSummarized",
      defaultDrillFilterOtherVisuals: true,
      useEnhancedTooltips: true,
    },
    annotations: [
      {
        name: "PortfolioBoundary",
        value: "Synthetic sanitized data only; no private PCFC evidence is included.",
      },
    ],
  });
  await write(
    `${projectName}.Report/definition/pages/pages.json`,
    `{\n  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json",\n  "pageOrder": ["${pageId}"],\n  "activePageName": "${pageId}"\n}`,
  );
  await writeJson(`${projectName}.Report/definition/pages/${pageId}/page.json`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
    name: pageId,
    displayName: "Ownership Snapshot",
    displayOption: "FitToPage",
    height: 720,
    width: 1280,
    annotations: [
      {
        name: "EvidenceBoundary",
        value: "Synthetic public portfolio model; assumptions are not approved club forecasts.",
      },
    ],
  });

  const cards = [
    ["11111111111111111111", "Cash Inflow", 20],
    ["22222222222222222222", "Cash Outflow", 320],
    ["33333333333333333333", "Net Cash", 620],
    ["44444444444444444444", "Cash Margin %", 920],
  ] as const;
  for (const [id, measure, x] of cards) {
    await visual(
      id,
      "cardVisual",
      { x, y: 20, z: x, height: 120, width: 280 },
      { Data: { projections: [measureProjection("FactFinance", measure)] } },
    );
  }
  await visual(
    "55555555555555555555",
    "clusteredColumnChart",
    { x: 20, y: 170, z: 5000, height: 500, width: 610 },
    {
      Category: { projections: [columnProjection("DimDate", "Month")] },
      Y: {
        projections: [
          measureProjection("FactFinance", "Cash Inflow"),
          measureProjection("FactFinance", "Cash Outflow"),
        ],
      },
    },
  );
  await visual(
    "66666666666666666666",
    "clusteredBarChart",
    { x: 650, y: 170, z: 6000, height: 500, width: 610 },
    {
      Category: { projections: [columnProjection("DimCategory", "Category")] },
      Y: { projections: [measureProjection("FactFinanceCategory", "Category Amount")] },
    },
  );

  await writeJson(`${projectName}.SemanticModel/definition.pbism`, {
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json",
    version: "4.2",
    settings: { qnaEnabled: true },
  });
  await write(
    `${projectName}.SemanticModel/definition/database.tmdl`,
    `database PortCityFCCompanion\n\tcompatibilityLevel: 1702\n\tcompatibilityMode: powerBI\n\tlanguage: 1033\n`,
  );
  await write(
    `${projectName}.SemanticModel/definition/model.tmdl`,
    `model Model\n\tculture: en-US\n\tdefaultPowerBIDataSourceVersion: powerBI_V3\n\tsourceQueryCulture: en-US\n\n\texpression DataRoot = "REPLACE_WITH_REPOSITORY_PATH/data/processed/" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]\n\nref table DimDate\nref table DimProgram\nref table DimMetric\nref table DimCategory\nref table FactFinance\nref table FactFinanceCategory\nref table FactOperations\n\nref role MenProgramViewer\nref role WomenProgramViewer\n`,
  );
  await write(
    `${projectName}.SemanticModel/definition/relationships.tmdl`,
    `relationship Finance_Date\n\tfromColumn: FactFinance.DateKey\n\ttoColumn: DimDate.DateKey\n\nrelationship Finance_Program\n\tfromColumn: FactFinance.ProgramKey\n\ttoColumn: DimProgram.ProgramKey\n\nrelationship Finance_Metric\n\tfromColumn: FactFinance.MetricKey\n\ttoColumn: DimMetric.MetricKey\n\nrelationship Category_Date\n\tfromColumn: FactFinanceCategory.DateKey\n\ttoColumn: DimDate.DateKey\n\nrelationship Category_Program\n\tfromColumn: FactFinanceCategory.ProgramKey\n\ttoColumn: DimProgram.ProgramKey\n\nrelationship Category_Category\n\tfromColumn: FactFinanceCategory.CategoryKey\n\ttoColumn: DimCategory.CategoryKey\n\nrelationship Operations_Date\n\tfromColumn: FactOperations.DateKey\n\ttoColumn: DimDate.DateKey\n\nrelationship Operations_Program\n\tfromColumn: FactOperations.ProgramKey\n\ttoColumn: DimProgram.ProgramKey\n\nrelationship Operations_Metric\n\tfromColumn: FactOperations.MetricKey\n\ttoColumn: DimMetric.MetricKey\n`,
  );

  const tableDir = `${projectName}.SemanticModel/definition/tables`;
  await write(
    `${tableDir}/DimDate.tmdl`,
    csvTable("DimDate", "dim_date.csv", [
      {
        name: "DateKey",
        source: "DateKey",
        type: "Int64.Type",
        extra: "isKey\n\t\tisHidden\n\t\tsummarizeBy: none",
      },
      {
        name: "Date",
        source: "Date",
        type: "date",
        extra: "formatString: mmm-yy\n\t\tsummarizeBy: none",
      },
      {
        name: "Month",
        source: "Month",
        type: "text",
        extra: "sortByColumn: MonthNumber\n\t\tsummarizeBy: none",
      },
      {
        name: "MonthNumber",
        source: "MonthNumber",
        type: "Int64.Type",
        extra: "isHidden\n\t\tsummarizeBy: none",
      },
      { name: "Quarter", source: "Quarter", type: "text", extra: "summarizeBy: none" },
      { name: "Year", source: "Year", type: "Int64.Type", extra: "summarizeBy: none" },
    ]),
  );
  await write(
    `${tableDir}/DimProgram.tmdl`,
    csvTable("DimProgram", "dim_program.csv", [
      {
        name: "ProgramKey",
        source: "ProgramKey",
        type: "text",
        extra: "isKey\n\t\tsummarizeBy: none",
      },
      { name: "Program", source: "Program", type: "text", extra: "summarizeBy: none" },
    ]),
  );
  await write(
    `${tableDir}/DimMetric.tmdl`,
    csvTable("DimMetric", "dim_metric.csv", [
      {
        name: "MetricKey",
        source: "MetricKey",
        type: "text",
        extra: "isKey\n\t\tsummarizeBy: none",
      },
      { name: "Metric", source: "Metric", type: "text", extra: "summarizeBy: none" },
      { name: "MetricGroup", source: "MetricGroup", type: "text", extra: "summarizeBy: none" },
      { name: "Unit", source: "Unit", type: "text", extra: "summarizeBy: none" },
    ]),
  );
  await write(
    `${tableDir}/DimCategory.tmdl`,
    csvTable("DimCategory", "dim_category.csv", [
      {
        name: "CategoryKey",
        source: "CategoryKey",
        type: "text",
        extra: "isKey\n\t\tsummarizeBy: none",
      },
      { name: "Category", source: "Category", type: "text", extra: "summarizeBy: none" },
      { name: "Direction", source: "Direction", type: "text", extra: "summarizeBy: none" },
    ]),
  );
  await write(
    `${tableDir}/FactFinance.tmdl`,
    `table FactFinance\n\n\t/// Synthetic cash inflow controlled by MetricKey.\n\tmeasure 'Cash Inflow' = CALCULATE(SUM(FactFinance[Amount]), DimMetric[MetricKey] = "FIN_IN")\n\t\tformatString: $#,##0;($#,##0);-\n\n\t/// Synthetic cash outflow controlled by MetricKey.\n\tmeasure 'Cash Outflow' = CALCULATE(SUM(FactFinance[Amount]), DimMetric[MetricKey] = "FIN_OUT")\n\t\tformatString: $#,##0;($#,##0);-\n\n\tmeasure 'Net Cash' = [Cash Inflow] - [Cash Outflow]\n\t\tformatString: $#,##0;($#,##0);-\n\n\tmeasure 'Cash Margin %' = DIVIDE([Net Cash], [Cash Inflow])\n\t\tformatString: 0.0%\n\n\tcolumn DateKey\n\t\tdataType: int64\n\t\tisHidden\n\t\tsourceColumn: DateKey\n\t\tsummarizeBy: none\n\n\tcolumn ProgramKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: ProgramKey\n\t\tsummarizeBy: none\n\n\tcolumn MetricKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: MetricKey\n\t\tsummarizeBy: none\n\n\tcolumn Amount\n\t\tdataType: double\n\t\tsourceColumn: Amount\n\t\tformatString: $#,##0.00;($#,##0.00);-\n\n\tcolumn SourceClass\n\t\tdataType: string\n\t\tsourceColumn: SourceClass\n\t\tsummarizeBy: none\n\n\tpartition FactFinance = m\n\t\tmode: import\n\t\tsource =\n\t\t\tlet\n\t\t\t\tSource = Csv.Document(File.Contents(DataRoot & "fact_finance.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),\n\t\t\t\tHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),\n\t\t\t\tTyped = Table.TransformColumnTypes(Headers, {{"DateKey", Int64.Type}, {"ProgramKey", type text}, {"MetricKey", type text}, {"Amount", type number}, {"SourceClass", type text}}, "en-US")\n\t\t\tin\n\t\t\t\tTyped\n`,
  );
  await write(
    `${tableDir}/FactFinanceCategory.tmdl`,
    `table FactFinanceCategory\n\n\tmeasure 'Category Amount' = SUM(FactFinanceCategory[Amount])\n\t\tformatString: $#,##0;($#,##0);-\n\n\tcolumn DateKey\n\t\tdataType: int64\n\t\tisHidden\n\t\tsourceColumn: DateKey\n\t\tsummarizeBy: none\n\n\tcolumn ProgramKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: ProgramKey\n\t\tsummarizeBy: none\n\n\tcolumn CategoryKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: CategoryKey\n\t\tsummarizeBy: none\n\n\tcolumn Amount\n\t\tdataType: double\n\t\tsourceColumn: Amount\n\t\tformatString: $#,##0.00;($#,##0.00);-\n\n\tcolumn SourceClass\n\t\tdataType: string\n\t\tsourceColumn: SourceClass\n\t\tsummarizeBy: none\n\n\tpartition FactFinanceCategory = m\n\t\tmode: import\n\t\tsource =\n\t\t\tlet\n\t\t\t\tSource = Csv.Document(File.Contents(DataRoot & "fact_finance_category.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),\n\t\t\t\tHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),\n\t\t\t\tTyped = Table.TransformColumnTypes(Headers, {{"DateKey", Int64.Type}, {"ProgramKey", type text}, {"CategoryKey", type text}, {"Amount", type number}, {"SourceClass", type text}}, "en-US")\n\t\t\tin\n\t\t\t\tTyped\n`,
  );
  await write(
    `${tableDir}/FactOperations.tmdl`,
    `table FactOperations\n\n\tmeasure 'Average Attendance' = CALCULATE(MAX(FactOperations[Value]), DimMetric[MetricKey] = "AVG_ATT")\n\t\tformatString: #,##0\n\n\tmeasure 'Ticket Price' = CALCULATE(MAX(FactOperations[Value]), DimMetric[MetricKey] = "TICKET_PRICE")\n\t\tformatString: $0.00\n\n\tcolumn DateKey\n\t\tdataType: int64\n\t\tisHidden\n\t\tsourceColumn: DateKey\n\t\tsummarizeBy: none\n\n\tcolumn ProgramKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: ProgramKey\n\t\tsummarizeBy: none\n\n\tcolumn MetricKey\n\t\tdataType: string\n\t\tisHidden\n\t\tsourceColumn: MetricKey\n\t\tsummarizeBy: none\n\n\tcolumn Value\n\t\tdataType: double\n\t\tsourceColumn: Value\n\n\tcolumn SourceClass\n\t\tdataType: string\n\t\tsourceColumn: SourceClass\n\t\tsummarizeBy: none\n\n\tpartition FactOperations = m\n\t\tmode: import\n\t\tsource =\n\t\t\tlet\n\t\t\t\tSource = Csv.Document(File.Contents(DataRoot & "fact_operations.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),\n\t\t\t\tHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),\n\t\t\t\tTyped = Table.TransformColumnTypes(Headers, {{"DateKey", Int64.Type}, {"ProgramKey", type text}, {"MetricKey", type text}, {"Value", type number}, {"SourceClass", type text}}, "en-US")\n\t\t\tin\n\t\t\t\tTyped\n`,
  );

  const roleDir = `${projectName}.SemanticModel/definition/roles`;
  await write(
    `${roleDir}/MenProgramViewer.tmdl`,
    `/// Restricts program-grain facts to club-wide and men's rows.\nrole MenProgramViewer\n\tmodelPermission: read\n\n\ttablePermission DimProgram = DimProgram[ProgramKey] IN {"CLUB","MEN"}\n`,
  );
  await write(
    `${roleDir}/WomenProgramViewer.tmdl`,
    `/// Restricts program-grain facts to club-wide and women's rows.\nrole WomenProgramViewer\n\tmodelPermission: read\n\n\ttablePermission DimProgram = DimProgram[ProgramKey] IN {"CLUB","WOMEN"}\n`,
  );

  const powerQuery = `// Power Query reference implementation for the public star schema.
// In Power BI Desktop, set DataRoot to this repository's data/processed folder.
let
    LoadCsv = (FileName as text, ColumnTypes as list) as table =>
        let
            Source = Csv.Document(File.Contents(DataRoot & FileName), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
            Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
            Typed = Table.TransformColumnTypes(Headers, ColumnTypes, "en-US")
        in
            Typed
in
    LoadCsv
`;
  await write("../power-query/LoadCsv.pq", powerQuery);
  await write(
    "../dax/measures.dax",
    `-- Core measures also embedded in the TMDL semantic model.
Cash Inflow := CALCULATE(SUM(FactFinance[Amount]), DimMetric[MetricKey] = "FIN_IN")
Cash Outflow := CALCULATE(SUM(FactFinance[Amount]), DimMetric[MetricKey] = "FIN_OUT")
Net Cash := [Cash Inflow] - [Cash Outflow]
Cash Margin % := DIVIDE([Net Cash], [Cash Inflow])
Category Amount := SUM(FactFinanceCategory[Amount])
Average Attendance := CALCULATE(MAX(FactOperations[Value]), DimMetric[MetricKey] = "AVG_ATT")
Ticket Price := CALCULATE(MAX(FactOperations[Value]), DimMetric[MetricKey] = "TICKET_PRICE")
`,
  );
  await write(
    "../README.md",
    `# Power BI companion

Open \`${projectName}/${projectName}.pbip\` in Power BI Desktop. Set the \`DataRoot\`
Power Query parameter to the absolute path of \`data/processed\` (including the trailing
path separator), then refresh.

The project contains a source-controlled PBIR report, TMDL semantic model, Power Query
parameterized CSV imports, DAX measures, one-to-many star-schema relationships and two
program RLS roles. All loaded data is synthetic. Power BI Desktop is required for the
final native render; this repository's CI validates the generated file structure and JSON.
`,
  );

  const jsonFiles = [
    `${projectName}.pbip`,
    `${projectName}.Report/definition.pbir`,
    `${projectName}.Report/definition/version.json`,
    `${projectName}.Report/definition/report.json`,
    `${projectName}.Report/definition/pages/pages.json`,
    `${projectName}.Report/definition/pages/${pageId}/page.json`,
  ];
  for (const file of jsonFiles) JSON.parse(await readFile(path.join(output, file), "utf8"));
  console.log(JSON.stringify({ event: "powerbi_companion.built", project: output, visuals: 6 }));
}

void main();
