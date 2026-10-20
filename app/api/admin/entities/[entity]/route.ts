import { NextResponse } from "next/server";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { permissionForEntity } from "@/lib/auth/policies";
import { isClubEntity } from "@/lib/club";
import { getDb } from "@/lib/server/db";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import {
  listClubRecords,
  lockOrganization,
  prepareRecord,
  saveClubRecord,
} from "@/lib/server/club-store";

type Context = { params: Promise<{ entity: string }> };
async function entityFrom(context: Context) {
  const { entity } = await context.params;
  if (!isClubEntity(entity))
    throw new ApiError(
      404,
      "Use supported domain workflows. Users, settings and scenarios have their own protected APIs.",
    );
  return entity;
}
export async function GET(_: Request, context: Context) {
  return apiResult(async () => {
    requirePrivateDatabase();
    const entity = await entityFrom(context);
    const actor = await requirePermission(permissionForEntity(entity, "read"));
    return NextResponse.json({
      data: (await listClubRecords(actor)).filter((r) => r.entityType === entity),
    });
  });
}
async function write(request: Request, context: Context, updating: boolean) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const entity = await entityFrom(context);
    const actor = await requirePermission(permissionForEntity(entity, "write"));
    const body = await readJson(request);
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const records = await listClubRecords(actor, tx);
      const input = prepareRecord(entity, body, records);
      if (updating !== Boolean(input.id))
        throw new ApiError(
          422,
          updating ? "Update requires ID and version" : "Create must not include an existing ID",
        );
      return NextResponse.json(
        { data: await saveClubRecord(tx, actor, entity, input) },
        { status: updating ? 200 : 201 },
      );
    });
  });
}
export const POST = (request: Request, context: Context) => write(request, context, false);
export const PATCH = (request: Request, context: Context) => write(request, context, true);
