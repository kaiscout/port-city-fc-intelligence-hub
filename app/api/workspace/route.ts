import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { permissionForEntity } from "@/lib/auth/policies";
import { hasPermission } from "@/lib/rbac";
import { clubFixtureRows } from "@/lib/club";
import { summarizeClub } from "@/lib/workspace";
import { env } from "@/lib/env";
import { apiResult } from "@/lib/server/api";
import { listClubRecords } from "@/lib/server/club-store";
import { getDb } from "@/lib/server/db";
import { applicationSettings, auditEvents, organization } from "@/lib/server/schema";

export async function GET() {
  return apiResult(async () => {
    if (env.PUBLIC_DEMO_MODE === "true" || !env.DATABASE_URL)
      return NextResponse.json({ mode: "demo" });
    const actor = await requirePermission("dashboard:read");
    const records = await listClubRecords(actor),
      fixtures = clubFixtureRows(records);
    const [org] = await getDb()
      .select()
      .from(organization)
      .where(eq(organization.id, actor.organizationId));
    const [configuration] = await getDb()
      .select()
      .from(applicationSettings)
      .where(
        and(
          eq(applicationSettings.organizationId, actor.organizationId),
          eq(applicationSettings.key, "club"),
        ),
      );
    const reporting = configuration?.value as Record<string, unknown> | undefined;
    const audit = hasPermission(actor.role, "settings:read")
      ? await getDb()
          .select({
            id: auditEvents.id,
            action: auditEvents.action,
            entityType: auditEvents.entityType,
            summary: auditEvents.summary,
            createdAt: auditEvents.createdAt,
          })
          .from(auditEvents)
          .where(and(eq(auditEvents.organizationId, actor.organizationId)))
          .orderBy(desc(auditEvents.createdAt))
          .limit(100)
      : [];
    return NextResponse.json({
      mode: "private",
      organization: { id: org!.id, name: org!.name },
      reporting: {
        activeSeasonExternalId: reporting?.activeSeasonExternalId ?? null,
        dataOwner: reporting?.dataOwner ?? "",
        referenceDate: reporting?.referenceDate ?? null,
        reportingNote: reporting?.reportingNote ?? "",
      },
      user: { role: actor.role, displayName: actor.displayName },
      records: records.filter((r) =>
        hasPermission(actor.role, permissionForEntity(r.entityType, "read")),
      ),
      fixtures:
        hasPermission(actor.role, "analytics:read") || hasPermission(actor.role, "fixtures:read")
          ? fixtures
          : [],
      summary: summarizeClub(fixtures),
      audit,
    });
  });
}
