import { NAV_CONFIG } from "./config";

interface SearchParamsLike {
  get(name: string): string | null;
}

interface ParsedNavHref {
  pathname: string;
  searchParams: URLSearchParams;
  hasTargetSearch: boolean;
  specificity: number;
}

const STATIC_NAV_HREFS = [
  ...NAV_CONFIG.coreItems.map((item) => item.href),
  ...NAV_CONFIG.sections.flatMap((section) => section.items.map((item) => item.href)),
  ...NAV_CONFIG.bottomItems.map((item) => item.href),
];

const PARSED_NAV_HREFS = new Map<string, ParsedNavHref>(
  STATIC_NAV_HREFS.map((href) => [href, parseHref(href)])
);

function parseHref(href: string): ParsedNavHref {
  const url = new URL(href, "https://repwell.local");
  const searchParamCount = Array.from(url.searchParams.keys()).length;

  return {
    pathname: url.pathname,
    searchParams: url.searchParams,
    hasTargetSearch: searchParamCount > 0,
    specificity: url.pathname.length + searchParamCount * 1000,
  };
}

function getParsedHref(href: string): ParsedNavHref {
  const cached = PARSED_NAV_HREFS.get(href);
  if (cached) return cached;

  const parsed = parseHref(href);
  PARSED_NAV_HREFS.set(href, parsed);
  return parsed;
}

function searchParamsMatch(
  expected: URLSearchParams,
  current: SearchParamsLike
): boolean {
  for (const [key, value] of expected.entries()) {
    if (current.get(key) !== value) {
      return false;
    }
  }
  return true;
}

function hrefMatchesCurrent(
  href: string,
  currentPathname: string,
  currentSearchParams: SearchParamsLike
): boolean {
  const target = getParsedHref(href);

  if (target.hasTargetSearch) {
    return (
      currentPathname === target.pathname &&
      searchParamsMatch(target.searchParams, currentSearchParams)
    );
  }

  if (target.pathname === "/dashboard") {
    return currentPathname === "/dashboard";
  }

  return (
    currentPathname === target.pathname ||
    currentPathname.startsWith(`${target.pathname}/`)
  );
}

export function isNavHrefActive(
  href: string,
  currentPathname: string,
  currentSearchParams: SearchParamsLike,
  allHrefs: string[] = []
): boolean {
  if (!hrefMatchesCurrent(href, currentPathname, currentSearchParams)) {
    return false;
  }

  const currentSpecificity = getParsedHref(href).specificity;

  return !allHrefs.some((candidate) => {
    if (candidate === href) {
      return false;
    }

    return (
      hrefMatchesCurrent(candidate, currentPathname, currentSearchParams) &&
      getParsedHref(candidate).specificity > currentSpecificity
    );
  });
}
