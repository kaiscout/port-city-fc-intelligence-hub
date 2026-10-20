import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, assertSameOrigin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import { appendAudit, lockOrganization } from "@/lib/server/club-store";
import { getDb } from "@/lib/server/db";
import { users, sessions } from "@/lib/server/schema";
const role = z.enum([
  "ADMINISTRATOR",
  "EXECUTIVE",
  "ANALYST",
  "COMMERCIAL",
  "MARKETING",
  "MATCHDAY_OPERATIONS",
]);
const createSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  displayName: z.string().trim().min(2).max(160),
  role,
  password: z.string().min(12).max(256),
});
const updateSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  role,
  active: z.boolean(),
});
const safeFields = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
  active: users.active,
  version: users.version,
};
export async function GET() {
  return apiResult(async () => {
    requirePrivateDatabase();
    const actor = await requirePermission("users:read");
    return NextResponse.json({
      data: await getDb()
        .select(safeFields)
        .from(users)
        .where(eq(users.organizationId, actor.organizationId)),
    });
  });
}
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("users:write");
    const input = createSchema.parse(await readJson(request));
    const passwordHash = await hashPassword(input.password);
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const [row] = await tx
        .insert(users)
        .values({
          organizationId: actor.organizationId,
          email: input.email,
          displayName: input.displayName,
          role: input.role,
          passwordHash,
        })
        .returning(safeFields);
      await appendAudit(
        tx,
        actor,
        "USER_CREATED",
        "users",
        row!.id,
        "Role-controlled account provisioned",
        { role: row!.role },
      );
      return NextResponse.json({ data: row }, { status: 201 });
    });
  });
}
export async function PATCH(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("users:write");
    const input = updateSchema.parse(await readJson(request));
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const accounts = await tx
        .select(safeFields)
        .from(users)
        .where(eq(users.organizationId, actor.organizationId));
      const current = accounts.find((a) => a.id === input.id);
      if (!current) throw new ApiError(404, "User record not found");
      if (current.version !== input.version)
        throw new ApiError(409, "Account changed. Refresh before saving");
      if (
        current.role === "ADMINISTRATOR" &&
        current.active &&
        (!input.active || input.role !== "ADMINISTRATOR") &&
        accounts.filter((a) => a.role === "ADMINISTRATOR" && a.active).length <= 1
      )
        throw new ApiError(422, "The organization must retain an active administrator");
      const [row] = await tx
        .update(users)
        .set({
          role: input.role,
          active: input.active,
          version: sql`${users.version}+1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, input.id),
            eq(users.organizationId, actor.organizationId),
            eq(users.version, input.version),
          ),
        )
        .returning(safeFields);
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.userId, input.id), isNull(sessions.revokedAt)));
      await appendAudit(
        tx,
        actor,
        "USER_ACCESS_UPDATED",
        "users",
        input.id,
        "Account access updated; existing sessions revoked",
        { role: input.role, active: input.active, version: row!.version },
      );
      return NextResponse.json({ data: row });
    });
  });
}
