import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Bounded, owned-process rehearsal. Never starts a production or remote service.
const database = new URL(process.env.DATABASE_URL ?? "invalid:");
if (!["127.0.0.1", "localhost"].includes(database.hostname) || !database.pathname.endsWith("_test"))
  throw new Error("A loopback disposable *_test database is required");
const base = "http://127.0.0.1:3400";
const env: NodeJS.ProcessEnv = {
  ...process.env,
  APP_URL: base,
  NODE_ENV: "production",
  DEMO_MODE: "false",
  PUBLIC_DEMO_MODE: "false",
  LOCAL_PREVIEW_MODE: "false",
  SESSION_SECRET: "disposable-restart-rehearsal-secret-32-characters",
};
async function requireFreePort() {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(3400, "127.0.0.1", () => probe.close(() => resolve()));
  });
}
async function start() {
  await requireFreePort();
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3400"],
    { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (data) => {
    output = (output + data).slice(-4000);
  });
  child.stderr.on("data", (data) => {
    output = (output + data).slice(-4000);
  });
  try {
    for (let i = 0; i < 80; i++) {
      if (child.exitCode !== null) throw new Error("Owned test app exited: " + output);
      try {
        const response = await fetch(base + "/api/health", { signal: AbortSignal.timeout(1000) });
        if (response.ok) return child;
      } catch {
        /* bounded readiness poll */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("Owned test app did not become healthy");
  } catch (error) {
    await stop(child);
    throw error;
  }
}
async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const stopped = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  child.kill("SIGTERM");
  await stopped;
}
async function check(phase: "before" | "after") {
  const child = spawn(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/check-restart.ts", phase],
    { env, windowsHide: true, stdio: "inherit" },
  );
  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Restart ${phase} assertions failed`)),
    );
  });
}
let owned: ChildProcess | undefined;
try {
  owned = await start();
  const beforePid = owned.pid;
  await check("before");
  await stop(owned);
  owned = await start();
  const afterPid = owned.pid;
  assert.notEqual(beforePid, afterPid, "A new application process is required");
  await check("after");
  await stop(owned);
  owned = undefined;
  const report = {
    status: "PASS",
    kind: "Separate owned application process restart; same disposable database; fresh browser contexts",
    beforePid,
    afterPid,
    bothProcessesStopped: true,
    checkedAt: new Date().toISOString(),
  };
  await writeFile("test-results/restart-cycle.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally {
  if (owned) await stop(owned);
}
