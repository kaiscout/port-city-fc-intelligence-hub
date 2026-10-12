import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { assertSameOrigin, getSession } from "@/lib/auth/guards";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { getDb } from "@/lib/server/db";
import { sessions } from "@/lib/server/schema";

export async function POST(request: Request) {
  await assertSameOrigin(request);
  const session = await getSession();
  if (env.DATABASE_URL && !session.sessionId.startsWith("demo-"))
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, session.sessionId));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
