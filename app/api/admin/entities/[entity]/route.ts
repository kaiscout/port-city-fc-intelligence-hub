import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/server/db";
import { auditEvents, operationalRecords } from "@/lib/server/schema";
import { isEntityName, permissionForEntity } from "@/lib/auth/policies";

const recordSchema = z.object({
  id: z.uuid().optional(),
  externalId: z.string().min(1).max(80),
  name: z.string().min(2).max(160),
  status: z.string().min(2).max(40).default("ACTIVE"),
  payload: z.record(z.string(), z.unknown()).default({}),
});

function validEntity(entity: string) {
  if (!isEntityName(entity)) throw new Error("INVALID_ENTITY");
  return entity;
}

export async function GET(_: Request, context: { params: Promise<{ entity: string }> }) {
  const entity = validEntity((await context.params).entity);
  const session = await requirePermission(permissionForEntity(entity, "read"));
  const rows = await getDb()
    .select()
    .from(operationalRecords)
    .where(
      and(
        eq(operationalRecords.organizationId, session.organizationId),
        eq(operationalRecords.entityType, entity),
      ),
    );
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) {
  await assertSameOrigin(request);
  const entity = validEntity((await context.params).entity);
  const session = await requirePermission(permissionForEntity(entity, "write"));
  const input = recordSchema.parse(await request.json());
  return getDb().transaction(async (tx) => {
    const [record] = await tx
      .insert(operationalRecords)
      .values({
        organizationId: session.organizationId,
        entityType: entity,
        externalId: input.externalId,
        name: input.name,
        status: input.status,
        payload: input.payload,
        createdById: session.userId,
      })
      .returning();
    await tx.insert(auditEvents).values({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "CREATE",
      entityType: entity,
      entityId: record!.id,
      summary: `Created ${input.externalId}`,
      metadata: {},
    });
    return NextResponse.json({ data: record }, { status: 201 });
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ entity: string }> }) {
  await assertSameOrigin(request);
  const entity = validEntity((await context.params).entity);
  const session = await requirePermission(permissionForEntity(entity, "write"));
  const input = recordSchema.extend({ id: z.uuid() }).parse(await request.json());
  return getDb().transaction(async (tx) => {
    const [record] = await tx
      .update(operationalRecords)
      .set({
        externalId: input.externalId,
        name: input.name,
        status: input.status,
        payload: input.payload,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(operationalRecords.id, input.id),
          eq(operationalRecords.organizationId, session.organizationId),
          eq(operationalRecords.entityType, entity),
        ),
      )
      .returning();
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await tx.insert(auditEvents).values({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "UPDATE",
      entityType: entity,
      entityId: record.id,
      summary: `Updated ${input.externalId}`,
      metadata: {},
    });
    return NextResponse.json({ data: record });
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ entity: string }> }) {
  await assertSameOrigin(request);
  const entity = validEntity((await context.params).entity);
  const session = await requirePermission(permissionForEntity(entity, "write"));
  const { id } = z.object({ id: z.uuid() }).parse(await request.json());
  return getDb().transaction(async (tx) => {
    const [record] = await tx
      .delete(operationalRecords)
      .where(
        and(
          eq(operationalRecords.id, id),
          eq(operationalRecords.organizationId, session.organizationId),
          eq(operationalRecords.entityType, entity),
        ),
      )
      .returning();
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await tx.insert(auditEvents).values({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "DELETE",
      entityType: entity,
      entityId: id,
      summary: `Deleted ${record.externalId}`,
      metadata: {},
    });
    return NextResponse.json({ ok: true });
  });
}
