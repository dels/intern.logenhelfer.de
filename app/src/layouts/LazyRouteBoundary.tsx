import { Component, Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// Route-level code-splitting boundary. Every lazily-imported page in
// routes.tsx renders through one of these (one per layout group), so the
// surrounding layout chrome - AppShell's sidebar/top nav, PublicLayout's
// header - stays mounted while the chunk for the next page is fetched.
// That's why this is a pathless wrapper route *inside* each layout rather
// than one boundary at the root of the route table: a root-level boundary
// would tear down the whole shell and flash it back in on every navigation
// to a not-yet-loaded page.
//
// Ordering matters: the error boundary must sit ABOVE <Suspense>, since
// Suspense only handles a *pending* promise - a dynamic import that
// *rejects* throws during render and is caught by an error boundary, never
// by Suspense.

// Key under which the timestamp of the last automatic chunk-error reload is
// recorded. sessionStorage (not localStorage) on purpose: the failure mode
// this guards against is a stale tab, so the budget should reset with the
// tab, not persist across browser restarts.
const RELOAD_MARKER_KEY = 'logenhelfer:lazy-chunk-reload-at';
// If a chunk load fails again within this window of an automatic reload,
// the reload evidently did not fix it (chunk genuinely gone, offline,
// broken deploy) - stop and show a manual retry instead of spinning in a
// reload loop.
const RELOAD_COOLDOWN_MS = 10_000;

/**
 * Whether an error thrown during render is a failed dynamic `import()` of a
 * hashed route chunk rather than an ordinary application error.
 *
 * The message shapes differ per browser and bundler; the ones below cover
 * Vite/Rollup's own wording (Chrome, Firefox and Safari each phrase it
 * differently) plus webpack's named `ChunkLoadError`, so this keeps working
 * if the bundler is ever swapped.
 *
 * `module script` matches deliberately loosely. WHICH error the browser
 * raises depends on what the server does with a request for a
 * no-longer-existing hashed chunk: today `app/nginx.conf.template`'s
 * `location ~* ^/assets/...` block declares no `try_files` of its own, so a
 * missing file 404s and browsers phrase it as a failure to *fetch* the
 * module. If that block ever grew an `index.html` fallback, the very same
 * request would instead return 200 with `text/html`, and browsers would
 * complain about the MIME type / module script instead. Matching both
 * shapes means a wording mismatch degrades to "reload and recover" rather
 * than to a blank page - returning false here re-throws, and there is no
 * error boundary above this one.
 */
// oxlint-disable-next-line react/only-export-components -- predicate belongs next to the boundary that uses it, fast-refresh-only concern
export function isChunkLoadError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false;
  if ((error as { name?: unknown }).name === 'ChunkLoadError') return true;
  const message = (error as { message?: unknown }).message;
  if (typeof message !== 'string') return false;
  return /dynamically imported module|module script/i.test(message);
}

function withinReloadCooldown(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_MARKER_KEY));
    return Number.isFinite(last) && last > 0 && Date.now() - last < RELOAD_COOLDOWN_MS;
  } catch {
    // Private-mode/blocked storage: no budget tracking available. Treat it
    // as "already reloaded once" rather than risking an unbounded reload
    // loop - the manual retry below still gets the user unstuck.
    return true;
  }
}

function markReloadAttempt(): void {
  try {
    window.sessionStorage.setItem(RELOAD_MARKER_KEY, String(Date.now()));
  } catch {
    // See withinReloadCooldown - nothing to do, the cooldown check already
    // fails closed when storage is unavailable.
  }
}

/** Suspense fallback for a route chunk that is still downloading. */
export function RouteFallback() {
  return (
    <Box
      role="status"
      aria-busy="true"
      sx={{ display: 'grid', placeItems: 'center', minHeight: 240, py: 6 }}
    >
      <CircularProgress />
    </Box>
  );
}

