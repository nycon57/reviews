#!/usr/bin/env node
/**
 * Baseline-gated anti-slop lint.
 *
 * Runs oxlint with the anti-slop plugin and compares finding counts per
 * (file, rule) against .anti-slop-baseline.json. New findings fail the gate;
 * pre-existing debt in the baseline does not. The baseline only changes via
 * an explicit `--update` after the new counts have been reviewed — never
 * update it to absorb findings your own change introduced.
 *
 * Usage:
 *   node scripts/anti-slop-gate.mjs            # gate (used by npm run lint:slop)
 *   node scripts/anti-slop-gate.mjs --update   # rewrite baseline to current state
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(repoRoot, ".anti-slop-baseline.json");
const update = process.argv.includes("--update");

const nodeOptions = [process.env.NODE_OPTIONS, "--experimental-strip-types"]
  .filter(Boolean)
  .join(" ");

let stdout;
try {
  stdout = execFileSync("npx", ["oxlint", "-c", ".oxlintrc.json", "--format", "json", "src"], {
    cwd: repoRoot,
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
} catch (error) {
  // oxlint exits non-zero when it finds errors; the JSON report is still on stdout.
  if (!error.stdout) {
    console.error("anti-slop: oxlint failed to run:", error.message);
    process.exit(2);
  }
  stdout = error.stdout;
}

let report;
try {
  report = JSON.parse(stdout);
} catch {
  console.error("anti-slop: could not parse oxlint JSON output");
  console.error(String(stdout).slice(0, 2000));
  process.exit(2);
}

const diagnostics = (report.diagnostics ?? []).filter((d) =>
  String(d.code ?? "").startsWith("anti-slop(")
);

const counts = new Map();
const linesByKey = new Map();
for (const d of diagnostics) {
  const key = `${d.filename}|${d.code}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  const line = d.labels?.[0]?.span?.line;
  if (line !== undefined) {
    const lines = linesByKey.get(key) ?? [];
    lines.push(line);
    linesByKey.set(key, lines);
  }
}

const current = Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
const total = diagnostics.length;

if (update) {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2) + "\n");
  console.log(`anti-slop: baseline updated — ${total} findings across ${counts.size} (file, rule) pairs`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`anti-slop: no baseline at ${baselinePath}. Run: node scripts/anti-slop-gate.mjs --update`);
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

let newFindings = 0;
let improved = 0;
for (const [key, count] of Object.entries(current)) {
  const allowed = baseline[key] ?? 0;
  if (count > allowed) {
    newFindings += count - allowed;
    const [file, code] = key.split("|");
    const lines = (linesByKey.get(key) ?? []).join(", ");
    console.error(
      `NEW ${code} in ${file}: ${count} found, baseline allows ${allowed} (lines: ${lines})`
    );
  } else if (count < allowed) {
    improved += allowed - count;
  }
}
for (const key of Object.keys(baseline)) {
  if (!(key in current)) improved += baseline[key];
}

if (newFindings > 0) {
  console.error(
    `\nanti-slop: FAIL — ${newFindings} new finding(s) vs baseline. Fix them (do not update the baseline to absorb your own findings).`
  );
  process.exit(1);
}

console.log(
  `anti-slop: pass — ${total} baselined findings remain` +
    (improved > 0
      ? `; ${improved} finding(s) cleared vs baseline. Tighten with: node scripts/anti-slop-gate.mjs --update`
      : "")
);
