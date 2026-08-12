import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Toolbar from '@mui/material/Toolbar';
import PageSkeleton from './PageSkeleton';

const DRAWER_WIDTH = 280;
const NAV_ITEM_SKELETON_COUNT = 6;
// Impressum + Hilfe + Konto + Abmelden - TopNav's authenticated-variant
// action buttons (see TopNav.tsx's Stack). This skeleton only ever stands
// in for the authenticated shell (RequireAuth's loading state), so it
// mirrors that variant's button count, not the public variant's.
const ACTION_BUTTON_SKELETON_COUNT = 4;

// Structural placeholder for AppShell's chrome (header bar + sidebar frame),
// rendered by RequireAuth while `status === 'loading'` instead of a bare
// full-viewport spinner - see Task 4's brief. First meaningful paint must
// not be fully gated on the auth bootstrap round trip(s) resolving.
//
// Deliberately has NO dependency on useAuth()/real data (no user, abilities,
// categories, translations) - AppShell itself depends on all of those
// throughout its body, and making it tolerate a null/loading auth state
// would be a far more invasive change than this dumb, structural stand-in
// that only mimics AppShell/TopNav's dimensions closely enough to avoid a
// layout shift (CLS) once the real shell replaces it.
//
// Unlike the real TopNav (`position: fixed`, so it consumes zero flow
// height in AppShell's outer column - AppShell compensates with its own
// `<Toolbar/>` spacer in both the nav and main columns, see AppShell.tsx),
// this skeleton's header is a normal-flow Box: simpler, and there's no
// scrolling content underneath it yet that a fixed header would need to
// clear. That means this header's own height already pushes the row below
// it down by exactly one Toolbar-height - matching the *visual* result of
// the real (fixed header + Toolbar-spacer) design without mixing the two
// patterns. Do NOT add a second `<Toolbar/>` spacer inside the nav/main
// columns below - that would double-count the header height and the
// sidebar nav items would jump up by one Toolbar-height when the real
// AppShell swaps in.
export default function AppShellSkeleton() {
  return (
    <Box
      role="status"
      aria-busy="true"
      sx={{
        height: 'calc(100dvh - var(--demo-banner-height, 0px))',
        mt: 'var(--demo-banner-height, 0px)',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar frame, matching TopNav's AppBar (height/border/menu-icon
          slot on mobile/logo+title slot on the left, action-button slots on
          the right). */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          {/* TopNav always renders a leading MenuIcon button below `md`
              (AppShell.tsx passes onMenuClick whenever !desktop) - reserve
              the same space here so the logo/title don't shift right by the
              icon's width once the real header swaps in. */}
          <Skeleton variant="circular" width={40} height={40} sx={{ display: { xs: 'block', md: 'none' }, mr: 1 }} />
          <Skeleton variant="rounded" width={28} height={37} />
          <Skeleton variant="text" width={140} height={32} />
          <Box sx={{ flex: 1 }} />
          {Array.from({ length: ACTION_BUTTON_SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} variant="rounded" width={90} height={32} />
          ))}
        </Toolbar>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar frame - AppShell only ever shows this on `md`+ (see its
            own `useMediaQuery(theme.breakpoints.up('md'))`); hidden below
            that via `sx` display (not a JS media query, so it's correct on
            first paint before hydration/layout settles) to avoid a
            mobile-only layout shift once the real shell swaps in. No
            `<Toolbar/>` spacer here - see this file's top-level comment on
            why the header above already accounts for that space. */}
        <Box
          component="nav"
          aria-hidden="true"
          sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, p: 2 }}
        >
          {Array.from({ length: NAV_ITEM_SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1, borderRadius: 99 }} />
          ))}
        </Box>
        {/* Main content frame - was a bare centered spinner; a structural
            skeleton here is the whole point of this component (see its
            own top comment), so the content slot shouldn't regress to a
            spinner just because AppShell itself doesn't know which page
            is loading yet. */}
        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          <PageSkeleton />
        </Box>
      </Box>
    </Box>
  );
}
