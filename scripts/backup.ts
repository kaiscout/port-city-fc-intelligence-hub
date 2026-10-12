import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { env } from "../lib/env";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const directory = path.join(process.cwd(), "backups");
await mkdir(directory, { recursive: true });
const destination = path.join(
  directory,
  `pcfc-hub-${new Date().toISOString().replaceAll(":", "-")}.dump`,
);
await new Promise<void>((resolve, reject) => {
  const child = spawn("pg_dump", ["--format=custom", "--file", destination], {
    stdio: "inherit",
    env: { ...process.env, PGDATABASE: env.DATABASE_URL },
  });
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}`)),
  );
});
console.log(JSON.stringify({ event: "backup.created", destination }));
