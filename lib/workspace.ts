import type { ClubRecord } from "./club";
import { clubFixtureRows } from "./club";
import type { Role } from "./types";
export type WorkspaceSnapshot = {
  mode: "private" | "demo";
  organization: { id: string; name: string };
  reporting: {
    activeSeasonExternalId: string | null;
    dataOwner: string;
    referenceDate: string | null;
    reportingNote: string;
  };
  user: { role: Role; displayName: string };
  records: ClubRecord[];
  fixtures: ReturnType<typeof clubFixtureRows>;
  summary: {
    fixtures: number;
    paid: number | null;
    receipts: number | null;
    costs: number | null;
    contribution: number | null;
    completeFixtures: number;
  };
  audit: { id: string; action: string; entityType: string; summary: string; createdAt: string }[];
};
export function summarizeClub(fixtures: ReturnType<typeof clubFixtureRows>) {
  const sum = (key: "paid" | "revenue" | "cost") =>
    fixtures.some((f) => f[key] !== null) ? fixtures.reduce((n, f) => n + (f[key] ?? 0), 0) : null;
  const receipts = sum("revenue"),
    costs = sum("cost");
  const complete = fixtures.filter((f) => f.revenue !== null && f.cost !== null);
  return {
    fixtures: fixtures.length,
    paid: sum("paid"),
    receipts,
    costs,
    contribution:
      complete.length === fixtures.length && complete.length > 0
        ? complete.reduce((n, f) => n + f.contribution!, 0)
        : null,
    completeFixtures: complete.length,
  };
}
