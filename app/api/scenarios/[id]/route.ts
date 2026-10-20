import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, assertSameOrigin } from "@/lib/auth/guards";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import { appendAudit, lockOrganization } from "@/lib/server/club-store";
import { getDb } from "@/lib/server/db";
import { scenarios } from "@/lib/server/schema";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  return apiResult(async () => {
    requirePrivateDatabase();
    const actor = await requirePermission("scenarios:read");
    const id = z.uuid().parse((await context.params).id);
    const revisions = await getDb().execute(
      sql`SELECT version,snapshot,recorded_at FROM scenario_revision WHERE organization_id=${actor.organizationId} AND scenario_id=${id} ORDER BY version DESC`,
    );
    return NextResponse.json({ data: revisions });
  });
}
export async function DELETE(request: Request, context: Context) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("scenarios:write");
    const id = z.uuid().parse((await context.params).id);
    const { version } = z
      .object({ version: z.number().int().positive() })
      .parse(await readJson(request));
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const [row] = await tx
        .update(scenarios)
        .set({ archived: true, updatedAt: new Date() })
        .where(
          and(
            eq(scenarios.id, id),
            eq(scenarios.organizationId, actor.organizationId),
            eq(scenarios.version, version),
            eq(scenarios.archived, false),
          ),
        )
        .returning();
      if (!row) throw new ApiError(409, "Scenario not found or changed; refresh before archiving");
      await appendAudit(
        tx,
        actor,
        "SCENARIO_ARCHIVED",
        "scenario",
        id,
        `Archived ${row.name}; revisions retained`,
        { version },
      );
      return NextResponse.json({ ok: true });
    });
  });
}
