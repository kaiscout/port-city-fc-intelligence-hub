import { cookies } from "next/headers";
import { eq, and, gt, isNull } from "drizzle-orm";
import { env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { getDb } from "@/lib/server/db";
import { sessions, users } from "@/lib/server/schema";
import { readSessionToken, SESSION_COOKIE } from "./session";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const claims = await readSessionToken(token).catch(() => {
    throw new Error("UNAUTHENTICATED");
  });
  if (env.DATABASE_URL) {
    if (claims.sessionId.startsWith("demo-")) throw new Error("INVALID_SESSION");
    const result = await getDb()
      .select({ id: sessions.id, role: users.role, displayName: users.displayName })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, claims.sessionId),
          eq(sessions.userId, claims.userId),
          eq(users.organizationId, claims.organizationId),
          eq(users.active, true),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);
    if (!result.length) throw new Error("SESSION_REVOKED");
    return { ...claims, role: result[0]!.role, displayName: result[0]!.displayName };
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
  const host = request.headers.get("host");
  let valid = false;
  try {
    valid = Boolean(
      origin &&
      host &&
      new URL(origin).host === host &&
      new URL(origin).origin === new URL(env.APP_URL).origin,
    );
  } catch {}
  if (!valid) throw new Error("CSRF_ORIGIN_REJECTED");
}
