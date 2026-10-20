import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "powerbi", "PortCityFCCompanion");
const reportRoot = path.join(root, "PortCityFCCompanion.Report");
const modelRoot = path.join(root, "PortCityFCCompanion.SemanticModel", "definition");

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const files = await walk(root);
const relativeFiles = new Set(files.map((file) => path.relative(root, file).replaceAll("\\", "/")));
for (const required of [
  "PortCityFCCompanion.pbip",
  "PortCityFCCompanion.Report/definition.pbir",
  "PortCityFCCompanion.Report/definition/report.json",
  "PortCityFCCompanion.SemanticModel/definition.pbism",
  "PortCityFCCompanion.SemanticModel/definition/model.tmdl",
  "PortCityFCCompanion.SemanticModel/definition/relationships.tmdl",
]) {
  assert(relativeFiles.has(required), `Missing required Power BI project file: ${required}`);
}

for (const file of files.filter((item) =>
  [".json", ".pbip", ".pbir", ".pbism"].includes(path.extname(item)),
)) {
  const parsed = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  assert(typeof parsed === "object" && parsed !== null, `Invalid JSON object: ${file}`);
  if (path.extname(file) === ".json") {
    assert(typeof parsed.$schema === "string", `Missing schema declaration: ${file}`);
    assert(
      parsed.$schema.startsWith("https://developer.microsoft.com/json-schemas/fabric/"),
      `Unexpected Power BI JSON schema: ${file}`,
    );
  }
}

const model = await readFile(path.join(modelRoot, "model.tmdl"), "utf8");
for (const table of [
  "DimDate",
  "DimProgram",
  "DimMetric",
  "DimCategory",
  "FactFinance",
  "FactFinanceCategory",
  "FactOperations",
]) {
  assert(model.includes(`ref table ${table}`), `Model does not reference ${table}`);
  assert(
    relativeFiles.has(`PortCityFCCompanion.SemanticModel/definition/tables/${table}.tmdl`),
    `Missing TMDL table file for ${table}`,
  );
}
assert(model.includes("expression DataRoot"), "Missing DataRoot Power Query parameter");

const relationships = await readFile(path.join(modelRoot, "relationships.tmdl"), "utf8");
assert(
  (relationships.match(/^relationship /gm) ?? []).length === 9,
  "Expected nine star-schema relationships",
);
assert(
  !relationships.includes("crossFilteringBehavior: bothDirections"),
  "Bidirectional relationship is not permitted",
);

const finance = await readFile(path.join(modelRoot, "tables", "FactFinance.tmdl"), "utf8");
for (const measure of ["Cash Inflow", "Cash Outflow", "Net Cash", "Cash Margin %"]) {
  assert(finance.includes(`measure '${measure}'`), `Missing DAX measure: ${measure}`);
}
const operations = await readFile(path.join(modelRoot, "tables", "FactOperations.tmdl"), "utf8");
const annualCategories = await readFile(
  path.join(modelRoot, "tables", "FactFinanceCategory.tmdl"),
  "utf8",
);
assert(
  annualCategories.includes("measure 'Annual Category Amount'") &&
    annualCategories.includes("ALLEXCEPT(DimDate, DimDate[Year])"),
  "Annual categories must not masquerade as monthly data",
);
for (const measure of ["Average Attendance", "Ticket Price"]) {
  assert(operations.includes(`measure '${measure}'`), `Missing DAX measure: ${measure}`);
}

for (const [role, program] of [
  ["MenProgramViewer", "MEN"],
  ["WomenProgramViewer", "WOMEN"],
] as const) {
  const roleText = await readFile(path.join(modelRoot, "roles", `${role}.tmdl`), "utf8");
  assert(roleText.includes("modelPermission: read"), `${role} is not read-only`);
  assert(roleText.includes(`{"CLUB","${program}"}`), `${role} is missing its program filter`);
}

const pages = JSON.parse(
  await readFile(path.join(reportRoot, "definition", "pages", "pages.json"), "utf8"),
) as { pageOrder?: string[] };
assert(pages.pageOrder?.length === 1, "Companion report must expose one ownership page");
const pageId = pages.pageOrder[0];
assert(pageId, "Ownership page id is missing");
const visualRoot = path.join(reportRoot, "definition", "pages", pageId, "visuals");
const visuals = (await readdir(visualRoot)).filter((name) => !name.startsWith("."));
assert(visuals.length === 6, "Ownership Snapshot must contain four KPI cards and two charts");

console.log(
  JSON.stringify({
    project: "PortCityFCCompanion",
    jsonDocuments: files.filter((file) =>
      [".json", ".pbip", ".pbir", ".pbism"].includes(path.extname(file)),
    ).length,
    tables: 7,
    relationships: 9,
    roles: 2,
    visuals: 6,
    status: "PASS",
  }),
);
