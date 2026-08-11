import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Toolbar from '@mui/material/Toolbar';

const DRAWER_WIDTH = 280;
const NAV_ITEM_SKELETON_COUNT = 6;

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
      {/* Header bar frame, matching TopNav's AppBar (height/border/logo+title
          slot on the left, action-button slots on the right). */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={140} height={32} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={90} height={32} />
          <Skeleton variant="rounded" width={90} height={32} />
        </Toolbar>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar frame - AppShell only ever shows this on `md`+ (see its
            own `useMediaQuery(theme.breakpoints.up('md'))`); hidden below
            that via `sx` display (not a JS media query, so it's correct on
            first paint before hydration/layout settles) to avoid a
            mobile-only layout shift once the real shell swaps in. */}
        <Box
          component="nav"
          aria-hidden="true"
          sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, p: 2 }}
        >
          <Toolbar />
          {Array.from({ length: NAV_ITEM_SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1, borderRadius: 99 }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, height: '100%', display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    </Box>
  );
}
