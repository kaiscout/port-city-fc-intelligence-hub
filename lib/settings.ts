import { z } from "zod";
export const settingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  activeSeasonExternalId: z.string().max(80).nullable(),
  dataOwner: z.string().trim().max(160),
  referenceDate: z.iso.date().nullable(),
  reportingNote: z.string().trim().max(2000),
  currency: z.literal("USD"),
  version: z.number().int().min(0),
});
export type ClubSettings = z.infer<typeof settingsSchema>;
