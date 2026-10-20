import { describe, expect, it } from "vitest";
import { scenarioPresets } from "../../lib/data/demo";
import {
  scenarioCurve,
  scenarioExplanation,
  freeEntryExplanation,
} from "../../site/scenario-visuals.js";
import { calculateSeasonScenario } from "../../site/model.js";

describe("Scenario Lab visual evidence", () => {
  const baseline = scenarioPresets[1]!;
  it("plots the exact current result and retains an independent starting case", () => {
    const changed = { ...baseline, ticketPrice: 21 };
    const curve = scenarioCurve(changed, baseline);
    const current = curve.points.find((p) => p.attendance === baseline.expectedAttendance)!;
    expect(current.current).toBeCloseTo(calculateSeasonScenario(changed).contribution, 7);
    expect(current.reference).toBeCloseTo(calculateSeasonScenario(baseline).contribution, 7);
    expect(current.current).not.toBe(current.reference);
    expect(curve.minimum).toBeLessThan(0);
    expect(curve.maximum).toBeGreaterThan(0);
  });
  it("keeps a finite domain when every point is zero", () => {
    const empty = {
      ...baseline,
      ticketPrice: 0,
      averageConcessionSpend: 0,
      averageMerchandiseSpend: 0,
      sponsorIncome: 0,
      marketingSpend: 0,
      staffing: 0,
      security: 0,
      officials: 0,
      venueCosts: 0,
      transportation: 0,
      equipment: 0,
      variableCostPerAttendee: 0,
    };
    const curve = scenarioCurve(empty);
    expect(curve.points.every((p) => p.current === 0)).toBe(true);
    expect(curve.maximum).toBeGreaterThan(curve.minimum);
    expect(scenarioExplanation(empty)).toContain("does not improve");
  });
  it("warns when more attendance causes losses despite a funded zero-attendance threshold", () => {
    const falling = { ...baseline, sponsorIncome: 100000, variableCostPerAttendee: 200 };
    const curve = scenarioCurve(falling);
    expect(curve.result.breakEven).toBe(0);
    expect(curve.points[0]!.current).toBeGreaterThan(0);
    expect(curve.points.at(-1)!.current).toBeLessThan(0);
    expect(scenarioExplanation(falling)).toContain("does not improve");
    expect(scenarioExplanation(falling)).not.toContain("above break-even");
  });
  it("explains free entry from capped attendance rather than uncapped demand", () => {
    const capped = {
      ...baseline,
      venueCapacity: 80,
      expectedAttendance: 100,
      complimentaryPct: 25,
    };
    expect(freeEntryExplanation(capped)).toContain("20 guests enter free; 60 pay");
    const curve = scenarioCurve(capped);
    expect(curve.points.at(-1)!.attendance).toBe(80);
    expect(curve.result.attendance).toBe(80);
  });
});
