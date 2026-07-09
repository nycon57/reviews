interface SearchParamsLike {
  get(name: string): string | null;
}

function parseHref(href: string) {
  const url = new URL(href, "https://repwell.local");
  return {
    pathname: url.pathname,
    searchParams: url.searchParams,
  };
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
  const target = parseHref(href);
  const hasTargetSearch = Array.from(target.searchParams.keys()).length > 0;

  if (hasTargetSearch) {
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

function hrefSpecificity(href: string): number {
  const target = parseHref(href);
  const searchParamCount = Array.from(target.searchParams.keys()).length;
  return target.pathname.length + searchParamCount * 1000;
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

  const currentSpecificity = hrefSpecificity(href);

  return !allHrefs.some((candidate) => {
    if (candidate === href) {
      return false;
    }

    return (
      hrefMatchesCurrent(candidate, currentPathname, currentSearchParams) &&
      hrefSpecificity(candidate) > currentSpecificity
    );
  });
}
