import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requirePermission, assertSameOrigin } from "@/lib/auth/guards";
import { settingsSchema } from "@/lib/settings";
import { ApiError, apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
import { getDb } from "@/lib/server/db";
import { applicationSettings, organization } from "@/lib/server/schema";
import { appendAudit, listClubRecords, lockOrganization } from "@/lib/server/club-store";
export async function GET() {
  return apiResult(async () => {
    requirePrivateDatabase();
    const actor = await requirePermission("settings:read");
    const [org] = await getDb()
      .select()
      .from(organization)
      .where(eq(organization.id, actor.organizationId));
    const [saved] = await getDb()
      .select()
      .from(applicationSettings)
      .where(
        and(
          eq(applicationSettings.organizationId, actor.organizationId),
          eq(applicationSettings.key, "club"),
        ),
      );
    return NextResponse.json({
      data: saved
        ? { ...(saved.value as object), organizationName: org!.name, version: saved.version }
        : {
            organizationName: org!.name,
            activeSeasonExternalId: null,
            dataOwner: "",
            referenceDate: null,
            reportingNote: "",
            currency: "USD",
            version: 0,
          },
    });
  });
}
export async function PATCH(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await requirePermission("settings:write");
    const input = settingsSchema.parse(await readJson(request));
    return getDb().transaction(async (tx) => {
      await lockOrganization(tx, actor.organizationId);
      const [current] = await tx
        .select()
        .from(applicationSettings)
        .where(
          and(
            eq(applicationSettings.organizationId, actor.organizationId),
            eq(applicationSettings.key, "club"),
          ),
        );
      if ((current?.version ?? 0) !== input.version)
        throw new ApiError(409, "Settings changed after you opened them. Reload before saving.");
      if (
        input.activeSeasonExternalId &&
        !(await listClubRecords(actor, tx)).some(
          (r) =>
            r.entityType === "seasons" &&
            r.externalId === input.activeSeasonExternalId &&
            r.status === "APPROVED",
        )
      )
        throw new ApiError(422, "Choose an approved season in this organization");
      const version = input.version + 1;
      const value = { ...input, version };
      if (current)
        await tx
          .update(applicationSettings)
          .set({ value, version, updatedById: actor.userId, updatedAt: new Date() })
          .where(
            and(
              eq(applicationSettings.organizationId, actor.organizationId),
              eq(applicationSettings.key, "club"),
            ),
          );
      else
        await tx.insert(applicationSettings).values({
          organizationId: actor.organizationId,
          key: "club",
          value,
          version,
          updatedById: actor.userId,
        });
      await tx
        .update(organization)
        .set({ name: input.organizationName, onboardingComplete: true, updatedAt: new Date() })
        .where(eq(organization.id, actor.organizationId));
      await appendAudit(
        tx,
        actor,
        "SETTINGS_UPDATED",
        "organization-settings",
        actor.organizationId,
        "Organization reporting configuration saved",
        { version },
      );
      return NextResponse.json({ data: value });
    });
  });
}
