import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  client ??= postgres(env.DATABASE_URL, {
    max: 8,
    idle_timeout: 20,
    connect_timeout: 8,
    prepare: false,
  });
  return drizzle(client, { schema });
}

export async function closeDb() {
  if (client) await client.end();
  client = undefined;
}
