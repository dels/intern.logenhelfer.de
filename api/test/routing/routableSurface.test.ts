import { describe, expect, it } from 'vitest';

import { BARE_ROUTES, ROUTE_MOUNTS } from '../../src/app.js';

// Port of rails-app/spec/routing/routable_surface_spec.rb's intent: a
// regression guard, not a judgment about what SHOULD be routable. Any future
// change that adds, removes, or re-mounts a router must touch app.ts's
// ROUTE_MOUNTS/BARE_ROUTES tables (and, since this test imports them
// directly rather than re-deriving its own copy, this file) consciously - it
// can never happen as a silent side effect of an unrelated change.
//
// Unlike the Rails version, there's no separate "mounted Rack app" category
// to snapshot here (Resque::Server, Sprockets, ActionCable, etc. are all
// Rails-framework/legacy-app concerns with no equivalent in this API-only
// Express service) - ROUTE_MOUNTS + BARE_ROUTES together are this app's
// entire routable surface.

const ALLOWED_MOUNT_NAMES = [
  'academic_titles',
  'announcements',
  'app_config',
  'app_logo',
  'attached_files',
  'categories',
  'directories',
  'districts',
  'events',
  'external_event_ics_sources',
  'external_events',
  'lodges',
  'me',
  'members',
  'mfa',
  'mfa_challenge',
  'officers',
  'password_reset',
  'public',
  'roles',
  'seekers',
  'session',
  'statistics',
].sort();

const ALLOWED_BARE_ROUTES = [
  { method: 'GET', path: '/api/v1/health' },
  { method: 'GET', path: '/healthz' },
].sort((a, b) => a.path.localeCompare(b.path));

describe('routable surface', () => {
  it('only mounts a known, reviewed set of resource routers', () => {
    const actual = [...ROUTE_MOUNTS.map((m) => m.name)].sort();
    expect(actual).toEqual(ALLOWED_MOUNT_NAMES);
  });

  it('mounts every resource router at its expected base path', () => {
    const actual = Object.fromEntries(ROUTE_MOUNTS.map((m) => [m.name, m.path]));
    expect(actual).toEqual({
      session: '/api/v1',
      me: '/api/v1',
      password_reset: '/api/v1',
      members: '/api/v1/members',
      events: '/api/v1/events',
      external_events: '/api/v1/external_events',
      external_event_ics_sources: '/api/v1/external_event_ics_sources',
      seekers: '/api/v1/seekers',
      roles: '/api/v1/roles',
      categories: '/api/v1/categories',
      directories: '/api/v1/directories',
      attached_files: '/api/v1/attached_files',
      districts: '/api/v1/districts',
      academic_titles: '/api/v1/academic_titles',
      lodges: '/api/v1/lodges',
      officers: '/api/v1/officers',
      announcements: '/api/v1/announcements',
      statistics: '/api/v1/statistics',
      public: '/api/v1/public',
      app_config: '/api/v1/app_config',
      app_logo: '/api/v1/app_logo',
      mfa_challenge: '/api/v1/mfa/challenge',
      mfa: '/api/v1/mfa',
    });
  });

  it('only exposes a known, reviewed set of bare-path routes outside the resource mounts', () => {
    const actual = [...BARE_ROUTES].sort((a, b) => a.path.localeCompare(b.path));
    expect(actual).toEqual(ALLOWED_BARE_ROUTES);
  });

  it('has no duplicate router names and no duplicate (method-agnostic) bare-path entries', () => {
    const names = ROUTE_MOUNTS.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);

    const barePaths = BARE_ROUTES.map((r) => `${r.method} ${r.path}`);
    expect(new Set(barePaths).size).toBe(barePaths.length);
  });

  it('registers mfa_challenge before mfa (its overlapping-prefix auth gate would otherwise 401 every real challenge request)', () => {
    const names = ROUTE_MOUNTS.map((m) => m.name);
    expect(names.indexOf('mfa_challenge')).toBeLessThan(names.indexOf('mfa'));
  });
});
