import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "outputs",
  "playwright-report",
  "test-results",
]);
const scannedExtensions = new Set([
  ".css",
  ".csv",
  ".json",
  ".md",
  ".mjs",
  ".pbip",
  ".pbir",
  ".pq",
  ".sql",
  ".tmdl",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (
      scannedExtensions.has(path.extname(entry.name).toLowerCase()) &&
      entry.name !== "package-lock.json"
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

const findings: string[] = [];
for (const file of await walk(root)) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const content = await readFile(file, "utf8");

  for (const match of content.matchAll(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi)) {
    const domain = match[1]?.toLowerCase();
    if (!domain) continue;
    if (domain !== "example.test" && domain !== "pcfc-demo.local") {
      findings.push(`${relative}: unexpected email address`);
    }
  }
  if (/\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/.test(content)) {
    findings.push(`${relative}: phone-like value`);
  }
  if (/[A-Z]:\\Users\\[^\\\s]+|\/home\/[^/\s]+/i.test(content)) {
    findings.push(`${relative}: user-specific absolute path`);
  }
  if (/\b(?:routing|account)\s*(?:number|no\.?|#)/i.test(content)) {
    findings.push(`${relative}: banking identifier field`);
  }

  if (relative.startsWith("data/") && relative.endsWith(".csv")) {
    const [header = "", ...rows] = content.trim().split(/\r?\n/);
    if (/\b(?:email|phone|contact|payee|counterparty|memo|account)\b/i.test(header)) {
      findings.push(`${relative}: prohibited row-level or contact column`);
    }
    if (rows.length > 200)
      findings.push(`${relative}: public dataset exceeds 200-row review limit`);
  }
}

if (findings.length) {
  console.error(
    ["Privacy scan failed:", ...[...new Set(findings)].map((item) => `- ${item}`)].join("\n"),
  );
  process.exit(1);
}

console.log(
  "Privacy scan passed: no contact, banking identifier, local path, or row-level export patterns found.",
);
