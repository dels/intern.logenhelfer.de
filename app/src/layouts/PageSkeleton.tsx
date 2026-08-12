import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const ROW_SKELETON_COUNT = 5;

/**
 * Generic structural placeholder for a page that hasn't rendered yet: a
 * title bar plus a handful of full-width rows, shaped roughly like this
 * app's most common page (a header above a list/table - see DataTable's
 * own `variant: 'skeleton'` loading overlay for the equivalent once a page
 * HAS mounted and is fetching its own data, a separate, later loading
 * state this doesn't replace).
 *
 * Used everywhere a page itself hasn't rendered yet, so nothing here can
 * know the real page's actual shape:
 * - RouteFallback (LazyRouteBoundary.tsx) - the route chunk is still
 *   downloading, on every in-app navigation to a not-yet-loaded page.
 * - AppShellSkeleton - the auth bootstrap round trip hasn't resolved yet.
 *
 * Deliberately content-only (no role/aria-busy of its own): both callers
 * already wrap their own root in role="status"/aria-busy="true", and the
 * skeleton blocks' own pulse animation is enough of a visual busy signal -
 * nesting the same live-region role again here would be redundant for
 * assistive tech, and stacking a spinner on top would just compete with
 * the skeleton for attention without adding new information.
 */
export default function PageSkeleton() {
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 2 }} />
      {Array.from({ length: ROW_SKELETON_COUNT }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}
