import { describe, expect, it } from "vitest";
import { protectSpreadsheetCell, toCsv, validateRows } from "../../lib/csv";

describe("CSV controls", () => {
  it("neutralizes spreadsheet formulas in exports", () => {
    expect(protectSpreadsheetCell('=HYPERLINK("bad")')).toBe('\'=HYPERLINK("bad")');
    expect(toCsv([{ name: "+SUM(A1:A2)" }])).toContain("'+SUM");
  });
  it("preserves signed numeric results and optional columns without evaluating text", () => {
    const csv = toCsv([{ amount: -4.5 }, { amount: 0, reference: "=FORMULA()" }]);
    expect(csv).toContain('"-4.5"');
    expect(csv).toContain('"reference"');
    expect(csv).toContain("'=FORMULA()");
    expect(protectSpreadsheetCell("-cmd")).toBe("'-cmd");
  });

  it("returns row-level errors and detects in-batch duplicates", () => {
    const rows = validateRows("fixtures", [
      {
        externalId: "F-1",
        date: "2026-07-18T19:00:00Z",
        program: "Women",
        opponent: "Wake FC",
        venue: "Legion Stadium",
        capacity: "6000",
      },
      {
        externalId: "F-1",
        date: "not-a-date",
        program: "Women",
        opponent: "X",
        venue: "L",
        capacity: "0",
      },
    ]);
    expect(rows[0]!.valid).toBe(true);
    expect(rows[1]!.valid).toBe(false);
    expect(rows[1]!.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Duplicate"),
        expect.stringContaining("date"),
      ]),
    );
  });
});
