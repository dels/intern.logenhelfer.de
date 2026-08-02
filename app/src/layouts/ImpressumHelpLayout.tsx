import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AppShell from './AppShell';
import PublicLayout from './PublicLayout';
import { useAuth } from '../auth/AuthProvider';

// Impressum/Help must stay reachable without login (legal requirement for
// Impressum specifically), but a user who IS already logged in should see
// them inside the normal app shell (sidebar + authenticated top nav), not
// the anonymous public layout - see the 2026-07-22 bugfix-roundup plan.
// This mounts one of the two existing layouts by auth status rather than
// registering the route twice (duplicate static paths in react-router
// resolve to whichever is declared first, regardless of auth state).
export default function ImpressumHelpLayout() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <CircularProgress />
      </Box>
    );
  }
  return status === 'authenticated' ? <AppShell /> : <PublicLayout />;
}
