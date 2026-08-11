import { Component, lazy, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
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

beforeEach(() => {
  window.sessionStorage.clear();
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
  it('shows a loading indicator while the route chunk is still downloading', () => {
    // A dynamic import that never settles == a chunk still in flight.
    const PendingPage = lazy(() => new Promise<{ default: () => ReactNode }>(() => {}));
    renderBoundaryWith(<PendingPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
    expect(reload).toHaveBeenCalledTimes(1);
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
