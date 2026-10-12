import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { canAccessPath, isRole } from "@/lib/auth/policies";

const publicPaths = ["/login", "/forbidden", "/api/auth/login", "/api/health"];
const publicDemoApiPaths = ["/api/scenarios", "/api/scenarios/audit"];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function requestSecurity(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const scriptPolicy = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const contentSecurityPolicy = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptPolicy}`,
    "connect-src 'self'",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", contentSecurityPolicy);
  return { headers, contentSecurityPolicy };
}

function secureResponse(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export async function proxy(request: NextRequest) {
  const { headers, contentSecurityPolicy } = requestSecurity(request);
  const next = () =>
    secureResponse(NextResponse.next({ request: { headers } }), contentSecurityPolicy);
  const redirectToLogin = () =>
    secureResponse(NextResponse.redirect(new URL("/login", request.url)), contentSecurityPolicy);

  if (isPublicPath(request.nextUrl.pathname)) return next();
  if (process.env.PUBLIC_DEMO_MODE === "true") {
    if (!request.nextUrl.pathname.startsWith("/api/")) return next();
    if (publicDemoApiPaths.includes(request.nextUrl.pathname)) return next();
  }
  const loopbackHost =
    request.nextUrl.hostname === "127.0.0.1" || request.nextUrl.hostname === "localhost";
  const localPreview =
    process.env.DEMO_MODE === "true" && process.env.LOCAL_PREVIEW_MODE === "true" && loopbackHost;
  if (process.env.DEMO_MODE === "true" && (process.env.NODE_ENV !== "production" || localPreview))
    return next();
  const token = request.cookies.get("pcfc_session")?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return redirectToLogin();
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: "pcfc-hub",
      audience: "pcfc-hub-user",
    });
    if (!isRole(payload.role)) throw new Error("INVALID_ROLE");
    if (
      !request.nextUrl.pathname.startsWith("/api/") &&
      !canAccessPath(payload.role, request.nextUrl.pathname)
    ) {
      const forbidden = new URL("/forbidden", request.url);
      forbidden.searchParams.set("from", request.nextUrl.pathname);
      return secureResponse(NextResponse.redirect(forbidden), contentSecurityPolicy);
    }
    return next();
  } catch {
    const response = redirectToLogin();
    response.cookies.delete("pcfc_session");
    return response;
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"] };
