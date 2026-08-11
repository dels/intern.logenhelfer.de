import { isValidElement } from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, Navigate, RouterProvider, type RouteObject } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { setAccessToken } from './api/token';
import { routes } from './routes';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import ImpressumHelpLayout from './layouts/ImpressumHelpLayout';
import LazyRouteBoundary from './layouts/LazyRouteBoundary';
import RequireAuth from './auth/RequireAuth';
import DashboardPage from './pages/DashboardPage';
import LandingResolver from './pages/LandingResolver';
import LoginPage from './pages/LoginPage';
import './i18n';

// Route-table integration checks that specifically guard the structure
// introduced by route-level code splitting: every lazy page now sits under
// a pathless <LazyRouteBoundary/> wrapper route nested inside its layout,
// rather than being a direct child of that layout. Path matching and route
// ranking must be unaffected by that extra nesting level - in particular
// the catch-all `*` and the /account/security redirect, both of which are
// sensitive to how they rank against their siblings.

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', gdpr_accepted: true };
const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: {} })),
  http.get('/api/v1/categories', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/announcements', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/members', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/mfa/methods', () => HttpResponse.json({ methods: [] })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// See AppShell.test.tsx's identical note: AuthProvider's cold-boot
// bootstrap refreshes before calling /me when no token is in memory, and
// there is no /session/refresh handler here.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthProvider><RouterProvider router={router} /></AuthProvider>
    </QueryClientProvider>,
  );
}

it('renders a lazily-imported page through the Suspense boundary', async () => {
  renderAt('/members');
  expect(await screen.findByRole('heading', { name: 'Mitglieder' })).toBeInTheDocument();
});

it('renders the shell alongside a lazy page', async () => {
  renderAt('/members');
  // Note this does NOT prove the Suspense boundary is nested under AppShell
  // rather than at the route table's root: findByRole retries, so a shell
  // that was torn down and remounted would satisfy it too. The structural
  // assertions in the describe block below are what actually guard
  // placement.
  expect(await screen.findByRole('link', { name: 'Übersicht' })).toBeInTheDocument();
});

it('still matches the catch-all 404 route for an unknown in-app URL', async () => {
  renderAt('/definitely-not-a-real-page');
  expect(await screen.findByRole('heading', { name: 'Seite nicht gefunden' })).toBeInTheDocument();
});

it('does not let the catch-all shadow a real route that follows it in the table', async () => {
  renderAt('/account');
  expect(await screen.findByRole('heading', { name: 'Konto' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Seite nicht gefunden' })).not.toBeInTheDocument();
});

it('still redirects the retired /account/security URL to /account', async () => {
  renderAt('/account/security');
  expect(await screen.findByRole('heading', { name: 'Konto' })).toBeInTheDocument();
});

// These assertions read the exported `routes` array directly rather than
// rendering. That is deliberate: the properties below are structural, and a
// render-based test cannot see them - React's async rendering means any
// "did the shell stay mounted?" assertion is satisfied equally by a shell
// that was torn down and remounted. Reading the route table is
// deterministic and independent of timing.
describe('route table structure', () => {
  const LAYOUTS = new Map<unknown, string>([
    [AppShell, 'AppShell'],
    [PublicLayout, 'PublicLayout'],
    [ImpressumHelpLayout, 'ImpressumHelpLayout'],
  ]);

  // Everything that is allowed to ship inside the entry chunk. Keep in sync
  // with routes.tsx's eager import block (and CLAUDE.md's "Route-level code
  // splitting" section) - the whole point of the split is that this list
  // stays short.
  const EAGER_ALLOWLIST = new Map<unknown, string>([
    [LandingResolver, 'LandingResolver'],
    [LoginPage, 'LoginPage'],
    [DashboardPage, 'DashboardPage'],
    [AppShell, 'AppShell'],
    [RequireAuth, 'RequireAuth'],
    [PublicLayout, 'PublicLayout'],
    [ImpressumHelpLayout, 'ImpressumHelpLayout'],
    [LazyRouteBoundary, 'LazyRouteBoundary'],
    [Navigate, 'Navigate'],
  ]);

  function elementTypeOf(route: RouteObject): unknown {
    return isValidElement(route.element) ? route.element.type : undefined;
  }

  function isLazyComponent(type: unknown): boolean {
    return (
      typeof type === 'object' &&
      type !== null &&
      (type as { $$typeof?: symbol }).$$typeof === Symbol.for('react.lazy')
    );
  }

  type Visited = { route: RouteObject; ancestorTypes: unknown[] };

  function walk(tree: RouteObject[], ancestorTypes: unknown[] = []): Visited[] {
    return tree.flatMap((route) => [
      { route, ancestorTypes },
      ...walk(route.children ?? [], [...ancestorTypes, elementTypeOf(route)]),
    ]);
  }

  const allRoutes = walk(routes);

  it('mounts every LazyRouteBoundary inside a layout, never at the top level', () => {
    const boundaries = allRoutes.filter(({ route }) => elementTypeOf(route) === LazyRouteBoundary);

    // One per layout group: PublicLayout, ImpressumHelpLayout, AppShell.
    expect(boundaries).toHaveLength(3);

    // The discriminating assertion: a boundary hoisted to the route table's
    // root would have no layout ancestor, so the whole shell would unmount
    // and flash back in on every navigation to a not-yet-loaded page.
    const layoutsWrappingABoundary = boundaries.map(
      ({ ancestorTypes }) => ancestorTypes.map((type) => LAYOUTS.get(type)).filter(Boolean),
    );
    expect(layoutsWrappingABoundary).toEqual([
      ['PublicLayout'],
      ['ImpressumHelpLayout'],
      ['AppShell'],
    ]);
    expect(routes.map(elementTypeOf)).not.toContain(LazyRouteBoundary);
  });

  it('puts every lazily-imported page under a LazyRouteBoundary', () => {
    // A lazy route mounted outside a Suspense boundary throws "A component
    // suspended while rendering, but no fallback UI was specified" - a crash
    // on a page nothing may have a test for.
    const lazyRoutes = allRoutes.filter(({ route }) => isLazyComponent(elementTypeOf(route)));

    expect(lazyRoutes.length).toBeGreaterThan(50);
    const unwrapped = lazyRoutes.filter(
      ({ ancestorTypes }) => !ancestorTypes.includes(LazyRouteBoundary),
    );
    expect(unwrapped.map(({ route }) => route.path)).toEqual([]);
  });

  it('keeps the eager (entry-chunk) route components limited to the documented set', () => {
    // Guards the silent-breakage case CLAUDE.md calls out: a static import
    // added to routes.tsx drags that page's whole dependency graph
    // (@mui/x-data-grid, dompurify, ...) back into the entry chunk, and no
    // behavioural test would fail.
    const eager = allRoutes
      .map(({ route }) => elementTypeOf(route))
      .filter((type) => type !== undefined && !isLazyComponent(type));

    const unexpected = eager.filter((type) => !EAGER_ALLOWLIST.has(type));
    expect(unexpected).toEqual([]);
  });
});
