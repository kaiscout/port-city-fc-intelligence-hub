import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { assertSameOrigin, getSession } from "@/lib/auth/guards";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { getDb } from "@/lib/server/db";
import { sessions } from "@/lib/server/schema";
import { apiResult, requirePrivateDatabase } from "@/lib/server/api";
import { appendAudit } from "@/lib/server/club-store";
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const actor = await getSession();
    await getDb().transaction(async (tx) => {
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.id, actor.sessionId), eq(sessions.userId, actor.userId)));
      await appendAudit(tx, actor, "SIGN_OUT", "session", actor.sessionId, "Session revoked");
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
    return response;
  });
}
