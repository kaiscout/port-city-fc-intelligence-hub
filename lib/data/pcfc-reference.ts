/**
 * Public portfolio dataset.
 *
 * Every value in this module is synthetic or deliberately generalized. The
 * private evidence pack, contacts, payees, source filenames, hashes and
 * transaction rows are never copied into this repository.
 */

export type FinancialPeriod = {
  id: "FY24" | "FY25";
  label: string;
  startDate: string;
  endDate: string;
  transactions: number;
  inflow: number;
  outflow: number;
  netCash: number;
  sourceFile: string;
  sha256: string;
};

export type CashCategory = { name: string; amount: number };
export type StaffRole = { role: string; coverage: "Covered" | "Open"; publicTreatment: string };
export type MatchdayNeed = { scope: "Home" | "Away"; item: string; quantity: number | null };
export type FieldCostCategory = CashCategory & { evidence: string };
export type ManagementCost = {
  item: string;
  minimum: number;
  maximum: number;
  basis: string;
  treatment: string;
};
export type ManagementSeasonCommitment = {
  item: string;
  amount: number;
  basis: string;
  confidence: "Confirmed in messages" | "Approximate — confirm";
};

export const financialPeriods: FinancialPeriod[] = [
  {
    id: "FY24",
    label: "Synthetic prior-year benchmark",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    transactions: 340,
    inflow: 63200,
    outflow: 60950,
    netCash: 2250,
    sourceFile: "portfolio_financial_periods.csv",
    sha256: "generated-by-public-pipeline",
  },
  {
    id: "FY25",
    label: "Synthetic current-year portfolio ledger",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    transactions: 312,
    inflow: 67500,
    outflow: 63700,
    netCash: 3800,
    sourceFile: "portfolio_financial_periods.csv",
    sha256: "generated-by-public-pipeline",
  },
];

export const fy25IncomeCategories: CashCategory[] = [
  { name: "Sponsorship", amount: 38000 },
  { name: "Ticket sales", amount: 15400 },
  { name: "Concessions", amount: 6400 },
  { name: "Memberships", amount: 4200 },
  { name: "Merchandise", amount: 2100 },
  { name: "Other income", amount: 1400 },
];

export const fy25ExpenseCategories: CashCategory[] = [
  { name: "Travel and lodging", amount: 14200 },
  { name: "Coaching, staff and officials", amount: 13600 },
  { name: "Operations and supplies", amount: 9400 },
  { name: "Venue and fields", amount: 8100 },
  { name: "Media and marketing", amount: 6800 },
  { name: "League and registration", amount: 6200 },
  { name: "Gear and merchandise", amount: 3400 },
  { name: "Community programs", amount: 2000 },
];

export const fy25MonthlyCashFlow = [
  ["Jan 25", 6000, 2500],
  ["Feb 25", 5000, 3200],
  ["Mar 25", 7500, 3800],
  ["Apr 25", 8000, 4200],
  ["May 25", 7000, 5200],
  ["Jun 25", 6000, 6100],
  ["Jul 25", 6500, 7400],
  ["Aug 25", 7500, 8200],
  ["Sep 25", 5000, 7600],
  ["Oct 25", 4500, 6000],
  ["Nov 25", 2500, 5100],
  ["Dec 25", 2000, 4400],
].map(([month, inflow, outflow]) => ({
  month: month as string,
  inflow: inflow as number,
  outflow: outflow as number,
  net: (inflow as number) - (outflow as number),
}));

export const fy25FieldCosts: FieldCostCategory[] = [
  { name: "Match fields", amount: 720, evidence: "Synthetic monthly aggregates" },
  { name: "Practice fields", amount: 2800, evidence: "Synthetic category total" },
];

export const managementOperatingBaseline = {
  evidenceLabel: "Sanitized operating assumptions",
  appliesTo: "Men and Women",
  averageAttendance: 800,
  ticketPrice: 12,
  concessionSaleMinimum: 8,
  concessionSaleMaximum: 9,
  seasonStart: "May 1",
  seasonEnd: "July 15",
  baseMatchesPerProgram: 10,
  matchesIncludingPlayoffs: { Men: 12, Women: 12 },
  homeAwaySplit: "Not established in the public dataset",
} as const;

