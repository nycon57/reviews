import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Grill 11.3 — Cron registration guard.
 *
 * Every route under src/app/api/cron/ is a scheduled worker and MUST be either
 * (a) scheduled in vercel.json, or (b) explicitly listed in EXEMPT below with a
 * reason. This fails CI when someone adds a cron route but forgets to schedule
 * it (the "orphaned cron" class of bug), and when a vercel.json entry points at
 * a route directory that no longer exists.
 *
 * To intentionally leave a cron unscheduled, add it here with a reason.
 */
const EXEMPT: Record<string, string> = {
  // "<cron-dir-name>": "why this route is intentionally not scheduled",
};

const REPO_ROOT = process.cwd();
const CRON_DIR = path.join(REPO_ROOT, "src", "app", "api", "cron");

function getCronRouteNames(): string[] {
  return readdirSync(CRON_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      try {
        readFileSync(path.join(CRON_DIR, entry.name, "route.ts"), "utf8");
        return true;
      } catch {
        return false;
      }
    })
    .map((entry) => entry.name)
    .sort();
}

function getScheduledPaths(): string[] {
  const vercelConfig = JSON.parse(readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8")) as {
    crons?: Array<{ path: string; schedule: string }>;
  };
  return (vercelConfig.crons ?? []).map((c) => c.path);
}

const routeNameToPath = (name: string) => `/api/cron/${name}`;

describe("cron registration guard", () => {
  const routeNames = getCronRouteNames();
  const scheduledPaths = new Set(getScheduledPaths());

  it("discovers cron route directories", () => {
    expect(routeNames.length).toBeGreaterThan(0);
  });

  it("schedules every cron route (or exempts it with a reason)", () => {
    const unregistered = routeNames.filter(
      (name) => !scheduledPaths.has(routeNameToPath(name)) && !(name in EXEMPT)
    );

    expect(
      unregistered,
      `These cron routes are neither scheduled in vercel.json nor in the EXEMPT ` +
        `list: ${unregistered.join(", ")}. Add a schedule to vercel.json or an ` +
        `EXEMPT entry with a reason.`
    ).toEqual([]);
  });

  it("has no vercel.json cron pointing at a missing route", () => {
    const validPaths = new Set(routeNames.map(routeNameToPath));
    const stale = [...scheduledPaths].filter((p) => !validPaths.has(p));

    expect(
      stale,
      `vercel.json schedules paths with no matching route directory: ${stale.join(", ")}.`
    ).toEqual([]);
  });

  it("every EXEMPT entry carries a non-empty reason and maps to a real route", () => {
    for (const [name, reason] of Object.entries(EXEMPT)) {
      expect(reason.trim().length, `EXEMPT["${name}"] needs a reason`).toBeGreaterThan(0);
      expect(routeNames, `EXEMPT["${name}"] is not a real cron route`).toContain(name);
    }
  });

  it("every scheduled route actually runs work on the GET trigger", () => {
    // Vercel Cron invokes each path with a GET request. A route whose GET only
    // returns a health-check payload would be a silent no-op once scheduled, so
    // require GET to either delegate to POST or perform work (await something).
    const noOpGetRoutes: string[] = [];

    for (const name of routeNames) {
      if (!scheduledPaths.has(routeNameToPath(name))) continue;

      const source = readFileSync(path.join(CRON_DIR, name, "route.ts"), "utf8");
      const getMatch = source.match(/export async function GET[\s\S]*?\n}\n/);
      const getBody = getMatch?.[0] ?? "";
      const delegatesToPost = /return\s+POST\s*\(/.test(getBody);
      const doesWork = /\bawait\b/.test(getBody);

      if (!delegatesToPost && !doesWork) {
        noOpGetRoutes.push(name);
      }
    }

    expect(
      noOpGetRoutes,
      `These scheduled routes look like health-check-only GET handlers and would ` +
        `not do any work when triggered by Vercel Cron: ${noOpGetRoutes.join(", ")}.`
    ).toEqual([]);
  });

  it("every scheduled route records a cron heartbeat", () => {
    const missingHeartbeat = routeNames.filter((name) => {
      if (!scheduledPaths.has(routeNameToPath(name))) return false;

      const source = readFileSync(path.join(CRON_DIR, name, "route.ts"), "utf8");
      return !/\bwithCronHeartbeat\s*\(/.test(source);
    });

    expect(
      missingHeartbeat,
      `These scheduled routes do not call withCronHeartbeat: ${missingHeartbeat.join(", ")}.`
    ).toEqual([]);
  });

  it("every scheduled cron uses a well-formed 5-field cron expression", () => {
    const vercelConfig = JSON.parse(readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8")) as {
      crons?: Array<{ path: string; schedule: string }>;
    };

    for (const cron of vercelConfig.crons ?? []) {
      const fields = cron.schedule.trim().split(/\s+/);
      expect(fields.length, `${cron.path} has an invalid cron schedule: "${cron.schedule}"`).toBe(
        5
      );
    }
  });
});
