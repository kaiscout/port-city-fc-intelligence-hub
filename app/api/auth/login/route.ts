import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/lib/env";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/auth/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/server/db";
import { sessions, users } from "@/lib/server/schema";
import { log } from "@/lib/server/logger";

const inputSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});
const genericError = { error: "The email or password is incorrect." };

export async function POST(request: Request) {
  try {
    const input = inputSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json(genericError, { status: 400 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = consumeLoginAttempt(`${ip}:${input.data.email}`);
    if (!limit.allowed)
      return NextResponse.json(genericError, {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds ?? 900) },
      });

    let account:
      | {
          id: string;
          organizationId: string;
          displayName: string;
          role:
            | "ADMINISTRATOR"
            | "EXECUTIVE"
            | "ANALYST"
            | "COMMERCIAL"
            | "MARKETING"
            | "MATCHDAY_OPERATIONS";
          passwordHash?: string;
        }
      | undefined;
    const localDemo =
      env.DEMO_MODE === "true" &&
      process.env.NODE_ENV !== "production" &&
      input.data.email === "admin@pcfc-demo.local" &&
      input.data.password === "PilotDemo!2026";
    if (localDemo) {
      account = {
        id: "00000000-0000-4000-8000-000000000001",
        organizationId: "00000000-0000-4000-8000-000000000010",
        displayName: "Alex Morgan",
        role: "ADMINISTRATOR",
      };
    } else if (env.DATABASE_URL) {
      const rows = await getDb()
        .select()
        .from(users)
        .where(eq(users.email, input.data.email))
        .limit(1);
      const user = rows[0];
      if (user?.active && (await verifyPassword(user.passwordHash, input.data.password)))
        account = user;
    }
    if (!account) {
      log("warn", "auth.login_failed", { ip });
      return NextResponse.json(genericError, { status: 401 });
    }

    clearLoginAttempts(`${ip}:${input.data.email}`);
    const sessionId = localDemo ? `demo-${randomUUID()}` : randomUUID();
    if (!localDemo)
      await getDb()
        .insert(sessions)
        .values({
          id: sessionId,
          userId: account.id,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        });
    const token = await createSessionToken({
      userId: account.id,
      organizationId: account.organizationId,
      role: account.role,
      sessionId,
      displayName: account.displayName,
    });
    const response = NextResponse.json({
      ok: true,
      user: { displayName: account.displayName, role: account.role },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    log("info", "auth.login_succeeded", { userId: account.id, role: account.role });
    return response;
  } catch (error) {
    log("error", "auth.login_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
