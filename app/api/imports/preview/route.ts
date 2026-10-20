import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { permissionForEntity } from "@/lib/auth/policies";
import { isClubEntity } from "@/lib/club";
import { parseCsv } from "@/lib/csv";
import { getDb } from "@/lib/server/db";
import { importBatches } from "@/lib/server/schema";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import { appendAudit, listClubRecords, lockOrganization } from "@/lib/server/club-store";
import { validateImport } from "@/lib/server/imports";
const schema = z.object({
  kind: z.string(),
  csv: z.string().min(1),
  filename: z.string().trim().min(1).max(160),
});
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("imports:write");
    const input = schema.parse(await readJson(request));
    if (!isClubEntity(input.kind)) throw new ApiError(422, "Unsupported import domain");
    const kind = input.kind;
    await requirePermission(permissionForEntity(kind, "write"));
    let rows: Record<string, string>[];
    try {
      rows = parseCsv(input.csv);
    } catch (error) {
      throw new ApiError(422, error instanceof Error ? error.message : "Invalid CSV");
    }
    if (!rows.length)
      throw new ApiError(
        422,
        "The template contains headers only. Add your source records before preview.",
      );
    const checksum = createHash("sha256").update(JSON.stringify({ kind, rows })).digest("hex");
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const [prior] = await tx
        .select()
        .from(importBatches)
        .where(
          and(
            eq(importBatches.organizationId, actor.organizationId),
            eq(importBatches.kind, kind),
            eq(importBatches.checksum, checksum),
          ),
        );
      if (prior?.status === "COMMITTED")
        throw new ApiError(
          409,
          "This content has already been imported. Use record correction rather than importing it again.",
        );
      const { validation } = validateImport(kind, rows, await listClubRecords(actor, tx));
      const valid = validation.filter((r) => r.valid).length;
      const values = {
        sourceFilename: input.filename,
        previewRows: rows,
        validation,
        rowCount: rows.length,
        acceptedCount: 0,
        rejectedCount: rows.length - valid,
        status: valid === rows.length ? "PREVIEWED" : "INVALID",
      };
      const [batch] = prior
        ? await tx
            .update(importBatches)
            .set({ ...values, version: prior.version + 1 })
            .where(eq(importBatches.id, prior.id))
            .returning()
        : await tx
            .insert(importBatches)
            .values({
              ...values,
              organizationId: actor.organizationId,
              createdById: actor.userId,
              kind,
              checksum,
            })
            .returning();
      await appendAudit(
        tx,
        actor,
        "IMPORT_PREVIEWED",
        "imports",
        batch!.id,
        "CSV validated; no operational records committed",
        { kind, rows: rows.length, valid },
      );
      return NextResponse.json({
        batchId: batch!.id,
        version: batch!.version,
        rows: validation,
        valid,
        invalid: rows.length - valid,
        policy: "Atomic: all rows must pass preview and commit-time validation.",
      });
    });
  });
}
