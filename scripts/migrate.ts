import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { env } from "../lib/env";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });
await sql`CREATE TABLE IF NOT EXISTS hub_migration (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
const root = path.join(process.cwd(), "prisma", "migrations");
for (const name of (await readdir(root)).sort()) {
  const existing = await sql`SELECT name FROM hub_migration WHERE name = ${name}`;
  if (existing.length) continue;
  const migration = await readFile(path.join(root, name, "migration.sql"), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(migration);
    await tx`INSERT INTO hub_migration(name) VALUES (${name})`;
  });
  console.log(JSON.stringify({ event: "migration.applied", name }));
}
await sql.end();
