import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "ADMINISTRATOR",
  "EXECUTIVE",
  "ANALYST",
  "COMMERCIAL",
  "MARKETING",
  "MATCHDAY_OPERATIONS",
]);
export const programEnum = pgEnum("program", ["MEN", "WOMEN", "CLUB_WIDE"]);
export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("DEMO"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const users = pgTable(
  "user_account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    active: boolean("active").notNull().default(true),
    failedSignIns: integer("failed_sign_ins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);
export const sessions = pgTable("session", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
export const permissions = pgTable("permission", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
});
export const rolePermissions = pgTable(
  "role_permission",
  {
    role: roleEnum("role").notNull(),
    permissionCode: text("permission_code")
      .notNull()
      .references(() => permissions.code),
  },
  (table) => [primaryKey({ columns: [table.role, table.permissionCode] })],
);
export const seasons = pgTable("season", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  startsOn: timestamp("starts_on", { mode: "date" }).notNull(),
  endsOn: timestamp("ends_on", { mode: "date" }).notNull(),
  active: boolean("active").notNull().default(false),
});
export const teams = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  program: programEnum("program").notNull(),
});
export const competitions = pgTable("competition", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  externalId: text("external_id"),
});
export const venues = pgTable("venue", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  address: text("address"),
});
export const fixtures = pgTable(
  "fixture",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    externalId: text("external_id").notNull(),
    opponent: text("opponent").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("SCHEDULED"),
  },
  (table) => [
    uniqueIndex("fixture_org_external_unique").on(table.organizationId, table.externalId),
  ],
);
export const attendanceRecords = pgTable("attendance_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  fixtureId: uuid("fixture_id")
    .notNull()
    .references(() => fixtures.id, { onDelete: "cascade" }),
  paid: integer("paid").notNull(),
  complimentary: integer("complimentary").notNull().default(0),
  returning: integer("returning_supporters").notNull().default(0),
  source: text("source").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
export const ticketCategories = pgTable("ticket_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  defaultPrice: numeric("default_price", { precision: 12, scale: 2 }).notNull(),
});
export const ticketChannels = pgTable("ticket_channel", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  externalId: text("external_id"),
});
export const revenueItems = pgTable("revenue_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  fixtureId: uuid("fixture_id").references(() => fixtures.id),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  source: text("source").notNull(),
});
export const costItems = pgTable("cost_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  fixtureId: uuid("fixture_id").references(() => fixtures.id),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  shared: boolean("shared").notNull().default(false),
  source: text("source").notNull(),
});
export const sponsorPackages = pgTable("sponsor_package", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  targetValue: numeric("target_value", { precision: 14, scale: 2 }).notNull(),
  description: text("description"),
});
export const sponsors = pgTable("sponsor", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  packageId: uuid("package_id").references(() => sponsorPackages.id),
  name: text("name").notNull(),
  contractValue: numeric("contract_value", { precision: 14, scale: 2 }).notNull(),
  startsOn: timestamp("starts_on", { mode: "date" }).notNull(),
  endsOn: timestamp("ends_on", { mode: "date" }).notNull(),
  program: programEnum("program").notNull(),
  renewalIntent: text("renewal_intent").notNull().default("UNKNOWN"),
  notes: text("notes"),
});
export const sponsorContacts = pgTable("sponsor_contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
});
export const sponsorDeliverables = pgTable("sponsor_deliverable", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  evidenceUrl: text("evidence_url"),
  estimatedReach: integer("estimated_reach"),
});
export const campaigns = pgTable("campaign", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  spend: numeric("spend", { precision: 14, scale: 2 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
});
export const funnelMetrics = pgTable("funnel_metric", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  fixtureId: uuid("fixture_id").references(() => fixtures.id),
  stage: text("stage").notNull(),
  value: integer("value").notNull(),
  measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
});
export const supporterCohorts = pgTable("supporter_cohort", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  acquiredMonth: text("acquired_month").notNull(),
  supporters: integer("supporters").notNull(),
  returned30d: integer("returned_30d").notNull().default(0),
  returned60d: integer("returned_60d").notNull().default(0),
});
export const communityPrograms = pgTable("community_program", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  program: programEnum("program").notNull(),
  owner: text("owner").notNull(),
});
export const communityImpactRecords = pgTable("community_impact_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityProgramId: uuid("community_program_id")
    .notNull()
    .references(() => communityPrograms.id),
  occurredOn: timestamp("occurred_on", { mode: "date" }).notNull(),
  participants: integer("participants").notNull(),
  eventAttendance: integer("event_attendance").notNull(),
  volunteerHours: numeric("volunteer_hours", { precision: 10, scale: 2 }).notNull(),
  contribution: numeric("contribution", { precision: 14, scale: 2 }).notNull(),
  estimatedReach: integer("estimated_reach").notNull(),
  source: text("source").notNull(),
});
export const scenarios = pgTable("scenario", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  program: programEnum("program").notNull(),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  version: integer("version").notNull().default(1),
  assumptions: jsonb("assumptions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const kpiTargets = pgTable(
  "kpi_target",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    key: text("key").notNull(),
    value: numeric("value", { precision: 14, scale: 4 }).notNull(),
    unit: text("unit").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("kpi_org_key_effective_unique").on(
      table.organizationId,
      table.key,
      table.effectiveFrom,
    ),
  ],
);
export const risks = pgTable("risk", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  title: text("title").notNull(),
  likelihood: integer("likelihood").notNull(),
  impact: integer("impact").notNull(),
  owner: text("owner").notNull(),
  mitigation: text("mitigation").notNull(),
  status: text("status").notNull(),
});
export const recommendations = pgTable("recommendation", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  title: text("title").notNull(),
  rationale: text("rationale").notNull(),
  owner: text("owner").notNull(),
  status: text("status").notNull(),
  targetDate: timestamp("target_date", { mode: "date" }),
});
export const importBatches = pgTable(
  "import_batch",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    kind: text("kind").notNull(),
    sourceFilename: text("source_filename").notNull(),
    checksum: text("checksum").notNull(),
    rowCount: integer("row_count").notNull(),
    acceptedCount: integer("accepted_count").notNull(),
    rejectedCount: integer("rejected_count").notNull(),
    status: text("status").notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("import_checksum_unique").on(table.organizationId, table.kind, table.checksum),
  ],
);
export const auditEvents = pgTable("audit_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const applicationSettings = pgTable(
  "application_setting",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    updatedById: uuid("updated_by_id")
      .notNull()
      .references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.key] })],
);
export const operationalRecords = pgTable(
  "operational_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    entityType: text("entity_type").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    payload: jsonb("payload").notNull().default({}),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("operational_record_identity_unique").on(
      table.organizationId,
      table.entityType,
      table.externalId,
    ),
  ],
);
