export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
}

function invalid<T>(message: string): ValidationResult<T> {
  return { ok: false, message };
}

function parseInteger(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number
): ValidationResult<number> {
  const raw = searchParams.get(name);
  if (raw === null || raw === "") return { ok: true, value: defaultValue };

  const value = Number(raw);
  if (!Number.isInteger(value)) {
    return invalid(`${name} must be an integer`);
  }

  return { ok: true, value };
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  options: { maxPerPage: number; defaultPerPage?: number } = { maxPerPage: 100 }
): ValidationResult<PaginationParams> {
  const pageResult = parseInteger(searchParams, "page", 1);
  if (!pageResult.ok) return pageResult;
  if (pageResult.value < 1) return invalid("page must be greater than or equal to 1");

  const perPageResult = parseInteger(
    searchParams,
    "per_page",
    options.defaultPerPage ?? 20
  );
  if (!perPageResult.ok) return perPageResult;
  if (perPageResult.value < 1) {
    return invalid("per_page must be greater than or equal to 1");
  }
  if (perPageResult.value > options.maxPerPage) {
    return invalid(`per_page must be less than or equal to ${options.maxPerPage}`);
  }

  return {
    ok: true,
    value: {
      page: pageResult.value,
      perPage: perPageResult.value,
      offset: (pageResult.value - 1) * perPageResult.value,
    },
  };
}

export function parseRatingParam(
  searchParams: URLSearchParams,
  name: string
): ValidationResult<number | undefined> {
  const raw = searchParams.get(name);
  if (raw === null || raw === "") return { ok: true, value: undefined };

  const value = Number(raw);
  if (!Number.isFinite(value)) return invalid(`${name} must be a number`);
  if (value < 1 || value > 5) return invalid(`${name} must be between 1 and 5`);

  return { ok: true, value };
}

export function parseEnumParam<T extends string>(
  searchParams: URLSearchParams,
  name: string,
  allowedValues: readonly T[],
  defaultValue: T
): ValidationResult<T> {
  const raw = searchParams.get(name);
  if (raw === null || raw === "") return { ok: true, value: defaultValue };
  if (!allowedValues.includes(raw as T)) {
    return invalid(`${name} must be one of: ${allowedValues.join(", ")}`);
  }
  return { ok: true, value: raw as T };
}

export function parseDateParam(
  searchParams: URLSearchParams,
  name: string
): ValidationResult<string | undefined> {
  const raw = searchParams.get(name);
  if (raw === null || raw === "") return { ok: true, value: undefined };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return invalid(`${name} must be a date in YYYY-MM-DD format`);
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return invalid(`${name} must be a valid date`);
  }

  return { ok: true, value: raw };
}

export function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function paginateArray<T>(
  items: T[],
  pagination: PaginationParams
): { data: T[]; total: number } {
  return {
    data: items.slice(pagination.offset, pagination.offset + pagination.perPage),
    total: items.length,
  };
}