export const managementMatchdayCosts: ManagementCost[] = [
  {
    item: "Streaming",
    minimum: 0,
    maximum: 300,
    basis: "Per home match, when used",
    treatment: "Conditional paid role",
  },
  { item: "Announcer", minimum: 60, maximum: 60, basis: "Per home match", treatment: "Paid role" },
  {
    item: "Photography",
    minimum: 60,
    maximum: 60,
    basis: "Per home match",
    treatment: "Paid role",
  },
  {
    item: "Concession inventory",
    minimum: 300,
    maximum: 360,
    basis: "Per home match",
    treatment: "Estimated inventory cost",
  },
  {
    item: "Event support labor",
    minimum: 0,
    maximum: 0,
    basis: "Per home match",
    treatment: "Volunteer-supported",
  },
  {
    item: "Athletic trainer",
    minimum: 0,
    maximum: 0,
    basis: "Per home match",
    treatment: "Partner-supported",
  },
];

export const managementConcessionPrices = [
  { item: "Drinks", minimum: 8, maximum: 11 },
  { item: "Snacks", minimum: 2, maximum: 4 },
];

export const managementSeasonCommitments: ManagementSeasonCommitment[] = [
  {
    item: "Officials",
    amount: 5600,
    basis: "Synthetic club-wide commitment",
    confidence: "Confirmed in messages",
  },
  {
    item: "Game fields",
    amount: 6400,
    basis: "Synthetic combined-program commitment",
    confidence: "Confirmed in messages",
  },
  {
    item: "Practice fields",
    amount: 9000,
    basis: "Illustrative planning estimate",
    confidence: "Approximate — confirm",
  },
];

export const reportedSponsorReceipts = [
  {
    name: "Community partner A",
    amount: 6200,
    transactions: 1,
    latestReceipt: "2025-02-01",
    evidence: "Synthetic receipt",
  },
  {
    name: "Community partner B",
    amount: 4800,
    transactions: 2,
    latestReceipt: "2025-03-15",
    evidence: "Synthetic receipts",
  },
  {
    name: "Other sponsorship receipts",
    amount: 27000,
    transactions: 34,
    latestReceipt: "2025-09-30",
    evidence: "Synthetic aggregated receipts",
  },
];

// Only role coverage is public; the source roster schema is not reproduced here.
export const staffRoles: StaffRole[] = [
  "Women's head coach",
  "Men's head coach",
  "Assistant coach",
  "Matchday operations lead",
  "Business analyst",
  "Streaming lead",
  "Public-address announcer",
  "Security lead",
  "Medical lead",
  "Physical-therapy partner",
  "Photographer",
  "Social-media lead",
].map((role) => ({
  role,
  coverage: "Covered",
  publicTreatment: "Role-only record; identity and contact fields are not published",
}));

export const openStaffRoles = [
  "Matchday operations support",
  "Logistics support",
  "Social media support",
  "Business operations intern",
  "Content intern",
];

export const matchdayNeeds: MatchdayNeed[] = [
  { scope: "Home", item: "Water cases", quantity: 3 },
  { scope: "Home", item: "Ice coolers", quantity: 2 },
  { scope: "Home", item: "Banners", quantity: null },
  { scope: "Home", item: "Payment kit", quantity: null },
  { scope: "Home", item: "Officials table", quantity: 1 },
  { scope: "Away", item: "Water cases", quantity: 2 },
  { scope: "Away", item: "Snack packs", quantity: 4 },
  { scope: "Away", item: "Ice", quantity: 2 },
];

export const sourceDocuments = [
  {
    name: "Sanitized financial model",
    file: "data/processed/fact_finance.csv",
    coverage: "Two synthetic fiscal periods; no bank rows or payees",
    sha256: "Produced in data/processed/reconciliation.json",
  },
  {
    name: "Sanitized operating assumptions",
    file: "data/raw/operating_assumptions.csv",
    coverage: "Generalized matchday drivers; no interview attribution",
    sha256: "Produced in data/processed/reconciliation.json",
  },
  {
    name: "Sanitized staffing coverage",
    file: "data/raw/staffing_roles.csv",
    coverage: "Role coverage only; names and contact channels withheld",
    sha256: "Produced in data/processed/reconciliation.json",
  },
];
