import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { scenarioPresets } from "@/lib/data/demo";
import { env } from "@/lib/env";
import { fromScenarioRow, scenarioInputSchema, toScenarioRowInput } from "@/lib/scenarios";
import { getDb } from "@/lib/server/db";
import { auditEvents, scenarios } from "@/lib/server/schema";

export async function GET() {
  if (!env.DATABASE_URL && (env.DEMO_MODE === "true" || env.PUBLIC_DEMO_MODE === "true")) {
    return NextResponse.json({ data: scenarioPresets, readOnly: true });
  }
  const session = await requirePermission("scenarios:read");
  const rows = await getDb()
    .select()
    .from(scenarios)
    .where(eq(scenarios.organizationId, session.organizationId))
    .orderBy(desc(scenarios.updatedAt));
  return NextResponse.json({ data: rows.map(fromScenarioRow), readOnly: false });
}

export async function POST(request: Request) {
  if (!env.DATABASE_URL || env.PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json(
      { error: "The public portfolio is read-only. Configure PostgreSQL to enable writes." },
      { status: 403 },
    );
  }
  await assertSameOrigin(request);
  const session = await requirePermission("scenarios:write");
  const input = scenarioInputSchema.parse(await request.json());
  const values = toScenarioRowInput(input);
  const requestedId = z.uuid().safeParse(input.id);

  return getDb().transaction(async (tx) => {
    let action = "SCENARIO_CREATED";
    let row;
    if (requestedId.success) {
      [row] = await tx
        .update(scenarios)
        .set({ ...values, version: sql`${scenarios.version} + 1`, updatedAt: new Date() })
        .where(
          and(
            eq(scenarios.id, requestedId.data),
            eq(scenarios.organizationId, session.organizationId),
          ),
        )
        .returning();
      action = "SCENARIO_UPDATED";
    }
    if (!row) {
      [row] = await tx
        .insert(scenarios)
        .values({
          organizationId: session.organizationId,
          createdById: session.userId,
          ...values,
        })
        .returning();
      action = "SCENARIO_CREATED";
    }
    await tx.insert(auditEvents).values({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action,
      entityType: "scenario",
      entityId: row!.id,
      summary: `${action === "SCENARIO_CREATED" ? "Created" : "Updated"} ${row!.name}`,
      metadata: { version: row!.version },
    });
    return NextResponse.json(
      { data: fromScenarioRow(row!) },
      { status: action === "SCENARIO_CREATED" ? 201 : 200 },
    );
  });
}
