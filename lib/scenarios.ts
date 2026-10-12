import { z } from "zod";
import type { ScenarioInput } from "@/lib/types";

export const scenarioInputSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(2).max(80),
  program: z.enum(["Men", "Women"]),
  ticketPrice: z.number().min(0),
  expectedAttendance: z.number().int().min(0),
  venueCapacity: z.number().int().positive(),
  complimentaryPct: z.number().min(0).max(100),
  marketingSpend: z.number().min(0),
  staffing: z.number().min(0),
  security: z.number().min(0),
  officials: z.number().min(0),
  venueCosts: z.number().min(0),
  transportation: z.number().min(0),
  equipment: z.number().min(0),
  concessionParticipationPct: z.number().min(0).max(100),
  averageConcessionSpend: z.number().min(0),
  merchandiseParticipationPct: z.number().min(0).max(100),
  averageMerchandiseSpend: z.number().min(0),
  sponsorIncome: z.number().min(0),
  communityAllocationPct: z.number().min(0).max(100),
  weatherRiskPct: z.number().min(0).max(100),
  operationalRiskPct: z.number().min(0).max(100),
});

export const persistedScenarioSchema = scenarioInputSchema.omit({ id: true });

export type ScenarioRow = {
  id: string;
  name: string;
  program: "MEN" | "WOMEN" | "CLUB_WIDE";
  assumptions: unknown;
};

export function toScenarioRowInput(input: ScenarioInput) {
  const parsed = scenarioInputSchema.parse(input);
  const assumptions = persistedScenarioSchema.omit({ name: true, program: true }).parse(parsed);
  return {
    name: parsed.name,
    program: parsed.program === "Men" ? ("MEN" as const) : ("WOMEN" as const),
    assumptions,
  };
}

export function fromScenarioRow(row: ScenarioRow): ScenarioInput {
  if (row.program === "CLUB_WIDE") throw new Error("SCENARIO_PROGRAM_NOT_SUPPORTED");
  return scenarioInputSchema.parse({
    id: row.id,
    name: row.name,
    program: row.program === "MEN" ? "Men" : "Women",
    ...persistedScenarioSchema.omit({ name: true, program: true }).parse(row.assumptions),
  });
}
