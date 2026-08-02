/**
 * Shared pagination helpers, ported from the identical `page`/`per_page`
 * parsing block repeated across rails-app/app/controllers/api/v1/*.rb, e.g.:
 *
 *   page     = [params.fetch(:page, 0).to_i, 0].max
 *   per_page = params.fetch(:per_page, 25).to_i.clamp(1, 100)
 *   render json: { rows: paged.map { ... }, row_count: scope.count }
 *
 * (see announcements_controller.rb, categories_controller.rb,
 * events_controller.rb, lodges_controller.rb, officers_controller.rb,
 * seekers_controller.rb, statistics_controller.rb, members_controller.rb,
 * directories_controller.rb - all agree on `page` default 0/floor 0 and
 * `per_page` default 25/clamp 1..100).
 *
 * `page` is 0-indexed (matches Rails' `.max(page, 0)`, not Kaminari's
 * internal 1-indexed `.page(page + 1)` - callers that hand `page` to
 * Kaminari-backed Prisma queries must still do that `+ 1` themselves, same
 * as the Rails controllers do).
 */

const DEFAULT_PER_PAGE = 25;
const MIN_PER_PAGE = 1;
const MAX_PER_PAGE = 100;
const DEFAULT_PAGE = 0;

export interface PageParams {
  page: number;
  perPage: number;
}

/**
 * Port of Ruby's `String#to_i` / `Integer#to_i` as used by
 * `params.fetch(:x, default).to_i` - parses a leading (optionally signed)
 * run of digits and truncates the rest, falling back to 0 when nothing
 * matches (mirrors `"abc".to_i == 0`, `"12abc".to_i == 12`,
 * `"".to_i == 0`). Applied uniformly whether the raw query value is a
 * string (from an actual query param) or a number (from a default/test
 * call site) so this helper's behavior matches Ruby's regardless of how
 * it's invoked from TypeScript.
 */
function rubyToI(value: unknown): number {
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  const match = /^\s*[-+]?\d+/.exec(String(value));
  return match ? Number.parseInt(match[0], 10) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Port of the `page`/`per_page` parsing block shared by every paginated
 * Rails index action (see file header). `query` is expected to be an
 * Express `req.query`-shaped object (string | string[] | undefined values),
 * but anything Ruby's `#to_i` could coerce is accepted.
 */
export function parsePageParams(query: Record<string, unknown> | undefined | null): PageParams {
  const raw = query ?? {};

  const page = Math.max(rubyToI(raw.page ?? DEFAULT_PAGE), 0);
  const perPage = clamp(rubyToI(raw.per_page ?? DEFAULT_PER_PAGE), MIN_PER_PAGE, MAX_PER_PAGE);

  return { page, perPage };
}

export interface ListResponse<T> {
  rows: T[];
  row_count: number;
}

/**
 * Port of the `render json: { rows: ..., row_count: ... }` shape every
 * paginated Rails index action returns.
 */
export function buildListResponse<T>(rows: T[], rowCount: number): ListResponse<T> {
  return { rows, row_count: rowCount };
}
