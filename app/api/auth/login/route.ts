import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/auth/guards";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/auth/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/server/db";
import { sessions, users, auditEvents } from "@/lib/server/schema";
import { apiResult, readJson, requirePrivateDatabase } from "@/lib/server/api";
const schema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(256),
});
const genericError = { error: "The email or password is incorrect." };
export async function POST(request: Request) {
  return apiResult(async () => {
    requirePrivateDatabase();
    await assertSameOrigin(request);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json(genericError, { status: 400 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `${ip}:${parsed.data.email}`;
    const limit = consumeLoginAttempt(key);
    if (!limit.allowed)
      return NextResponse.json(genericError, {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds ?? 900) },
      });
    const [account] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);
    if (!account?.active || !(await verifyPassword(account.passwordHash, parsed.data.password)))
      return NextResponse.json(genericError, { status: 401 });
    clearLoginAttempts(key);
    const sessionId = randomUUID();
    const token = await createSessionToken({
      userId: account.id,
      organizationId: account.organizationId,
      role: account.role,
      sessionId,
      displayName: account.displayName,
    });
    await getDb().transaction(async (tx) => {
      await tx.insert(sessions).values({
        id: sessionId,
        userId: account.id,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      });
      await tx.insert(auditEvents).values({
        organizationId: account.organizationId,
        actorUserId: account.id,
        action: "SIGN_IN",
        entityType: "session",
        entityId: sessionId,
        summary: "Authenticated session created",
        metadata: { role: account.role },
      });
    });
    const response = NextResponse.json({
      ok: true,
      user: { displayName: account.displayName, role: account.role },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  });
}
