import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { getDb } from "@/lib/server/db";
import { auditEvents, scenarios } from "@/lib/server/schema";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "The public portfolio is read-only." }, { status: 403 });
  }
  await assertSameOrigin(request);
  const session = await requirePermission("scenarios:write");
  const id = z.uuid().parse((await context.params).id);
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .delete(scenarios)
      .where(and(eq(scenarios.id, id), eq(scenarios.organizationId, session.organizationId)))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await tx.insert(auditEvents).values({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "SCENARIO_DELETED",
      entityType: "scenario",
      entityId: row.id,
      summary: `Deleted ${row.name}`,
      metadata: { version: row.version },
    });
    return NextResponse.json({ ok: true });
  });
}
