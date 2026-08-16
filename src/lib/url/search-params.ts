type SearchParamsLike = Pick<URLSearchParams, "toString">;

interface RouterLike {
  push(href: string, options?: { scroll?: boolean }): void;
}

interface PushMergedSearchParamsOptions {
  basePath: string;
  defaults?: Record<string, string | null | undefined>;
  scroll?: boolean;
}

export function pushMergedSearchParams(
  router: RouterLike,
  searchParams: SearchParamsLike,
  updates: Record<string, string | null | undefined>,
  { basePath, defaults = {}, scroll = false }: PushMergedSearchParamsOptions
): void {
  const params = new URLSearchParams(searchParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (!value || value === defaults[key]) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  router.push(query ? `${basePath}?${query}` : basePath, { scroll });
}
