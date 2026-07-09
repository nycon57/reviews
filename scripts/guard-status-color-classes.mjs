import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["src/components", "src/app"];
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const rawStatusColorClassPattern =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:green|red|amber|yellow|orange|emerald|rose|cyan|lime)-\d/g;
const baselinePath = new URL("./status-color-class-baseline.json", import.meta.url);

async function collectFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath ?? dir, entry.name));
}

async function countRawStatusColorClasses() {
  const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();
  const byFile = {};
  let total = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const matches = source.match(rawStatusColorClassPattern) ?? [];

    if (matches.length > 0) {
      byFile[file] = matches.length;
      total += matches.length;
    }
  }

  return {
    total,
    byFile,
  };
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const { total, byFile } = await countRawStatusColorClasses();
const allowedByFile = baseline.rawStatusColorClassHitsByFile ?? {};
const offenders = [];
let shrank = false;

for (const [file, count] of Object.entries(byFile)) {
  const allowed = allowedByFile[file] ?? 0;
  if (count > allowed) {
    offenders.push({ file, count, allowed, delta: count - allowed });
  } else if (count < allowed) {
    shrank = true;
  }
}

for (const file of Object.keys(allowedByFile)) {
  if ((byFile[file] ?? 0) < allowedByFile[file]) {
    shrank = true;
  }
}

if (offenders.length > 0) {
  console.error("Raw status-color Tailwind classes exceeded the per-file baseline.");
  console.error("Use semantic status tokens such as bg-success/10 text-success border-success/20.");
  console.error("Offending files:");
  for (const entry of offenders.sort((a, b) => b.delta - a.delta || a.file.localeCompare(b.file))) {
    console.error(
      `  ${entry.file}: ${entry.count} hit(s), baseline ${entry.allowed}, +${entry.delta}`,
    );
  }
  process.exit(1);
}

const baselineTotal = Object.values(allowedByFile).reduce((sum, count) => sum + count, 0);
console.log(`Raw status-color Tailwind classes: ${total}/${baselineTotal} baseline.`);
if (shrank) {
  console.log("Some per-file counts are below baseline; consider regenerating status-color-class-baseline.json.");
}
