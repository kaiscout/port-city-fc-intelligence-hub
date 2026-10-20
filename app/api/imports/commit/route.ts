import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, assertSameOrigin } from "@/lib/auth/guards";
import { permissionForEntity } from "@/lib/auth/policies";
import { isClubEntity } from "@/lib/club";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import {
  appendAudit,
  listClubRecords,
  lockOrganization,
  saveClubRecord,
} from "@/lib/server/club-store";
import { validateImport } from "@/lib/server/imports";
import { getDb } from "@/lib/server/db";
import { importBatches } from "@/lib/server/schema";
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("imports:write");
    const input = z
      .object({ batchId: z.uuid(), version: z.number().int().positive() })
      .parse(await readJson(request));
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const [batch] = await tx
        .select()
        .from(importBatches)
        .where(
          and(
            eq(importBatches.id, input.batchId),
            eq(importBatches.organizationId, actor.organizationId),
          ),
        )
        .for("update");
      if (!batch || !isClubEntity(batch.kind)) throw new ApiError(404, "Import batch not found");
      await requirePermission(permissionForEntity(batch.kind, "write"));
      if (batch.status === "COMMITTED")
        return NextResponse.json({
          batchId: batch.id,
          accepted: batch.acceptedCount,
          alreadyCommitted: true,
        });
      if (batch.version !== input.version || batch.status !== "PREVIEWED")
        throw new ApiError(
          409,
          "Preview is invalid or out of date. Correct the file and preview again.",
        );
      const { validation, commands } = validateImport(
        batch.kind,
        batch.previewRows as Record<string, string>[],
        await listClubRecords(actor, tx),
      );
      if (validation.some((r) => !r.valid))
        throw new ApiError(
          409,
          "Source records changed after preview. Nothing was imported; preview again to see row-level errors.",
        );
      for (const command of commands) await saveClubRecord(tx, actor, batch.kind, command);
      await tx
        .update(importBatches)
        .set({
          status: "COMMITTED",
          acceptedCount: commands.length,
          rejectedCount: 0,
          completedAt: new Date(),
          version: batch.version + 1,
        })
        .where(eq(importBatches.id, batch.id));
      await appendAudit(
        tx,
        actor,
        "IMPORT_COMMITTED",
        "imports",
        batch.id,
        "Atomic CSV import committed",
        { kind: batch.kind, accepted: commands.length, checksum: batch.checksum },
      );
      return NextResponse.json({
        batchId: batch.id,
        accepted: commands.length,
        alreadyCommitted: false,
      });
    });
  });
}
