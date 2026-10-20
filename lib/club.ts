import { z } from "zod";

const text = z.string().trim().min(1).max(160);
const date = z.iso.date();
const count = z.preprocess(
  (v) => (v === "" || v == null ? NaN : v),
  z.coerce.number().int().min(0).max(1_000_000),
);
const amount = z.preprocess(
  (v) => (v === "" || v == null ? NaN : v),
  z.coerce.number().min(0).max(100_000_000),
);
const optionalCount = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  count.optional(),
);
const optionalAmount = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  amount.optional(),
);
const program = z.enum(["Men", "Women", "Club-wide"]);

export type FieldSpec = {
  key: string;
  label: string;
  type?: "number" | "date" | "select";
  options?: string[];
  reference?: string;
  optional?: boolean;
  help?: string;
};
type Domain = { label: string; description: string; schema: z.ZodType; fields: FieldSpec[] };
export const clubDomains = {
  seasons: {
    label: "Seasons",
    description: "Reporting periods with explicit start and end dates.",
    schema: z
      .object({ startsOn: date, endsOn: date })
      .refine((v) => v.endsOn >= v.startsOn, "End date must follow start date"),
    fields: [
      { key: "startsOn", label: "Starts on", type: "date" },
      { key: "endsOn", label: "Ends on", type: "date" },
    ],
  },
  teams: {
    label: "Programs",
    description: "The team/program to which fixtures belong.",
    schema: z.object({ program: z.enum(["Men", "Women"]) }),
    fields: [{ key: "program", label: "Program", type: "select", options: ["Men", "Women"] }],
  },
  competitions: {
    label: "Competitions",
    description: "Competition names used by fixture records.",
    schema: z.object({}),
    fields: [],
  },
  venues: {
    label: "Venues",
    description: "Authorized venue capacities, not attendance targets.",
    schema: z.object({ capacity: count.refine((v) => v > 0, "Capacity must be positive") }),
    fields: [{ key: "capacity", label: "Capacity (people)", type: "number" }],
  },
  fixtures: {
    label: "Fixtures",
    description: "An explicit home/away classification; no season schedule is inferred.",
    schema: z.object({
      seasonExternalId: text,
      teamExternalId: text,
      competitionExternalId: text,
      venueExternalId: text,
      date,
      classification: z.enum(["Home", "Away"]),
      projected: optionalCount,
    }),
    fields: [
      { key: "seasonExternalId", label: "Season", reference: "seasons" },
      { key: "teamExternalId", label: "Program record", reference: "teams" },
      { key: "competitionExternalId", label: "Competition", reference: "competitions" },
      { key: "venueExternalId", label: "Venue", reference: "venues" },
      { key: "date", label: "Fixture date", type: "date" },
      {
        key: "classification",
        label: "Location classification",
        type: "select",
        options: ["Home", "Away"],
      },
      {
        key: "projected",
        label: "Expected attendance",
        type: "number",
        optional: true,
        help: "Planning input; leave unknown blank. Name the opponent in Display name.",
      },
    ],
  },
  attendance: {
    label: "Attendance",
    description:
      "One approved count per fixture; returning supporters must be a subset of paid attendance.",
    schema: z
      .object({
        fixtureExternalId: text,
        paid: count,
        complimentary: count,
        returning: optionalCount,
      })
      .refine(
        (v) => v.returning === undefined || v.returning <= v.paid,
        "Returning supporters cannot exceed paid attendance",
      ),
    fields: [
      { key: "fixtureExternalId", label: "Fixture", reference: "fixtures" },
      { key: "paid", label: "Paid attendance", type: "number" },
      { key: "complimentary", label: "Complimentary attendance", type: "number" },
      { key: "returning", label: "Returning paid supporters", type: "number", optional: true },
    ],
  },
  revenue: {
    label: "Receipts",
    description:
      "Fixture-linked receipts, not contract face value. USD; no cash balance is inferred.",
    schema: z.object({
      fixtureExternalId: text,
      category: text,
      amount: amount,
      currency: z.literal("USD"),
    }),
    fields: [
      { key: "fixtureExternalId", label: "Fixture", reference: "fixtures" },
      { key: "category", label: "Receipt category" },
      { key: "amount", label: "Amount (USD)", type: "number" },
      { key: "currency", label: "Currency", type: "select", options: ["USD"] },
    ],
  },
  costs: {
    label: "Costs",
    description:
      "Fixture-linked direct or explicitly allocated shared costs. Unrecorded costs remain unknown.",
    schema: z.object({
      fixtureExternalId: text,
      category: text,
      amount: amount,
      currency: z.literal("USD"),
      costClass: z.enum(["Direct", "Allocated shared"]),
    }),
    fields: [
      { key: "fixtureExternalId", label: "Fixture", reference: "fixtures" },
      { key: "category", label: "Cost category" },
      { key: "amount", label: "Amount (USD)", type: "number" },
      { key: "currency", label: "Currency", type: "select", options: ["USD"] },
      {
        key: "costClass",
        label: "Cost classification",
        type: "select",
        options: ["Direct", "Allocated shared"],
      },
    ],
  },
  sponsors: {
    label: "Sponsors",
    description: "Contract face values are not added to receipts. Club-wide contracts count once.",
    schema: z
      .object({
        program,
        contractValue: optionalAmount,
        startsOn: date,
        endsOn: date,
        owner: text,
        renewalIntent: z.enum(["Positive", "Neutral", "Unknown"]),
      })
      .refine((v) => v.endsOn >= v.startsOn, "Contract end must follow start"),
    fields: [
      { key: "program", label: "Program", type: "select", options: ["Men", "Women", "Club-wide"] },
      { key: "contractValue", label: "Contract face value (USD)", type: "number", optional: true },
      { key: "startsOn", label: "Contract starts", type: "date" },
      { key: "endsOn", label: "Contract ends", type: "date" },
      { key: "owner", label: "Accountable owner" },
      {
        key: "renewalIntent",
        label: "Renewal intent",
        type: "select",
        options: ["Unknown", "Positive", "Neutral"],
      },
    ],
  },
  "sponsor-deliverables": {
    label: "Sponsor deliverables",
    description: "An individually dated obligation with an accountable owner and delivery status.",
    schema: z.object({
      sponsorExternalId: text,
      owner: text,
      dueOn: date,
      deliveryStatus: z.enum(["Planned", "Blocked", "Complete"]),
      evidenceNote: z.string().trim().max(1000),
    }),
    fields: [
      { key: "sponsorExternalId", label: "Sponsor", reference: "sponsors" },
      { key: "owner", label: "Delivery owner" },
      { key: "dueOn", label: "Due date", type: "date" },
      {
        key: "deliveryStatus",
        label: "Delivery status",
        type: "select",
        options: ["Planned", "Blocked", "Complete"],
      },
      { key: "evidenceNote", label: "Evidence / blocker note", optional: true },
    ],
  },
  recommendations: {
    label: "Decisions & actions",
    description: "A practical follow-up linked to evidence, with owner, due date and status.",
    schema: z.object({
      owner: text,
      dueOn: date,
      actionStatus: z.enum(["Open", "In progress", "Done"]),
      priority: z.enum(["High", "Medium", "Low"]),
      rationale: z.string().trim().min(2).max(2000),
    }),
    fields: [
      { key: "owner", label: "Accountable owner" },
      { key: "dueOn", label: "Due date", type: "date" },
      {
        key: "actionStatus",
        label: "Action status",
        type: "select",
        options: ["Open", "In progress", "Done"],
      },
      { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
      { key: "rationale", label: "Finding, evidence and next action" },
    ],
  },
} satisfies Record<string, Domain>;

export type ClubEntity = keyof typeof clubDomains;
export const isClubEntity = (value: string): value is ClubEntity =>
  Object.hasOwn(clubDomains, value);
export const recordCommandSchema = z.object({
  id: z.uuid().optional(),
  version: z.number().int().positive().optional(),
  externalId: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use letters, digits, dots, underscores or hyphens"),
  name: text,
  status: z.enum(["DRAFT", "APPROVED", "ARCHIVED"]).default("DRAFT"),
  payload: z.record(z.string(), z.unknown()),
});
export type RecordCommand = z.infer<typeof recordCommandSchema>;
export type ClubRecord = RecordCommand & {
  id: string;
  version: number;
  entityType: ClubEntity;
  updatedAt: string;
  createdAt: string;
};
export const provenanceSchema = z.object({
  evidence: z.enum([
    "User-entered operational data",
    "Documented assumption",
    "Synthetic demonstration data",
  ]),
  sourceRef: z.string().trim().min(2).max(240),
  referenceDate: date,
});

export function parseClubCommand(entity: ClubEntity, command: unknown): RecordCommand {
  const input = recordCommandSchema.parse(command);
  const payload = {
    ...provenanceSchema.parse(input.payload),
    ...(clubDomains[entity].schema.parse(input.payload) as Record<string, unknown>),
  };
  return { ...input, payload };
}

export function validateReferences(
  entity: ClubEntity,
  input: RecordCommand,
  records: ClubRecord[],
) {
  const issues: string[] = [];
  const find = (kind: string, id: unknown) =>
    records.find(
      (r) =>
        r.entityType === kind &&
        r.externalId.toLowerCase() === String(id).toLowerCase() &&
        r.status !== "ARCHIVED",
    );
  for (const field of clubDomains[entity].fields as FieldSpec[])
    if (field.reference && !find(field.reference, input.payload[field.key]))
      issues.push(`${field.label}: no active record in this organization`);
  if (entity === "attendance") {
    const fixture = find("fixtures", input.payload.fixtureExternalId);
    const venue = fixture && find("venues", fixture.payload.venueExternalId);
    if (
      venue &&
      Number(input.payload.paid) + Number(input.payload.complimentary) >
        Number(venue.payload.capacity)
    )
      issues.push("Paid plus complimentary attendance exceeds venue capacity");
    if (
      records.some(
        (r) =>
          r.entityType === "attendance" &&
          r.id !== input.id &&
          r.status !== "ARCHIVED" &&
          String(r.payload.fixtureExternalId).toLowerCase() ===
            String(input.payload.fixtureExternalId).toLowerCase(),
      )
    )
      issues.push("Attendance already exists for this fixture; correct its existing version");
  }
  if (entity === "fixtures") {
    const season = find("seasons", input.payload.seasonExternalId);
    if (
      season &&
      (String(input.payload.date) < String(season.payload.startsOn) ||
        String(input.payload.date) > String(season.payload.endsOn))
    )
      issues.push("Fixture date is outside the selected season");
  }
  return issues;
}

export function clubFixtureRows(records: ClubRecord[]) {
  const approved = records.filter((r) => r.status === "APPROVED");
  const find = (kind: string, id: unknown) =>
    records.find((r) => r.entityType === kind && r.externalId === id);
  return approved
    .filter((r) => r.entityType === "fixtures")
    .map((f) => {
      const attendance = approved.find(
        (r) => r.entityType === "attendance" && r.payload.fixtureExternalId === f.externalId,
      );
      const receipts = approved.filter(
        (r) => r.entityType === "revenue" && r.payload.fixtureExternalId === f.externalId,
      );
      const costs = approved.filter(
        (r) => r.entityType === "costs" && r.payload.fixtureExternalId === f.externalId,
      );
      const total = (rows: ClubRecord[]) =>
        rows.length ? rows.reduce((sum, r) => sum + Number(r.payload.amount), 0) : null;
      const revenue = total(receipts),
        cost = total(costs);
      return {
        id: f.externalId,
        name: f.name,
        season: String(find("seasons", f.payload.seasonExternalId)?.name ?? "Unavailable"),
        seasonId: String(f.payload.seasonExternalId),
        date: String(f.payload.date),
        program: String(find("teams", f.payload.teamExternalId)?.payload.program ?? "Unavailable"),
        competition: String(
          find("competitions", f.payload.competitionExternalId)?.name ?? "Unavailable",
        ),
        venue: String(find("venues", f.payload.venueExternalId)?.name ?? "Unavailable"),
        classification: String(f.payload.classification),
        capacity: Number(find("venues", f.payload.venueExternalId)?.payload.capacity),
        paid: attendance ? Number(attendance.payload.paid) : null,
        complimentary: attendance ? Number(attendance.payload.complimentary) : null,
        returning:
          attendance?.payload.returning === undefined ? null : Number(attendance.payload.returning),
        revenue,
        cost,
        contribution: revenue === null || cost === null ? null : revenue - cost,
        sourceRef: String(f.payload.sourceRef),
        referenceDate: String(f.payload.referenceDate),
        evidence: String(f.payload.evidence),
        sourceRecordIds: [f, ...(attendance ? [attendance] : []), ...receipts, ...costs]
          .map((r) => r.externalId)
          .join("; "),
        evidenceClasses: [
          ...new Set(
            [f, ...(attendance ? [attendance] : []), ...receipts, ...costs].map((r) =>
              String(r.payload.evidence),
            ),
          ),
        ].join("; "),
        referenceDates: [
          ...new Set(
            [f, ...(attendance ? [attendance] : []), ...receipts, ...costs].map((r) =>
              String(r.payload.referenceDate),
            ),
          ),
        ].join("; "),
      };
    });
}
