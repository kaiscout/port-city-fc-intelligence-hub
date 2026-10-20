import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const kind = process.argv[2];
if (!["data", "powerbi"].includes(kind)) throw new Error("Expected data or powerbi");
const directory = kind === "data" ? "data/processed" : "powerbi";
async function snapshot(dir) {
  const result = {};
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.name === ".pbi") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(file));
    else
      result[file.replaceAll("\\", "/")] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
  }
  return result;
}
const before = await snapshot(directory);
if (!Object.keys(before).length) throw new Error("Generated artifact baseline is missing");
const run = spawnSync(
  process.execPath,
  [
    "node_modules/tsx/dist/cli.mjs",
    kind === "data" ? "scripts/build-public-dataset.ts" : "scripts/build-powerbi-companion.ts",
  ],
  { stdio: "inherit" },
);
if (run.error) throw run.error;
if (run.status !== 0) process.exit(run.status ?? 1);
const after = await snapshot(directory);
const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
  (file) => before[file] !== after[file],
);
if (changed.length)
  throw new Error(
    `Generated output drift: ${changed.join(", ")}. Review and regenerate the committed artifact sources.`,
  );
console.log(
  JSON.stringify({
    gate: `${kind} regeneration`,
    files: Object.keys(after).length,
    status: "PASS",
  }),
);
