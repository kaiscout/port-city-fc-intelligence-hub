import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requirePermission } from "@/lib/auth/guards";
import { importSchemas, validateRows } from "@/lib/csv";

const schema = z.object({
  kind: z.enum(
    Object.keys(importSchemas) as [keyof typeof importSchemas, ...(keyof typeof importSchemas)[]],
  ),
  rows: z.array(z.record(z.string(), z.unknown())).max(10_000),
});

export async function POST(request: Request) {
  await assertSameOrigin(request);
  await requirePermission("imports:write");
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "Import exceeds the 2 MB limit" }, { status: 413 });
  const input = schema.parse(await request.json());
  const results = validateRows(input.kind, input.rows);
  return NextResponse.json({
    rows: results,
    valid: results.filter((row) => row.valid).length,
    invalid: results.filter((row) => !row.valid).length,
  });
}
