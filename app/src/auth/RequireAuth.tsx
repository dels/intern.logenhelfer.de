import { Navigate, Outlet, useLocation } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAuth } from './AuthProvider';

export default function RequireAuth() {
  const { status, mfaSetupRequired, impersonating } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}><CircularProgress /></Box>;
  }
  if (status === 'anonymous') return <Navigate to="/login" replace />;
  // Mandatory MFA, grace period over (or never started), nothing enrolled -
  // no route except the setup wizard itself until enrollment completes (see
  // AuthProvider's mfaSetupRequired / api/src/routes/me.ts's
  // mfa_setup_required). Skipped while impersonating: the flag reflects the
  // impersonated target's own MFA state, and forcing the impersonating
  // admin's session into the target's setup wizard would be nonsensical -
  // impersonation write-actions are already separately gated (see
  // members.ts's impersonation guards), this is a read-only UX redirect.
  if (mfaSetupRequired && !impersonating && location.pathname !== '/mfa/setup') {
    return <Navigate to="/mfa/setup" replace />;
  }
  return <Outlet />;
}
