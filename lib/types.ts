export type Program = "Men" | "Women";
export type SourceClass =
  | "Official public information"
  | "User-provided source document"
  | "Synthetic demonstration data"
  | "User-entered operational data"
  | "Calculated metric"
  | "Forecast or scenario"
  | "Documented assumption";

export type Role =
  "ADMINISTRATOR" | "EXECUTIVE" | "ANALYST" | "COMMERCIAL" | "MARKETING" | "MATCHDAY_OPERATIONS";

export interface ScenarioInput {
  id: string;
  name: string;
  program: Program;
  ticketPrice: number;
  expectedAttendance: number;
  venueCapacity: number;
  complimentaryPct: number;
  marketingSpend: number;
  staffing: number;
  security: number;
  officials: number;
  venueCosts: number;
  transportation: number;
  equipment: number;
  concessionParticipationPct: number;
  averageConcessionSpend: number;
  merchandiseParticipationPct: number;
  averageMerchandiseSpend: number;
  sponsorIncome: number;
  communityAllocationPct: number;
  weatherRiskPct: number;
  operationalRiskPct: number;
}

export interface ScenarioResult {
  paidAttendance: number;
  ticketRevenue: number;
  concessionRevenue: number;
  merchandiseRevenue: number;
  sponsorshipAllocation: number;
  totalRevenue: number;
  fixedCosts: number;
  variableCosts: number;
  totalCost: number;
  contributionMargin: number;
  operatingMargin: number;
  operatingMarginPct: number;
  breakEvenAttendance: number | null;
  revenuePerAttendee: number;
  costPerAttendee: number;
  downsideExposure: number;
  capacityUtilizationPct: number;
  charitableContribution: number;
}

export interface Fixture {
  id: string;
  date: string;
  program: Program;
  opponent: string;
  competition: string;
  venue: string;
  capacity: number;
  projected: number;
  paid: number;
  ticketRevenue: number;
  totalRevenue: number;
  cost: number;
  returningPct: number;
}

export interface Sponsor {
  id: string;
  name: string;
  contact: string;
  email: string;
  tier: "Founding" | "Principal" | "Community" | "Matchday";
  contractValue: number;
  period: string;
  program: "Club-wide" | Program;
  delivered: number;
  total: number;
  overdue: number;
  estimatedReach: number;
  engagementPct: number;
  renewalIntent: "Positive" | "Neutral" | "Unknown";
  notes: string;
  nextAction: string;
}

export interface CommunityRecord {
  initiative: string;
  program: Program | "Club-wide";
  participants: number;
  eventAttendance: number;
  partners: number;
  volunteerHours: number;
  contribution: number;
  reach: number;
  month: string;
}
