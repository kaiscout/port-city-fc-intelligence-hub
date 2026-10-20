import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/rbac";
import { scenarioPresets } from "@/lib/data/demo";
import { env } from "@/lib/env";
import { fromScenarioRow, scenarioInputSchema, toScenarioRowInput } from "@/lib/scenarios";
import { getDb } from "@/lib/server/db";
import { scenarios } from "@/lib/server/schema";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import { appendAudit, lockOrganization } from "@/lib/server/club-store";
export async function GET() {
  return apiResult(async () => {
    if (!env.DATABASE_URL || env.PUBLIC_DEMO_MODE === "true")
      return NextResponse.json({ data: scenarioPresets, readOnly: true });
    const actor = await requirePermission("scenarios:read");
    const rows = await getDb()
      .select()
      .from(scenarios)
      .where(and(eq(scenarios.organizationId, actor.organizationId), eq(scenarios.archived, false)))
      .orderBy(desc(scenarios.updatedAt));
    return NextResponse.json({
      data: rows.map(fromScenarioRow),
      readOnly: !hasPermission(actor.role, "scenarios:write"),
    });
  });
}
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("scenarios:write");
    const input = scenarioInputSchema.parse(await readJson(request));
    const values = toScenarioRowInput(input);
    const updating = z.uuid().safeParse(input.id).success;
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      let row;
      if (updating) {
        const [current] = await tx
          .select()
          .from(scenarios)
          .where(
            and(
              eq(scenarios.id, input.id),
              eq(scenarios.organizationId, actor.organizationId),
              eq(scenarios.archived, false),
            ),
          );
        if (!current) throw new ApiError(404, "Scenario not found in this organization");
        if (current.version !== input.version)
          throw new ApiError(409, "Scenario changed. Load the saved version before saving again.");
        const prior = fromScenarioRow(current);
        await tx.execute(
          sql`INSERT INTO scenario_revision(scenario_id,organization_id,version,snapshot,actor_user_id) VALUES (${current.id},${actor.organizationId},${current.version},${JSON.stringify(prior)}::jsonb,${actor.userId}) ON CONFLICT DO NOTHING`,
        );
        [row] = await tx
          .update(scenarios)
          .set({ ...values, version: current.version + 1, updatedAt: new Date() })
          .where(
            and(
              eq(scenarios.id, input.id),
              eq(scenarios.organizationId, actor.organizationId),
              eq(scenarios.version, current.version),
            ),
          )
          .returning();
      } else
        [row] = await tx
          .insert(scenarios)
          .values({ ...values, organizationId: actor.organizationId, createdById: actor.userId })
          .returning();
      const saved = fromScenarioRow(row!);
      await tx.execute(
        sql`INSERT INTO scenario_revision(scenario_id,organization_id,version,snapshot,actor_user_id) VALUES (${row!.id},${actor.organizationId},${row!.version},${JSON.stringify(saved)}::jsonb,${actor.userId})`,
      );
      await appendAudit(
        tx,
        actor,
        updating ? "SCENARIO_UPDATED" : "SCENARIO_CREATED",
        "scenario",
        row!.id,
        `Saved ${row!.name}, version ${row!.version}`,
        {
          version: row!.version,
          scope: input.scope,
          provenance: input.provenance,
          referenceDate: input.referenceDate,
        },
      );
      return NextResponse.json({ data: saved }, { status: updating ? 200 : 201 });
    });
  });
}
