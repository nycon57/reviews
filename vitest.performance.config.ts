import { defineConfig } from "vitest/config";
import path from "path";

// Separate config for tests/performance/* — these need build artifacts
// (embed.min.js) and are excluded from the main unit-test config. CI's
// bundle-size job builds embed.js first, then runs vitest with this config.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/performance/embed-bundle-size.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
