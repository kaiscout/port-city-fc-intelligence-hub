import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getDb } from "@/lib/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  if (env.DATABASE_URL) {
    try {
      await getDb().execute(sql`SELECT 1`);
    } catch {
      return NextResponse.json(
        { status: "unavailable", database: "unreachable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return NextResponse.json(
    {
      status: "ok",
      mode:
        env.PUBLIC_DEMO_MODE === "true"
          ? "public-read-only"
          : env.DEMO_MODE === "true"
            ? "demonstration"
            : "production-data",
      database: env.DATABASE_URL ? "configured" : "not-configured",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
