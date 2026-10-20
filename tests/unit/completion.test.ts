import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { parseCsv } from "../../lib/csv";
import {
  parseClubCommand,
  validateReferences,
  clubFixtureRows,
  type ClubRecord,
} from "../../lib/club";
import { prepareRecord } from "../../lib/server/club-store";
import { validateImport } from "../../lib/server/imports";
import { calculateScenario } from "../../lib/calculations";
import { scenarioInputSchema } from "../../lib/scenarios";
import { scenarioPresets } from "../../lib/data/demo";
import { summarizeClub } from "../../lib/workspace";
const provenance = {
  evidence: "Synthetic demonstration data",
  sourceRef: "Existing synthetic fixture / independent test",
  referenceDate: "2026-10-12",
};
const record = (
  entityType: ClubRecord["entityType"],
  externalId: string,
  payload: Record<string, unknown>,
  extra: Partial<ClubRecord> = {},
): ClubRecord => ({
  id: randomUUID(),
  entityType,
  externalId,
  name: externalId,
  status: "APPROVED",
  version: 1,
  payload: { ...provenance, ...payload },
  createdAt: "",
  updatedAt: "",
  ...extra,
});
const catalog = [
  record("seasons", "2026", { startsOn: "2026-01-01", endsOn: "2026-12-31" }),
  record("teams", "MEN", { program: "Men" }),
  record("competitions", "LEAGUE", {}),
  record("venues", "VENUE", { capacity: 6000 }),
  record("fixtures", "M-01", {
    seasonExternalId: "2026",
    teamExternalId: "MEN",
    competitionExternalId: "LEAGUE",
    venueExternalId: "VENUE",
    date: "2026-05-16",
    classification: "Home",
  }),
];
describe("real operating model contracts", () => {
  it("parses commas, escaped quotes, BOM, CRLF and embedded newlines", () => {
    expect(parseCsv('\uFEFFid,note\r\nA,"Club, United"\r\nB,"He said ""yes""\nthen left"')).toEqual(
      [
        { id: "A", note: "Club, United" },
        { id: "B", note: 'He said "yes"\nthen left' },
      ],
    );
  });
  it.each(["id,id\na,b", "id,note\na", 'id,note\na,"unfinished', 'id,note\na,"ok"junk'])(
    "rejects malformed CSV %s",
    (csv) => expect(() => parseCsv(csv)).toThrow(),
  );
  it("does not coerce an unknown required count to zero", () => {
    expect(() =>
      parseClubCommand("attendance", {
        externalId: "A",
        name: "Attendance",
        status: "APPROVED",
        payload: { ...provenance, fixtureExternalId: "M-01", paid: "", complimentary: 0 },
      }),
    ).toThrow();
  });
  it("retains a genuine zero and an unknown returning count separately", () => {
    const row = parseClubCommand("attendance", {
      externalId: "A",
      name: "Attendance",
      status: "APPROVED",
      payload: {
        ...provenance,
        fixtureExternalId: "M-01",
        paid: 0,
        complimentary: 0,
        returning: "",
      },
    });
    expect(row.payload.paid).toBe(0);
    expect(row.payload.returning).toBeUndefined();
  });
  it("blocks unknown references and attendance above capacity", () => {
    const row = record("attendance", "ATT", {
      fixtureExternalId: "M-01",
      paid: 6000,
      complimentary: 1,
    });
    expect(validateReferences("attendance", row, catalog)).toContain(
      "Paid plus complimentary attendance exceeds venue capacity",
    );
    expect(
      validateReferences(
        "attendance",
        { ...row, payload: { ...row.payload, fixtureExternalId: "OTHER-ORG" } },
        catalog,
      ),
    ).toContain("Fixture: no active record in this organization");
  });
  it("blocks stale versions and a lower capacity invalidating existing attendance", () => {
    const attendance = record("attendance", "ATT", {
      fixtureExternalId: "M-01",
      paid: 1284,
      complimentary: 0,
    });
    const venue = catalog[3]!;
    expect(() =>
      prepareRecord("venues", { ...venue, version: 2 }, [...catalog, attendance]),
    ).toThrow(/changed/);
    expect(() =>
      prepareRecord("venues", { ...venue, payload: { ...venue.payload, capacity: 100 } }, [
        ...catalog,
        attendance,
      ]),
    ).toThrow(/exceeds venue capacity/);
  });
  it("blocks repeated attendance identities and keeps imports atomic", () => {
    const rows = [
      {
        externalId: "ATT",
        name: "Attendance",
        status: "APPROVED",
        ...provenance,
        fixtureExternalId: "M-01",
        paid: "1284",
        complimentary: "0",
        returning: "",
      },
      {
        externalId: "ATT2",
        name: "Duplicate fixture count",
        status: "APPROVED",
        ...provenance,
        fixtureExternalId: "M-01",
        paid: "1284",
        complimentary: "0",
        returning: "",
      },
    ];
    const result = validateImport("attendance", rows, catalog);
    expect(result.validation.map((r) => r.valid)).toEqual([true, false]);
  });
  it("analytics consume approved inputs and never fabricate missing cost", () => {
    const receipt = record("revenue", "R", {
      fixtureExternalId: "M-01",
      category: "Recorded total",
      amount: 39480,
      currency: "USD",
    });
    const cost = record("costs", "C", {
      fixtureExternalId: "M-01",
      category: "Direct total",
      amount: 28740,
      currency: "USD",
      costClass: "Direct",
    });
    expect(clubFixtureRows([...catalog, receipt])[0]).toMatchObject({
      paid: null,
      revenue: 39480,
      cost: null,
      contribution: null,
    });
    expect(summarizeClub(clubFixtureRows([...catalog, receipt, cost]))).toMatchObject({
      receipts: 39480,
      costs: 28740,
      contribution: 10740,
    });
    expect(
      clubFixtureRows([...catalog, receipt, { ...cost, status: "DRAFT" }])[0]!.contribution,
    ).toBeNull();
  });
});
describe("conditional scenario boundaries", () => {
  const base = scenarioPresets[1]!;
  it("matches the independent two-home-fixture worked example", () => {
    const input = {
      ...base,
      scope: "Season" as const,
      homeMatches: 2,
      sponsorFrequency: "Per season" as const,
      expectedAttendance: 100,
      venueCapacity: 80,
      ticketPrice: 10,
      complimentaryPct: 25,
      concessionParticipationPct: 20,
      averageConcessionSpend: 5,
      merchandiseParticipationPct: 10,
      averageMerchandiseSpend: 10,
      sponsorIncome: 100,
      marketingSpend: 200,
      staffing: 0,
      security: 0,
      officials: 0,
      venueCosts: 0,
      transportation: 0,
      equipment: 0,
      variableCostPerAttendee: 2.4,
      communityAllocationPct: 10,
      weatherRiskPct: 10,
      operationalRiskPct: 10,
    };
    const r = calculateScenario(input);
    expect(r.totalRevenue).toBe(1620);
    expect(r.operatingMargin).toBe(370);
    expect(r.breakEvenAttendance).toBe(37);
    expect(calculateScenario({ ...input, expectedAttendance: 36 }).operatingMargin).toBeCloseTo(
      -4,
      8,
    );
    expect(calculateScenario({ ...input, expectedAttendance: 37 }).operatingMargin).toBeCloseTo(
      4.5,
      8,
    );
  });
  it("distinguishes fixture sponsorship from a single season allocation", () => {
    const a = calculateScenario({
        ...base,
        scope: "Season",
        homeMatches: 2,
        sponsorFrequency: "Per fixture",
      }),
      b = calculateScenario({
        ...base,
        scope: "Season",
        homeMatches: 2,
        sponsorFrequency: "Per season",
      });
    expect(a.sponsorshipAllocation).toBe(25000);
    expect(b.sponsorshipAllocation).toBe(12500);
  });
  it("keeps zero denominators unavailable and sponsor-funded break-even zero", () => {
    const r = calculateScenario({ ...base, expectedAttendance: 0, sponsorIncome: 0 });
    expect(r.operatingMarginPct).toBeNull();
    expect(r.revenuePerAttendee).toBeNull();
    expect(calculateScenario({ ...base, sponsorIncome: 100000 }).breakEvenAttendance).toBe(0);
  });
  it("rejects combined allowances above 100 and wrong per-fixture counts", () => {
    expect(
      scenarioInputSchema.safeParse({ ...base, weatherRiskPct: 90, operationalRiskPct: 20 })
        .success,
    ).toBe(false);
    expect(scenarioInputSchema.safeParse({ ...base, homeMatches: 10 }).success).toBe(false);
  });
  it("rejects finite inputs whose combined calculation would overflow or lose supported precision", () => {
    for (const ticketPrice of [1e100, 1e308]) {
      expect(scenarioInputSchema.safeParse({ ...base, ticketPrice }).success).toBe(false);
      expect(() => calculateScenario({ ...base, ticketPrice })).toThrow(/precision/);
    }
  });
  it("does not round a positive funding gap down to a zero-attendance threshold", () => {
    const input = {
      ...base,
      expectedAttendance: 0,
      ticketPrice: 1e10,
      complimentaryPct: 0,
      concessionParticipationPct: 0,
      merchandiseParticipationPct: 0,
      sponsorIncome: 0,
      marketingSpend: 0.01,
      staffing: 0,
      security: 0,
      officials: 0,
      venueCosts: 0,
      transportation: 0,
      equipment: 0,
      variableCostPerAttendee: 0,
      communityAllocationPct: 0,
      weatherRiskPct: 0,
      operationalRiskPct: 0,
    };
    expect(calculateScenario(input).breakEvenAttendance).toBe(1);
    expect(calculateScenario(input).operatingMargin).toBe(-0.01);
    expect(calculateScenario({ ...input, expectedAttendance: 1 }).operatingMargin).toBeGreaterThan(
      0,
    );
  });
});
