import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import postgres from "postgres";

// Deliberately restricted rehearsal: never a production backup replacement.
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.RESTORE_DATABASE_URL;
if (!sourceUrl || !targetUrl || process.env.DISPOSABLE_RECOVERY_ACK !== "synthetic-only")
  throw new Error("Explicit disposable source, target and acknowledgement required");
for (const raw of [sourceUrl, targetUrl]) {
  const u = new URL(raw);
  if (
    !["127.0.0.1", "localhost"].includes(u.hostname) ||
    (!u.pathname.endsWith("_test") && !u.pathname.endsWith("_test_restore"))
  )
    throw new Error(
      "Recovery rehearsal accepts loopback disposable *_test / *_test_restore databases only",
    );
}
if (sourceUrl === targetUrl || new URL(sourceUrl).pathname === new URL(targetUrl).pathname)
  throw new Error("Source and restore databases must differ");
const source = postgres(sourceUrl, { max: 1, prepare: false }),
  target = postgres(targetUrl, { max: 1, prepare: false });
const canonical = (v: unknown): string =>
  JSON.stringify(v, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
const digest = (rows: unknown[]) =>
  createHash("sha256")
    .update(canonical(rows.map(canonical).sort()))
    .digest("hex");
try {
  const tables = (
    await source`SELECT tablename name FROM pg_tables WHERE schemaname='public' AND tablename<>'hub_migration' ORDER BY tablename`
  ).map((r) => String(r.name));
  const edges =
    await source`SELECT child.relname child,parent.relname parent FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_class parent ON parent.oid=c.confrelid JOIN pg_namespace ns ON ns.oid=child.relnamespace WHERE c.contype='f' AND ns.nspname='public'`;
  const ordered: string[] = [];
  while (ordered.length < tables.length) {
    const next = tables.find(
      (t) =>
        !ordered.includes(t) &&
        edges
          .filter((e) => e.child === t && e.parent !== t)
          .every((e) => ordered.includes(String(e.parent))),
    );
    if (!next) throw new Error("Cyclic schema requires a reviewed recovery procedure");
    ordered.push(next);
  }
  const migrations = (await source`SELECT name FROM hub_migration ORDER BY name`).map(
    (r) => r.name,
  );
  if (
    canonical((await target`SELECT name FROM hub_migration ORDER BY name`).map((r) => r.name)) !==
    canonical(migrations)
  )
    throw new Error("Target must first receive the same reviewed migrations");
  const preservedMigrationReferences = new Set<string>();
  for (const table of tables) {
    const [row] = await target`SELECT count(*)::int n FROM ${target(table)}`;
    if (row!.n !== 0) {
      if (!["permission", "role_permission"].includes(table))
        throw new Error(`Restore target contains ${table} data; no data overwritten`);
      const existing = JSON.parse(JSON.stringify(await target`SELECT * FROM ${target(table)}`));
      const sourceReferences = JSON.parse(
        JSON.stringify(await source`SELECT * FROM ${source(table)}`),
      );
      if (digest(existing) !== digest(sourceReferences))
        throw new Error("Migration reference data differs; no data overwritten");
      preservedMigrationReferences.add(table);
    }
  }
  const data = await source.begin("isolation level repeatable read read only", async (tx) => {
    const result: Record<string, unknown[]> = {};
    for (const table of tables)
      result[table] = JSON.parse(JSON.stringify(await tx`SELECT * FROM ${tx(table)}`));
    return result;
  });
  await mkdir("backups", { recursive: true });
  const file = `backups/disposable-rehearsal-${new Date().toISOString().replaceAll(":", "-")}.json`;
  const backup = JSON.stringify({
    scope: "Synthetic disposable application data; schema supplied by migrations",
    migrations,
    data,
  });
  await writeFile(file, backup, { flag: "wx" });
  const expected = createHash("sha256").update(backup).digest("hex");
  const readback = await readFile(file, "utf8");
  if (createHash("sha256").update(readback).digest("hex") !== expected)
    throw new Error("Backup readback checksum mismatch");
  const recovered = JSON.parse(readback) as { data: Record<string, postgres.JSONValue[]> };
  await target.begin(async (tx) => {
    for (const table of ordered) {
      if (preservedMigrationReferences.has(table)) continue;
      const rows = recovered.data[table]!;
      if (rows.length)
        await tx`INSERT INTO ${tx(table)} SELECT * FROM json_populate_recordset(NULL::${tx(table)},${tx.json(rows)}::json)`;
    }
  });
  const checks = [];
  for (const table of tables) {
    const restored = JSON.parse(JSON.stringify(await target`SELECT * FROM ${target(table)}`));
    const match = digest(data[table]!) === digest(restored);
    checks.push({ table, rows: data[table]!.length, sha256: digest(restored), match });
    if (!match) throw new Error(`Restore mismatch: ${table}`);
  }
  const sums =
    await target`SELECT entity_type, count(*)::int records, sum(CASE WHEN entity_type IN ('revenue','costs') AND status='APPROVED' THEN (payload->>'amount')::numeric ELSE 0 END)::text amount FROM operational_record GROUP BY entity_type ORDER BY entity_type`;
  await mkdir("test-results", { recursive: true });
  const report = {
    status: "PASS",
    kind: "Application-data logical backup + isolated migrated-schema restore; not pg_dump or physical/PITR recovery",
    backupSha256: expected,
    tables: checks.length,
    preservedIdenticalMigrationReferences: [...preservedMigrationReferences],
    checks,
    operationalSums: sums,
    executedAt: new Date().toISOString(),
  };
  await writeFile("test-results/disposable-recovery.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally {
  await source.end();
  await target.end();
}
