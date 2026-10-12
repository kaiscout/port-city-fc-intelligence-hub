import { describe, expect, it } from "vitest";
import {
  aggregateFixtures,
  calculateFunnelConversion,
  calculateScenario,
} from "../../lib/calculations";
import { demoFixtures, scenarioPresets } from "../../lib/data/demo";

describe("matchday economics", () => {
  it("calculates the baseline representative example transparently", () => {
    const result = calculateScenario(scenarioPresets[1]!);
    expect(result.paidAttendance).toBe(1512);
    expect(result.ticketRevenue).toBe(28_728);
    expect(result.concessionRevenue).toBeCloseTo(7_043.4, 1);
    expect(result.merchandiseRevenue).toBeCloseTo(6_249.6, 1);
    expect(result.fixedCosts).toBe(26_550);
    expect(result.variableCosts).toBeCloseTo(6_212.84, 1);
    expect(result.totalRevenue).toBeCloseTo(54_521, 1);
    expect(result.operatingMargin).toBeCloseTo(21_758.16, 1);
    expect(result.breakEvenAttendance).toBe(651);
  });

  it("caps attendance at venue capacity and handles impossible break-even", () => {
    const result = calculateScenario({
      ...scenarioPresets[0]!,
      expectedAttendance: 9_000,
      venueCapacity: 1_000,
      ticketPrice: 0,
      averageConcessionSpend: 0,
      averageMerchandiseSpend: 0,
      sponsorIncome: 0,
    });
    expect(result.paidAttendance).toBe(870);
    expect(result.capacityUtilizationPct).toBe(100);
    expect(result.breakEvenAttendance).toBeNull();
  });

  it("aggregates filtered fixtures without mixing comparison denominators", () => {
    const women = aggregateFixtures(demoFixtures.filter((fixture) => fixture.program === "Women"));
    expect(women.paidAttendance).toBe(6187);
    expect(women.totalRevenue).toBe(186570);
    expect(women.returningSupporterPct).toBeGreaterThan(49);
  });

  it("calculates stage conversion and drop-off", () => {
    const result = calculateFunnelConversion([1000, 400, 300]);
    expect(result[1]).toMatchObject({ conversionPct: 40, dropOffPct: 60 });
    expect(result[2]).toMatchObject({ conversionPct: 75, dropOffPct: 25 });
  });
});
