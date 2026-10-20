import type { Fixture, ScenarioInput, ScenarioResult } from "./types";
import { calculateSeasonScenario } from "../site/model.js";

const safeDiv = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const matches = input.scope === "Per fixture" ? 1 : input.homeMatches;
  const result = calculateSeasonScenario({ ...input, homeMatches: matches });
  const totalCost = result.seasonCost + result.community + result.riskReserve;
  const visits = result.attendance * matches;
  return {
    paidAttendance: result.paidAttendance * matches,
    ticketRevenue: result.ticket,
    concessionRevenue: result.concession,
    merchandiseRevenue: result.merchandise,
    sponsorshipAllocation: result.sponsorshipAllocation,
    totalRevenue: result.totalRevenue,
    fixedCosts: result.fixedSeasonCost,
    variableCosts: result.attendeeCost + result.community + result.riskReserve,
    totalCost,
    contributionMargin:
      result.totalRevenue - result.attendeeCost - result.community - result.riskReserve,
    operatingMargin: result.contribution,
    operatingMarginPct: result.margin,
    breakEvenAttendance: result.breakEven,
    revenuePerAttendee: visits > 0 ? result.totalRevenue / visits : null,
    costPerAttendee: visits > 0 ? totalCost / visits : null,
    downsideExposure: result.riskReserve,
    capacityUtilizationPct: (result.attendance / input.venueCapacity) * 100,
    charitableContribution: result.community,
    feasible: result.feasible,
    homeMatches: matches,
    grossBeforeAllowance: result.contribution + result.riskReserve,
  };
}

export function aggregateFixtures(fixtures: Fixture[]) {
  const projectedAttendance = fixtures.reduce((sum, fixture) => sum + fixture.projected, 0);
  const paidAttendance = fixtures.reduce((sum, fixture) => sum + fixture.paid, 0);
  const ticketRevenue = fixtures.reduce((sum, fixture) => sum + fixture.ticketRevenue, 0);
  const totalRevenue = fixtures.reduce((sum, fixture) => sum + fixture.totalRevenue, 0);
  const operatingCosts = fixtures.reduce((sum, fixture) => sum + fixture.cost, 0);
  const operatingMargin = totalRevenue - operatingCosts;
  return {
    projectedAttendance,
    paidAttendance,
    ticketRevenue,
    totalRevenue,
    operatingCosts,
    operatingMargin,
    operatingMarginPct: safeDiv(operatingMargin, totalRevenue) * 100,
    returningSupporterPct:
      safeDiv(
        fixtures.reduce((sum, fixture) => sum + fixture.returningPct * fixture.paid, 0),
        paidAttendance,
      ) || 0,
  };
}

export function calculateFunnelConversion(stages: number[]) {
  return stages.map((value, index) => ({
    value,
    conversionPct: index === 0 ? 100 : safeDiv(value, stages[index - 1] ?? 0) * 100,
    dropOffPct: index === 0 ? 0 : (1 - safeDiv(value, stages[index - 1] ?? 0)) * 100,
  }));
}
