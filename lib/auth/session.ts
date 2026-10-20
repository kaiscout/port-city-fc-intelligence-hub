import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/types";
import { env } from "@/lib/env";
import { isRole } from "./policies";

export const SESSION_COOKIE = "pcfc_session";
export type SessionClaims = {
  userId: string;
  organizationId: string;
  role: Role;
  sessionId: string;
  displayName: string;
};

function key() {
  const secret =
    env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "local-development-session-secret-only");
  if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(claims: SessionClaims) {
  return new SignJWT({
    organizationId: claims.organizationId,
    role: claims.role,
    sessionId: claims.sessionId,
    displayName: claims.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("pcfc-hub")
    .setAudience("pcfc-hub-user")
    .sign(key());
}

export async function readSessionToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, key(), {
    issuer: "pcfc-hub",
    audience: "pcfc-hub-user",
  });
  if (
    !payload.sub ||
    typeof payload.organizationId !== "string" ||
    !isRole(payload.role) ||
    typeof payload.sessionId !== "string" ||
    typeof payload.displayName !== "string"
  )
    throw new Error("INVALID_SESSION");
  return {
    userId: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role as Role,
    sessionId: payload.sessionId,
    displayName: payload.displayName,
  };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 8 * 60 * 60,
};
