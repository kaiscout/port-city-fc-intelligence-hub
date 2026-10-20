import { and, desc, eq, sql } from "drizzle-orm";
import {
  type ClubEntity,
  type ClubRecord,
  type RecordCommand,
  clubDomains,
  isClubEntity,
  parseClubCommand,
  validateReferences,
  type FieldSpec,
} from "@/lib/club";
import type { SessionClaims } from "@/lib/auth/session";
import { getDb } from "./db";
import { auditEvents, operationalRecords } from "./schema";
import { ApiError } from "./api";

export type ClubTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export function publicRecord(row: typeof operationalRecords.$inferSelect): ClubRecord {
  return {
    ...row,
    entityType: row.entityType as ClubEntity,
    payload: row.payload as Record<string, unknown>,
    status: row.status as ClubRecord["status"],
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
export async function listClubRecords(
  actor: SessionClaims,
  tx: ReturnType<typeof getDb> | ClubTransaction = getDb(),
) {
  return (
    await tx
      .select()
      .from(operationalRecords)
      .where(eq(operationalRecords.organizationId, actor.organizationId))
      .orderBy(desc(operationalRecords.updatedAt))
  )
    .filter((r) => isClubEntity(r.entityType))
    .map(publicRecord);
}
export async function lockOrganization(tx: ClubTransaction, organizationId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${organizationId}))`);
}
export async function appendAudit(
  tx: ClubTransaction,
  actor: SessionClaims,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  metadata: Record<string, unknown> = {},
) {
  await tx.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    action,
    entityType,
    entityId,
    summary,
    metadata,
  });
}
export function prepareRecord(entity: ClubEntity, command: unknown, records: ClubRecord[]) {
  const input = parseClubCommand(entity, command);
  for (const field of clubDomains[entity].fields as FieldSpec[])
    if (field.reference) {
      const target = records.find(
        (r) =>
          r.entityType === field.reference &&
          r.externalId.toLowerCase() === String(input.payload[field.key]).toLowerCase(),
      );
      if (target) input.payload[field.key] = target.externalId;
      if (input.status === "APPROVED" && target?.status !== "APPROVED")
        throw new ApiError(
          422,
          `${field.label} must be approved before this record can be approved`,
        );
    }
  const errors = validateReferences(entity, input, records);
  if (
    records.some(
      (r) =>
        r.entityType === entity &&
        r.id !== input.id &&
        r.externalId.toLowerCase() === input.externalId.toLowerCase(),
    )
  )
    errors.push("External ID already exists in this organization and domain");
  if (input.id) {
    const current = records.find((r) => r.id === input.id && r.entityType === entity);
    if (!current) throw new ApiError(404, "Record not found in this organization");
    if (current.externalId !== input.externalId)
      errors.push("External IDs are stable. Create a new record instead of renaming an identity");
    if (current.version !== input.version)
      throw new ApiError(
        409,
        "This record changed after you opened it. Refresh and review the latest version",
      );
    const dependents = records.filter(
      (r) =>
        r.id !== current.id &&
        r.status !== "ARCHIVED" &&
        (clubDomains[r.entityType].fields as FieldSpec[]).some(
          (field) => field.reference === entity && r.payload[field.key] === current.externalId,
        ),
    );
    if (input.status === "ARCHIVED" && dependents.length)
      errors.push("This record is referenced by active records. Archive dependent records first");
    if (input.status !== "APPROVED" && dependents.some((r) => r.status === "APPROVED"))
      errors.push("Approved dependent records require this record to remain approved");
    const after = records.map((r) => (r.id === current.id ? { ...r, ...input } : r));
    for (const dependent of after.filter((r) => r.id !== current.id && r.status === "APPROVED"))
      errors.push(
        ...validateReferences(dependent.entityType, dependent, after).map(
          (e) => `${dependent.externalId}: ${e}`,
        ),
      );
  }
  if (errors.length) throw new ApiError(422, errors.join("; "));
  return input;
}
export async function saveClubRecord(
  tx: ClubTransaction,
  actor: SessionClaims,
  entity: ClubEntity,
  input: RecordCommand,
) {
  let row;
  if (input.id) {
    [row] = await tx
      .update(operationalRecords)
      .set({
        name: input.name,
        status: input.status,
        payload: input.payload,
        version: sql`${operationalRecords.version}+1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(operationalRecords.id, input.id),
          eq(operationalRecords.organizationId, actor.organizationId),
          eq(operationalRecords.entityType, entity),
          eq(operationalRecords.version, input.version!),
        ),
      )
      .returning();
    if (!row) throw new ApiError(409, "Record changed; refresh before saving");
  } else {
    [row] = await tx
      .insert(operationalRecords)
      .values({
        organizationId: actor.organizationId,
        entityType: entity,
        externalId: input.externalId,
        name: input.name,
        status: input.status,
        payload: input.payload,
        createdById: actor.userId,
      })
      .returning();
  }
  await appendAudit(
    tx,
    actor,
    input.id ? "RECORD_UPDATED" : "RECORD_CREATED",
    entity,
    row!.id,
    `${input.status}: ${input.externalId}`,
    {
      version: row!.version,
      evidence: input.payload.evidence,
      sourceRef: input.payload.sourceRef,
      referenceDate: input.payload.referenceDate,
    },
  );
  return publicRecord(row!);
}
