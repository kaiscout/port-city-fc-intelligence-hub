import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const allowed = new Set([
  "business-case",
  "project-charter",
  "scope-and-exclusions",
  "stakeholder-map",
  "raci",
  "current-state-process",
  "future-state-process",
  "requirements-catalog",
  "moscow-prioritization",
  "user-stories",
  "kpi-dictionary",
  "data-dictionary",
  "entity-relationship-diagram",
  "traceability-matrix",
  "raid-log",
  "uat-plan",
  "uat-results",
  "executive-findings",
  "product-roadmap",
  "production-readiness-assessment",
]);

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!allowed.has(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const file = await readFile(path.join(process.cwd(), "docs", "ba", `${slug}.md`), "utf8");
  return new NextResponse(file, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.md"`,
    },
  });
}
