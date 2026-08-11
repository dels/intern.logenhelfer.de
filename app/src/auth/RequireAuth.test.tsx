import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import RequireAuth from './RequireAuth';
import { useAuth } from './AuthProvider';

vi.mock('./AuthProvider', () => ({ useAuth: vi.fn() }));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    user: null,
    abilities: {},
    impersonating: false,
    mfaSetupRequired: false,
    login: vi.fn(),
    completeMfaChallenge: vi.fn(),
    loginWithPasskey: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    refreshUser: vi.fn(),
    impersonate: vi.fn(),
    stopImpersonating: vi.fn(),
    ...overrides,
  });
}

// RequireAuth is a layout route (renders <Outlet/>), so it's exercised here
// the same way it's actually used in routes.tsx: as the `element` of a
// wrapping <Route>, with real child routes underneath - including a
// `/mfa/setup` route, since one of the redirect targets IS a sibling route,
// not an isolated component.
function renderWithRoutes(initialPath: string, extraRoutes?: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {extraRoutes}
        <Route element={<RequireAuth />}>
          <Route path="/mfa/setup" element={<div>mfa-setup-page</div>} />
          <Route path="/other" element={<div>other-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  it('renders structural skeleton chrome (not children, and not just a bare spinner) while status is loading', () => {
    mockAuth({ status: 'loading' });
    const { container } = renderWithRoutes('/other');
    // A real, visible structural stand-in - not just a spinner floating in
    // an otherwise-empty viewport (see AppShellSkeleton): asserting on the
    // skeleton placeholders directly is what distinguishes this from the
    // old bare-spinner render, which the progressbar assertion alone would
    // not catch (the skeleton also keeps a CircularProgress for an
    // accessible in-progress signal).
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('other-page')).not.toBeInTheDocument();
  });

  it('redirects to /login when anonymous', () => {
    mockAuth({ status: 'anonymous' });
    renderWithRoutes('/other', <Route path="/login" element={<div>login-page</div>} />);
    expect(screen.getByText('login-page')).toBeInTheDocument();
    expect(screen.queryByText('other-page')).not.toBeInTheDocument();
  });

  it('renders the child route when authenticated and mfaSetupRequired is false', () => {
    mockAuth({ status: 'authenticated', mfaSetupRequired: false });
    renderWithRoutes('/other');
    expect(screen.getByText('other-page')).toBeInTheDocument();
  });

  it('redirects to /mfa/setup when mfaSetupRequired is true and the current path is not already /mfa/setup', () => {
    mockAuth({ status: 'authenticated', mfaSetupRequired: true });
    renderWithRoutes('/other');
    expect(screen.getByText('mfa-setup-page')).toBeInTheDocument();
    expect(screen.queryByText('other-page')).not.toBeInTheDocument();
  });

  it('renders /mfa/setup itself without looping when mfaSetupRequired is true', () => {
    mockAuth({ status: 'authenticated', mfaSetupRequired: true });
    renderWithRoutes('/mfa/setup');
    expect(screen.getByText('mfa-setup-page')).toBeInTheDocument();
  });

  it('bypasses the forced-setup redirect while impersonating', () => {
    mockAuth({ status: 'authenticated', mfaSetupRequired: true, impersonating: true });
    renderWithRoutes('/other');
    expect(screen.getByText('other-page')).toBeInTheDocument();
    expect(screen.queryByText('mfa-setup-page')).not.toBeInTheDocument();
  });
});
