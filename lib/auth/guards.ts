import { cookies, headers } from "next/headers";
import { eq, and, gt, isNull } from "drizzle-orm";
import { env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { getDb } from "@/lib/server/db";
import { sessions } from "@/lib/server/schema";
import { readSessionToken, SESSION_COOKIE } from "./session";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const claims = await readSessionToken(token);
  if (env.DATABASE_URL && !claims.sessionId.startsWith("demo-")) {
    const result = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.id, claims.sessionId),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);
    if (!result.length) throw new Error("SESSION_REVOKED");
  }
  return claims;
}

export async function requirePermission(permission: string) {
  const session = await getSession();
  assertPermission(session.role, permission);
  return session;
}

export async function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = (await headers()).get("host");
  if (!origin || !host || new URL(origin).host !== host) throw new Error("CSRF_ORIGIN_REJECTED");
}
