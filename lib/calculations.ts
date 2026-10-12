import type { Fixture, ScenarioInput, ScenarioResult } from "./types";

const safeDiv = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const attendance = Math.max(0, Math.min(input.expectedAttendance, input.venueCapacity));
  const paidAttendance = Math.round(attendance * (1 - input.complimentaryPct / 100));
  const ticketRevenue = paidAttendance * input.ticketPrice;
  const concessionRevenue =
    attendance * (input.concessionParticipationPct / 100) * input.averageConcessionSpend;
  const merchandiseRevenue =
    attendance * (input.merchandiseParticipationPct / 100) * input.averageMerchandiseSpend;
  const sponsorshipAllocation = input.sponsorIncome;
  const totalRevenue =
    ticketRevenue + concessionRevenue + merchandiseRevenue + sponsorshipAllocation;
  const fixedCosts =
    input.marketingSpend +
    input.staffing +
    input.security +
    input.officials +
    input.venueCosts +
    input.transportation +
    input.equipment;
  const perAttendeeVariableCost = 2.4;
  const charitableContribution = totalRevenue * (input.communityAllocationPct / 100);
  const variableCosts = attendance * perAttendeeVariableCost + charitableContribution;
  const totalCost = fixedCosts + variableCosts;
  const operatingMargin = totalRevenue - totalCost;
  const contributionMargin = totalRevenue - variableCosts;
  const revenuePerAttendee = safeDiv(totalRevenue, attendance);
  const costPerAttendee = safeDiv(totalCost, attendance);
  const atRiskRevenue = Math.min(
    totalRevenue,
    totalRevenue * ((input.weatherRiskPct + input.operationalRiskPct) / 100),
  );
  const netTicketPerAttendee = input.ticketPrice * (1 - input.complimentaryPct / 100);
  const netAncillaryPerAttendee =
    (input.concessionParticipationPct / 100) * input.averageConcessionSpend +
    (input.merchandiseParticipationPct / 100) * input.averageMerchandiseSpend;
  const netContributionPerAttendee =
    (netTicketPerAttendee + netAncillaryPerAttendee) * (1 - input.communityAllocationPct / 100) -
    perAttendeeVariableCost;
  const residualFixedCosts = Math.max(0, fixedCosts - sponsorshipAllocation);
  const breakEvenAttendance =
    netContributionPerAttendee > 0
      ? Math.ceil(residualFixedCosts / netContributionPerAttendee)
      : null;

  return {
    paidAttendance,
    ticketRevenue,
    concessionRevenue,
    merchandiseRevenue,
    sponsorshipAllocation,
    totalRevenue,
    fixedCosts,
    variableCosts,
    totalCost,
    contributionMargin,
    operatingMargin,
    operatingMarginPct: safeDiv(operatingMargin, totalRevenue) * 100,
    breakEvenAttendance,
    revenuePerAttendee,
    costPerAttendee,
    downsideExposure: atRiskRevenue,
    capacityUtilizationPct: safeDiv(attendance, input.venueCapacity) * 100,
    charitableContribution,
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
