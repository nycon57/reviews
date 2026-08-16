import {
  parsePaginationParams,
  type PaginationParams,
  type ValidationResult,
} from "@/lib/api-v2";

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

export function parseWebMcpReviewsParams(
  searchParams: URLSearchParams
): ValidationResult<{
  pagination: PaginationParams;
  sortBy: "date_desc";
}> {
  const pagination = parsePaginationParams(searchParams, {
    maxPerPage: 10,
    defaultPerPage: 10,
  });
  if (!pagination.ok) return pagination;

  return ok({
    pagination: pagination.value,
    sortBy: "date_desc",
  });
}
