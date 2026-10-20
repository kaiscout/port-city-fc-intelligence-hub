import { z } from "zod";

const dangerousFormula = /^(?:\s*[=+\-@]|[\t\r\n])/;

export function protectSpreadsheetCell(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const text = String(value ?? "");
  return dangerousFormula.test(text) ? `'${text}` : text;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown) => `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\r\n");
}

// RFC-style quoted fields, embedded newlines and escaped quotes. No evaluation or guessing.
export function parseCsv(input: string): Record<string, string>[] {
  const source = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closed = false;
  const pushCell = () => {
    row.push(cell);
    cell = "";
    closed = false;
  };
  const pushRow = () => {
    pushCell();
    if (row.some((v) => v !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
      continue;
    }
    if (closed && ![",", "\r", "\n"].includes(char))
      throw new Error(`Unexpected character after closing quote at character ${i + 1}`);
    if (char === '"') {
      if (cell) throw new Error(`Unexpected quote at character ${i + 1}`);
      quoted = true;
    } else if (char === ",") pushCell();
    else if (char === "\r" || char === "\n") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      pushRow();
    } else cell += char;
  }
  if (quoted) throw new Error("Unclosed quoted CSV field");
  if (cell || row.length || closed) pushRow();
  const headers = rows.shift()?.map((v) => v.trim());
  if (!headers?.length || headers.some((v) => !v) || new Set(headers).size !== headers.length)
    throw new Error("CSV requires unique, nonempty column headers");
  if (rows.length > 10_000) throw new Error("CSV is limited to 10,000 records");
  return rows.map((values, index) => {
    if (values.length !== headers.length)
      throw new Error(
        `Row ${index + 2}: expected ${headers.length} columns, received ${values.length}`,
      );
    return Object.fromEntries(headers.map((key, i) => [key, values[i]!]));
  });
}

export const importSchemas = {
  fixtures: z.object({
    externalId: z.string().trim().min(1).max(80),
    date: z.iso.datetime(),
    program: z.enum(["Men", "Women"]),
    opponent: z.string().trim().min(2).max(120),
    venue: z.string().trim().min(2).max(120),
    capacity: z.coerce.number().int().positive().max(100_000),
  }),
  attendance: z.object({
    fixtureExternalId: z.string().trim().min(1).max(80),
    paid: z.coerce.number().int().nonnegative(),
    complimentary: z.coerce.number().int().nonnegative(),
    returning: z.coerce.number().int().nonnegative(),
  }),
  revenue: z.object({
    fixtureExternalId: z.string().trim().min(1).max(80),
    category: z.string().trim().min(2).max(80),
    amount: z.coerce.number().nonnegative().max(10_000_000),
  }),
};

export type ImportKind = keyof typeof importSchemas;

export function validateRows(kind: ImportKind, rows: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const result = importSchemas[kind].safeParse(row);
    const identity = String(row.externalId ?? row.fixtureExternalId ?? "").toLowerCase();
    const duplicate = Boolean(identity && seen.has(identity));
    if (identity) seen.add(identity);
    return {
      row: index + 2,
      valid: result.success && !duplicate,
      data: result.success ? result.data : row,
      errors: [
        ...(result.success
          ? []
          : result.error.issues.map(
              (issue) => `${issue.path.join(".") || "row"}: ${issue.message}`,
            )),
        ...(duplicate ? ["Duplicate record within this import batch"] : []),
      ],
    };
  });
}