/**
 * Shown only when an automatic reload has already been attempted and the
 * chunk still would not load.
 *
 * The button reloads the page - it deliberately does NOT reset the error
 * boundary's state. React.lazy permanently caches a rejected import
 * promise, so re-rendering the same lazy component throws again
 * immediately; a "retry" that only clears error state would look correct
 * and fail instantly.
 */
function ChunkLoadErrorNotice({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={onReload}>
          {t('common.chunkError.action')}
        </Button>
      }
    >
      {t('common.chunkError.message')}
    </Alert>
  );
}

function defaultReload() {
  window.location.reload();
}

type BoundaryProps = {
  children?: ReactNode;
  /** Injectable for tests; production always uses a real page reload. */
  reload?: () => void;
};

type BoundaryState = {
  chunkError: boolean;
  /**
   * 'pending' - an automatic reload is being decided/performed, keep
   * showing the loading fallback so nothing flashes before the navigation.
   * 'giveUp'  - the reload budget is spent, show the manual retry.
   */
  phase: 'pending' | 'giveUp';
};

/**
 * Catches a failed lazy-route chunk load and recovers by reloading the page.
 *
 * Why this is needed at all: after a blue/green deploy swap the previously
 * active slot's hashed chunk files eventually stop being served. A tab that
 * was open across the swap still holds the OLD index chunk, whose
 * `import()` calls point at filenames that no longer exist - so the first
 * navigation to a not-yet-visited route rejects. A full reload fetches the
 * current index.html and therefore the current chunk names, which fixes it.
 *
 * Scope is deliberately narrow: anything that is not a chunk-load failure
 * is re-thrown, preserving the app's existing behaviour for ordinary render
 * errors rather than quietly swallowing them behind a generic error screen.
 */
export class ChunkLoadErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { chunkError: false, phase: 'pending' };
  // Retained so render() can re-throw the original error (with its stack)
  // when it turns out not to be a chunk-load failure.
  private caught: unknown = null;

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    return { chunkError: isChunkLoadError(error), phase: 'pending' };
  }

  componentDidCatch(error: unknown) {
    this.caught = error;
    if (!isChunkLoadError(error)) return;
    if (withinReloadCooldown()) {
      this.setState({ phase: 'giveUp' });
      return;
    }
    markReloadAttempt();
    (this.props.reload ?? defaultReload)();
  }

  private handleManualReload = () => {
    markReloadAttempt();
    (this.props.reload ?? defaultReload)();
  };

  render() {
    if (!this.state.chunkError) {
      // A non-chunk error must not be swallowed here - it has to reach
      // whatever is above us (today: nothing, i.e. the same hard failure as
      // before this boundary existed).
      //
      // Note this `throw` is a backstop, NOT the mechanism that normally
      // does the escalating. `caught` is assigned in componentDidCatch,
      // which runs in the commit phase - i.e. AFTER the re-render that
      // getDerivedStateFromError triggers - so on that first re-render
      // `caught` is still null and we return children as usual. What
      // actually escalates is that the child throws again during that
      // re-render, and React does not let the same boundary catch an error
      // twice in a row, so it propagates to the next boundary up. The throw
      // below only matters on some *later* re-render, and exists so that a
      // one-off error which does not reproduce still can't leave this
      // boundary silently sitting on a swallowed failure.
      if (this.caught != null) throw this.caught;
      return this.props.children;
    }
    if (this.state.phase === 'giveUp') {
      return <ChunkLoadErrorNotice onReload={this.handleManualReload} />;
    }
    return <RouteFallback />;
  }
}

/**
 * Route element: wraps the matched child route in the chunk-load error
 * boundary plus the Suspense boundary its lazy component needs.
 */
export default function LazyRouteBoundary({ reload }: { reload?: () => void }) {
  return (
    <ChunkLoadErrorBoundary reload={reload}>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </ChunkLoadErrorBoundary>
  );
}
