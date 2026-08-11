import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';
import AppShellSkeleton from '../layouts/AppShellSkeleton';

export default function RequireAuth() {
  const { status, mfaSetupRequired, impersonating } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    // Structural skeleton chrome, not a bare full-viewport spinner - see
    // AppShellSkeleton's own doc comment for why this is a separate,
    // auth-independent component rather than AppShell itself made tolerant
    // of a null/loading auth state.
    return <AppShellSkeleton />;
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
