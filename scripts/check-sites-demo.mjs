import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = ["index.html", "styles.css", "app.js", "data.js", "assets/pcfc-logo.png"];

for (const file of requiredFiles) {
  const details = await stat(path.join(root, "dist", file));
  if (!details.isFile() || details.size === 0)
    throw new Error(`Static demo artifact is missing or empty: ${file}`);
}

const [html, script, dataset] = await Promise.all([
  readFile(path.join(root, "dist", "index.html"), "utf8"),
  readFile(path.join(root, "dist", "app.js"), "utf8"),
  readFile(path.join(root, "dist", "data.js"), "utf8"),
]);

const requiredViews = [
  "command",
  "finance",
  "commercial",
  "matchday",
  "programs",
  "scenarios",
  "decisions",
  "quality",
  "access",
];
for (const view of requiredViews) {
  if (!script.includes(`id: "${view}"`))
    throw new Error(`Static demo is missing the ${view} workspace.`);
}

const forbiddenPatterns = [
  /@[A-Z0-9.-]+\.(?:com|org|net|co)\b/i,
  /(?:contact|phone|email)\s*:/i,
  /account\s*(?:number|#)/i,
];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(dataset))
    throw new Error(`Public data bundle matched forbidden pattern: ${pattern}`);
}

if (!html.includes('id="palette-backdrop"') || !html.includes('id="detail-drawer"')) {
  throw new Error("Static demo is missing its command palette or drill-down drawer.");
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      files: requiredFiles.length,
      workspaces: requiredViews.length,
      privacyPatterns: forbiddenPatterns.length,
    },
    null,
    2,
  ),
);
