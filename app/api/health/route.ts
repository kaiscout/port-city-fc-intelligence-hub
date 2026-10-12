import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
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
