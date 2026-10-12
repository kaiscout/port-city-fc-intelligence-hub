import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { getDb } from "@/lib/server/db";
import { auditEvents } from "@/lib/server/schema";

export async function GET() {
  if (!env.DATABASE_URL && (env.DEMO_MODE === "true" || env.PUBLIC_DEMO_MODE === "true")) {
    return NextResponse.json({ data: [], readOnly: true });
  }
  const session = await requirePermission("scenarios:read");
  const data = await getDb()
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      summary: auditEvents.summary,
      entityId: auditEvents.entityId,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, session.organizationId),
        eq(auditEvents.entityType, "scenario"),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(8);
  return NextResponse.json({ data, readOnly: false });
}
