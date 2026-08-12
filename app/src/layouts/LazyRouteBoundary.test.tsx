import { Component, lazy, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import LazyRouteBoundary, { ChunkLoadErrorBoundary, isChunkLoadError } from './LazyRouteBoundary';
import '../i18n';

// Mirrors routes.tsx's shape: the boundary is a pathless wrapper route
// whose children are the lazy pages, so these tests exercise the real
// Outlet path rather than a hand-composed Suspense.
function renderBoundaryWith(element: ReactNode, reload?: () => void) {
  return render(
    <MemoryRouter initialEntries={['/lazy']}>
      <Routes>
        <Route element={<LazyRouteBoundary reload={reload} />}>
          <Route path="/lazy" element={element} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** A chunk-load failure exactly as Vite/Rollup surfaces it in Chrome. */
function chunkLoadError() {
  return new TypeError('Failed to fetch dynamically imported module: https://example.test/assets/MembersListPage-a1b2c3d4.js');
}

/**
 * Installs a fake `navigator.serviceWorker` for one test.
 *
 * jsdom has no ServiceWorkerContainer at all, so by default these tests
 * exercise the "no service worker" path (which is also dev/test reality).
 * Production always has one, and the reload only recovers if that stale SW
 * is unregistered first - hence this.
 */
function mockServiceWorker(getRegistration: () => Promise<{ unregister: () => Promise<boolean> } | undefined>) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { getRegistration },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  // Only ever defined by mockServiceWorker - jsdom itself ships none, so
  // deleting unconditionally restores the default (absent) state.
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

describe('isChunkLoadError', () => {
  it.each([
    ['Vite/Chrome', new TypeError('Failed to fetch dynamically imported module: /assets/Foo-1234.js')],
    ['Firefox', new TypeError('error loading dynamically imported module: /assets/Foo-1234.js')],
    ['Safari', new TypeError('Importing a module script failed.')],
    // Only reachable if /assets/ ever starts falling back to index.html
    // instead of 404ing a missing chunk - see isChunkLoadError's own note.
    ['html-served-instead-of-JS', new TypeError('Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".')],
    ['webpack-style named error', Object.assign(new Error('Loading chunk 42 failed.'), { name: 'ChunkLoadError' })],
  ])('recognises a %s chunk-load failure', (_label, error) => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it.each([
    ['an ordinary render error', new Error('Cannot read properties of undefined')],
    ['an API error', new Error('GET /api/v1/members failed with 500')],
    ['a non-error value', 'just a string'],
    ['null', null],
  ])('does not treat %s as a chunk-load failure', (_label, error) => {
    expect(isChunkLoadError(error)).toBe(false);
  });
});

describe('Suspense fallback', () => {
  it('shows a structural skeleton (not a bare spinner) while the route chunk is still downloading', () => {
    // A dynamic import that never settles == a chunk still in flight.
    const PendingPage = lazy(() => new Promise<{ default: () => ReactNode }>(() => {}));
    const { container } = renderBoundaryWith(<PendingPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('swaps the fallback for the page once the chunk resolves', async () => {
    const ResolvedPage = lazy(() => Promise.resolve({ default: () => <p>lazy page content</p> }));
    renderBoundaryWith(<ResolvedPage />);

    expect(await screen.findByText('lazy page content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('chunk-load error recovery', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs every error an error boundary catches. These tests throw
    // on purpose, so keep the output readable - but only swallow the
    // boundary noise, not the act() guard installed in test/setup.ts.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('reloads the page instead of crashing when the route chunk is gone', async () => {
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));
    renderBoundaryWith(<GonePage />, reload);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    // Still the loading indicator, never a broken/blank screen - the
    // navigation triggered by reload() is what ends this state.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not reload a second time when the chunk still fails right after a reload', async () => {
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));

    // First failure: reloads and records the attempt in sessionStorage.
    const first = renderBoundaryWith(<GonePage />, reload);
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    first.unmount();

    // Second failure inside the cooldown window - reloading again would be
    // an infinite reload loop, so the user gets a manual retry instead.
    const SecondGonePage = lazy(() => Promise.reject(chunkLoadError()));
    renderBoundaryWith(<SecondGonePage />, reload);

    expect(await screen.findByText(/Diese Seite konnte nicht geladen werden/)).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads (rather than merely resetting state) when the manual retry is used', async () => {
    // React.lazy caches the rejected import promise forever, so re-rendering
    // the same component would throw again immediately - only a real page
    // load can recover. Guard that the button does the former.
    window.sessionStorage.setItem('logenhelfer:lazy-chunk-reload-at', String(Date.now()));
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));
    renderBoundaryWith(<GonePage />, reload);

    await userEvent.click(await screen.findByRole('button', { name: 'Neu laden' }));
    // waitFor, not a bare assertion: the reload is now preceded by an async
    // service-worker teardown (see the describe block below).
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('re-throws an ordinary render error instead of hiding it behind the chunk-load UI', async () => {
    const reload = vi.fn();
    const caught: unknown[] = [];

    function Exploding(): ReactNode {
      throw new Error('something else broke');
    }

    class CatchAll extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError() { return { failed: true }; }
      componentDidCatch(error: unknown) { caught.push(error); }
      render() { return this.state.failed ? <p>outer boundary caught it</p> : this.props.children; }
    }

    render(
      <CatchAll>
        <ChunkLoadErrorBoundary reload={reload}>
          <Exploding />
        </ChunkLoadErrorBoundary>
      </CatchAll>,
    );

    expect(await screen.findByText('outer boundary caught it')).toBeInTheDocument();
    expect(caught.some((error) => error instanceof Error && error.message === 'something else broke')).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    expect(screen.queryByText(/Diese Seite konnte nicht geladen werden/)).not.toBeInTheDocument();
  });
});

describe('service-worker teardown before the automatic reload', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('unregisters the controlling service worker before reloading', async () => {
    // Without this the reload is answered out of the SW's precache: the same
    // stale index.html, naming the same missing chunks, failing again
    // immediately - and by then the cooldown has already been marked, so the
    // user lands in the give-up state instead of a recovered page.
    const order: string[] = [];
    const unregister = vi.fn(async () => {
      order.push('unregister');
      return true;
    });
    mockServiceWorker(async () => ({ unregister }));
    const reload = vi.fn(() => void order.push('reload'));
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));

    renderBoundaryWith(<GonePage />, reload);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['unregister', 'reload']);
  });

  it('still reloads when no service worker is registered', async () => {
    // getRegistration() resolves to undefined on a first-ever visit, or
    // after a previous recovery already unregistered it.
    const getRegistration = vi.fn(async () => undefined);
    mockServiceWorker(getRegistration);
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));

    renderBoundaryWith(<GonePage />, reload);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(getRegistration).toHaveBeenCalledTimes(1);
  });

  it('still reloads when the service-worker teardown rejects', async () => {
    // A reload that is maybe-stale still beats no reload at all - the
    // cooldown/manual-retry path picks it up if it did not help.
    mockServiceWorker(async () => {
      throw new Error('SecurityError: storage access denied');
    });
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));

    renderBoundaryWith(<GonePage />, reload);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('reloads exactly once even when the teardown never settles', async () => {
    // Guards the timeout race: an async reload path must not be able to
    // strand the user on the loading fallback forever.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const getRegistration = vi.fn(() => new Promise<undefined>(() => {}));
      mockServiceWorker(getRegistration);
      const reload = vi.fn();
      const GonePage = lazy(() => Promise.reject(chunkLoadError()));

      renderBoundaryWith(<GonePage />, reload);

      // Nothing yet: the teardown is still (permanently) in flight, and the
      // user is still looking at the loading fallback.
      await waitFor(() => expect(getRegistration).toHaveBeenCalledTimes(1));
      expect(reload).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(3_000);
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('navigating away from the give-up notice', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('renders the newly matched route instead of keeping the stale warning', async () => {
    // The boundary is a pathless wrapper INSIDE the layout, so the sidebar
    // stays clickable while the notice is up. If the boundary never cleared
    // its error state, those clicks would change the URL while this same
    // Alert kept occluding the Outlet - a dead end.
    window.sessionStorage.setItem('logenhelfer:lazy-chunk-reload-at', String(Date.now()));
    const reload = vi.fn();
    const GonePage = lazy(() => Promise.reject(chunkLoadError()));

    render(
      <MemoryRouter initialEntries={['/lazy']}>
        <Link to="/other">anderer Menuepunkt</Link>
        <Routes>
          <Route element={<LazyRouteBoundary reload={reload} />}>
            <Route path="/lazy" element={<GonePage />} />
            <Route path="/other" element={<p>other page content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Diese Seite konnte nicht geladen werden/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'anderer Menuepunkt' }));

    expect(await screen.findByText('other page content')).toBeInTheDocument();
    expect(screen.queryByText(/Diese Seite konnte nicht geladen werden/)).not.toBeInTheDocument();
    // No reload was needed to get unstuck.
    expect(reload).not.toHaveBeenCalled();
  });
});
