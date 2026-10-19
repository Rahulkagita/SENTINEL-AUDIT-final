/**
 * Pagination contract helpers.
 *
 * The UI counts pages from 1 — "Page 1" is the first page a user sees.
 * Every list endpoint (Spring Data `PageRequest` on `/api/assets`,
 * `/api/audit/logs`, `/api/audit/timeline`, `/api/versions`, and the
 * local mock routes) counts pages from 0 — `page=0` is the first page.
 *
 * The translation happens exactly once, here in the service layer, so no
 * caller has to remember the difference. `toApiPage` never blindly subtracts:
 * a value that is already zero-based (0 or negative/invalid) stays on page 0,
 * so double-translating a request is impossible.
 */

/** One-based UI page -> zero-based API page. */
export function toApiPage(page: number | undefined | null): number | undefined {
  if (page === undefined || page === null || !Number.isFinite(page)) {
    return undefined;
  }
  // Already zero-based (or invalid) -> first backend page, never page -1.
  if (page <= 0) return 0;
  // One-based UI page -> zero-based API page (1 -> 0, 2 -> 1, ...).
  return Math.floor(page) - 1;
}

/**
 * Builds the query string for a list endpoint, keeping only the parameters
 * that endpoint actually supports so the client never sends pretend filters
 * the backend would silently ignore.
 *
 * - `page` is translated to the zero-based API contract via {@link toApiPage}.
 * - `undefined`, `null` and blank-string values are dropped.
 *
 * @param params      caller params (one-based page, UI conventions)
 * @param allowedKeys the exact parameter names the endpoint accepts
 * @returns the params to send, or `undefined` when there is nothing to send
 */
export function toApiListParams<T extends object>(
  params: T | undefined,
  allowedKeys: readonly string[],
): Record<string, string | number> | undefined {
  if (!params) return undefined;

  const source = params as Record<string, unknown>;
  const out: Record<string, string | number> = {};

  for (const key of allowedKeys) {
    if (key === 'page') {
      const apiPage = toApiPage(source.page as number | undefined);
      if (apiPage !== undefined) out.page = apiPage;
      continue;
    }

    const value = source[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      if (value.trim() === '') continue;
      out[key] = value;
      continue;
    }
    if (typeof value === 'number') {
      out[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      out[key] = String(value);
      continue;
    }
    // Objects (e.g. the old `filter: { operation }` shape) are never sent:
    // serializing them produced `filter=[object Object]`, which the backend
    // ignored while the UI pretended to filter.
  }

  return Object.keys(out).length > 0 ? out : undefined;
}
