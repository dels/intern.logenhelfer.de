import { describe, expect, it } from 'vitest';

import { buildListResponse, parsePageParams } from '../../src/lib/pagination.js';

// Pure functions - no DB needed. Ports the page/per_page parsing block
// shared by every paginated Rails index action (see pagination.ts's header
// comment for the controllers it mirrors): `page = [params.fetch(:page,
// 0).to_i, 0].max`, `per_page = params.fetch(:per_page, 25).to_i.clamp(1,
// 100)`.
describe('parsePageParams', () => {
  it('defaults to page 0 / per_page 25 when the query is empty', () => {
    expect(parsePageParams({})).toEqual({ page: 0, perPage: 25 });
  });

  it('defaults the same way when query is undefined/null', () => {
    expect(parsePageParams(undefined)).toEqual({ page: 0, perPage: 25 });
    expect(parsePageParams(null)).toEqual({ page: 0, perPage: 25 });
  });

  it('parses numeric-looking query string values', () => {
    expect(parsePageParams({ page: '3', per_page: '50' })).toEqual({ page: 3, perPage: 50 });
  });

  it('floors a negative page at 0 (Ruby `[x, 0].max`)', () => {
    expect(parsePageParams({ page: '-5' })).toEqual({ page: 0, perPage: 25 });
  });

  it('clamps per_page below 1 up to 1', () => {
    expect(parsePageParams({ per_page: '0' })).toEqual({ page: 0, perPage: 1 });
    expect(parsePageParams({ per_page: '-10' })).toEqual({ page: 0, perPage: 1 });
  });

  it('clamps per_page above 100 down to 100', () => {
    expect(parsePageParams({ per_page: '250' })).toEqual({ page: 0, perPage: 100 });
  });

  it('mirrors Ruby String#to_i for garbage input: leading digits parsed, non-numeric falls back to 0', () => {
    // "abc".to_i == 0 -> per_page 0 then clamped to 1; "12abc".to_i == 12.
    expect(parsePageParams({ page: 'abc', per_page: 'abc' })).toEqual({ page: 0, perPage: 1 });
    expect(parsePageParams({ page: '12abc', per_page: '7abc' })).toEqual({ page: 12, perPage: 7 });
  });

  it('treats an empty string the same as Ruby\'s "".to_i == 0', () => {
    expect(parsePageParams({ page: '', per_page: '' })).toEqual({ page: 0, perPage: 1 });
  });

  it('accepts already-numeric values (e.g. a direct unit-test call site, not just query strings)', () => {
    expect(parsePageParams({ page: 2, per_page: 10 })).toEqual({ page: 2, perPage: 10 });
  });
});

describe('buildListResponse', () => {
  it('shapes rows/row_count exactly like every Rails index action', () => {
    expect(buildListResponse([{ id: 1 }, { id: 2 }], 2)).toEqual({ rows: [{ id: 1 }, { id: 2 }], row_count: 2 });
  });

  it('allows row_count to differ from rows.length (paginated slice vs. total count)', () => {
    expect(buildListResponse([{ id: 1 }], 42)).toEqual({ rows: [{ id: 1 }], row_count: 42 });
  });

  it('handles an empty page', () => {
    expect(buildListResponse([], 0)).toEqual({ rows: [], row_count: 0 });
  });
});
