import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["src/components", "src/app"];
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const rawStatusColorClassPattern = /\b(?:bg|text|border)-(?:green|red|amber|yellow|orange)-\d/g;
const baselinePath = new URL("./status-color-class-baseline.json", import.meta.url);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function countRawStatusColorClasses() {
  const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();
  const byFile = [];
  let total = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const matches = source.match(rawStatusColorClassPattern) ?? [];

    if (matches.length > 0) {
      byFile.push({ file, count: matches.length });
      total += matches.length;
    }
  }

  return {
    total,
    byFile: byFile.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file)),
  };
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const { total, byFile } = await countRawStatusColorClasses();
const allowed = baseline.rawStatusColorClassHits;

if (total > allowed) {
  console.error(`Raw status-color Tailwind classes grew from ${allowed} to ${total}.`);
  console.error("Use semantic status tokens such as bg-success/10 text-success border-success/20.");
  console.error("Largest current files:");
  for (const entry of byFile.slice(0, 10)) {
    console.error(`  ${entry.count.toString().padStart(4, " ")}  ${entry.file}`);
  }
  process.exit(1);
}

console.log(`Raw status-color Tailwind classes: ${total}/${allowed} baseline.`);
