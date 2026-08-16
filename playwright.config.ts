import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT || "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

/**
 * Playwright configuration for RepWell E2E tests.
 *
 * Projects:
 * - auth-setup: Logs in as each seed user, saves storageState
 * - smoke-public: Marketing + public pages (no auth)
 * - smoke-dashboard-individual: Dashboard as individual-basic
 * - smoke-dashboard-enterprise: Dashboard as enterprise-admin
 * - access-control: Role-based redirect verification
 * - widgets: Existing widget embed tests (mocked APIs)
 * - interactions: Per-feature interaction tests
 * - golden-flows: Real UI money-path coverage with only external boundary mocks
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // ── Auth Setup ──────────────────────────────────────────
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Smoke Tests (no auth) ──────────────────────────────
    {
      name: "smoke-public",
      testMatch: /smoke\/(marketing|public)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Smoke Tests (authenticated) ────────────────────────
    {
      name: "smoke-dashboard-individual",
      testMatch: /smoke\/dashboard-individual\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "smoke-dashboard-enterprise",
      testMatch: /smoke\/dashboard-enterprise\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Access Control ─────────────────────────────────────
    {
      name: "access-control",
      testMatch: /smoke\/access-control\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Interaction Tests ──────────────────────────────────
    {
      name: "interactions",
      testMatch: /interactions\/.*\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Widget Tests (existing, mocked APIs) ───────────────
    {
      name: "widgets",
      testMatch: /widgets\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Golden Flow Tests ──────────────────────────────────
    {
      name: "golden-flows",
      testMatch: /golden-flows\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Performance Tests ──────────────────────────────────
    {
      name: "performance",
      testMatch: /performance\/.*\.test\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
