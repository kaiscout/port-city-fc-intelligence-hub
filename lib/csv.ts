import { z } from "zod";

const dangerousFormula = /^[=+\-@\t\r]/;

export function protectSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return dangerousFormula.test(text) ? `'${text}` : text;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: unknown) => `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\r\n");
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
