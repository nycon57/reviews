import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import expected from "./access-matrix.expected.json";

interface NavRoute {
  route: string;
  title: string;
  permission: string;
}

interface MiddlewareRoute {
  route: string;
  guards: string[];
}

interface AccessInventory {
  navRoutes: NavRoute[];
  middlewareRoutes: MiddlewareRoute[];
  docRoutes: string[];
}

const REPO_ROOT = process.cwd();

function readRepoFile(...segments: string[]): string {
  return readFileSync(path.join(REPO_ROOT, ...segments), "utf8");
}

function getNavRoutes(): NavRoute[] {
  const source = readRepoFile("src", "lib", "nav", "config.ts");
  const routes: NavRoute[] = [];
  const itemRegex =
    /\{\s*title:\s*"([^"]+)",\s*href:\s*"([^"]+)",[\s\S]*?permission:\s*PERMISSIONS\.([A-Z_]+),?[\s\S]*?\}/g;

  for (const match of source.matchAll(itemRegex)) {
    routes.push({
      title: match[1],
      route: match[2],
      permission: match[3],
    });
  }

  return routes;
}

function getMiddlewareRoutes(): MiddlewareRoute[] {
  const source = readRepoFile("src", "proxy.ts");
  const tableMatch = source.match(
    /const roleProtectedRoutes: RouteConfig\[\] = \[([\s\S]*?)\];/
  );

  if (!tableMatch) {
    throw new Error("Could not find roleProtectedRoutes in src/proxy.ts");
  }

  const routes: MiddlewareRoute[] = [];
  const routeRegex = /\{([^{}]*path:\s*"[^"]+"[^{}]*)\}/g;

  for (const match of tableMatch[1].matchAll(routeRegex)) {
    const block = match[1];
    const route = block.match(/path:\s*"([^"]+)"/)?.[1];
    if (!route) continue;

    const guards: string[] = [];
    if (/requiresPlatformAdmin:\s*true/.test(block)) guards.push("requiresPlatformAdmin");
    if (/requiresEnterprise:\s*true/.test(block)) guards.push("requiresEnterprise");
    if (/requiresEnterpriseAdmin:\s*true/.test(block)) guards.push("requiresEnterpriseAdmin");
    if (/requiresOrgAdmin:\s*true/.test(block)) guards.push("requiresOrgAdmin");

    const allowedRoles = block.match(/allowedRoles:\s*\[([^\]]+)\]/)?.[1];
    if (allowedRoles) {
      guards.push(
        `allowedRoles:${allowedRoles
          .split(",")
          .map((role) => role.replaceAll(/["\s]/g, ""))
          .filter(Boolean)
          .join(",")}`
      );
    }

    const minTier = block.match(/minTier:\s*"([^"]+)"/)?.[1];
    if (minTier) guards.push(`minTier:${minTier}`);

    routes.push({ route, guards });
  }

  return routes;
}

function getDocumentedRoutes(): string[] {
  return readRepoFile("docs", "ACCESS_MATRIX.md")
    .split("\n")
    .filter((line) => line.startsWith("| /"))
    .map((line) => line.split("|")[1].trim());
}

function getAccessInventory(): AccessInventory {
  return {
    navRoutes: getNavRoutes(),
    middlewareRoutes: getMiddlewareRoutes(),
    docRoutes: getDocumentedRoutes(),
  };
}

describe("access matrix drift guard", () => {
  const actual = getAccessInventory();

  it("matches the checked-in access inventory snapshot", () => {
    expect(
      actual,
      "Access inventory changed. Update docs/ACCESS_MATRIX.md from code, then refresh " +
        "src/lib/__tests__/access-matrix.expected.json with the generated inventory."
    ).toEqual(expected);
  });

  it("documents every nav route in ACCESS_MATRIX.md", () => {
    const docRoutes = new Set(actual.docRoutes);
    const missing = actual.navRoutes
      .map((route) => route.route)
      .filter((route) => !docRoutes.has(route));

    expect(
      missing,
      `These nav routes are missing from docs/ACCESS_MATRIX.md: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("documents every middleware route in ACCESS_MATRIX.md", () => {
    const docRoutes = new Set(actual.docRoutes);
    const missing = actual.middlewareRoutes
      .map((route) => route.route)
      .filter((route) => !docRoutes.has(route));

    expect(
      missing,
      `These proxy route-table entries are missing from docs/ACCESS_MATRIX.md: ${missing.join(", ")}`
    ).toEqual([]);
  });
});
