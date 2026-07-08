const { readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const roots = [".", "creates", "triggers", "utils", "test"];
const files = [];

for (const root of roots) {
  for (const entry of readdirSync(join(process.cwd(), root))) {
    const path = join(process.cwd(), root, entry);
    if (statSync(path).isFile() && path.endsWith(".js")) {
      files.push(path);
    }
  }
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
