import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { apiResult, requirePrivateDatabase } from "@/lib/server/api";
import { getDb } from "@/lib/server/db";
import { importBatches } from "@/lib/server/schema";
export async function GET() {
  return apiResult(async () => {
    requirePrivateDatabase();
    const actor = await requirePermission("imports:write");
    return NextResponse.json({
      data: await getDb()
        .select({
          id: importBatches.id,
          kind: importBatches.kind,
          sourceFilename: importBatches.sourceFilename,
          rowCount: importBatches.rowCount,
          acceptedCount: importBatches.acceptedCount,
          rejectedCount: importBatches.rejectedCount,
          status: importBatches.status,
          createdAt: importBatches.createdAt,
          completedAt: importBatches.completedAt,
        })
        .from(importBatches)
        .where(eq(importBatches.organizationId, actor.organizationId))
        .orderBy(desc(importBatches.createdAt))
        .limit(100),
    });
  });
}
