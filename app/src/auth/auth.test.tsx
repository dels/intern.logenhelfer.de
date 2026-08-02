import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthProvider';
import { setAccessToken } from '../api/token';
import { routes } from '../routes';
import '../i18n';
import { useIdleTimeout } from './useIdleTimeout';

vi.mock('./useIdleTimeout', () => ({ useIdleTimeout: vi.fn() }));

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: true };
const server = setupServer(
  http.post('/api/v1/session/refresh', () => new HttpResponse(null, { status: 401 })),
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><RouterProvider router={router} /></AuthProvider>
    </QueryClientProvider>,
  );
}

test('anonymous users are redirected to the login page', async () => {
  renderApp('/');
  expect(await screen.findByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
});

test('successful login shows the shell', async () => {
  server.use(
    http.post('/api/v1/session', () => HttpResponse.json({ access_token: 't', user })),
    http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
    http.get('/api/v1/announcements', () => HttpResponse.json({ rows: [], row_count: 0 })),
  );
  renderApp('/login');
  await userEvent.type(await screen.findByLabelText(/E-Mail/), 'a@b.de');
  await userEvent.type(screen.getByLabelText(/Passwort/), 'foobar123');
  await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
  expect(await screen.findByRole('heading', { name: 'Übersicht' })).toBeInTheDocument();
});

test('failed login shows the error message', async () => {
  server.use(http.post('/api/v1/session', () => new HttpResponse(null, { status: 401 })));
  renderApp('/login');
  await userEvent.type(await screen.findByLabelText(/E-Mail/), 'a@b.de');
  await userEvent.type(screen.getByLabelText(/Passwort/), 'nope');
  await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
  expect(await screen.findByText('E-Mail oder Passwort ist falsch.')).toBeInTheDocument();
});

test('impersonating a member swaps identity, and stopping returns to the admin', async () => {
  server.use(
    http.post('/api/v1/session', () => HttpResponse.json({ access_token: 'admin-tok', user })),
    http.get('/api/v1/me', ({ request }) => {
      const auth = request.headers.get('Authorization');
      if (!auth) return new HttpResponse(null, { status: 401 });
      if (auth === 'Bearer target-tok') {
        return HttpResponse.json({ user: { ...user, id: 2, firstname: 'Target' }, abilities: {} });
      }
      return HttpResponse.json({ user, abilities: { user: ['impersonate'] } });
    }),
    http.post('/api/v1/members/target-uuid/impersonate', () => HttpResponse.json({ access_token: 'target-tok', user: { ...user, id: 2 } })),
  );

  let auth: ReturnType<typeof useAuth> | undefined;
  function Probe() { auth = useAuth(); return null; }
  render(<AuthProvider><Probe /></AuthProvider>);

  await waitFor(() => expect(auth?.status).toBe('anonymous'));
  await act(() => auth!.login('a@b.de', 'foobar123'));
  await waitFor(() => expect(auth?.user?.id).toBe(1));

  await act(() => auth!.impersonate('target-uuid'));
  await waitFor(() => expect(auth?.user?.id).toBe(2));
  expect(auth?.impersonating).toBe(true);

  await act(() => auth!.stopImpersonating());
  await waitFor(() => expect(auth?.user?.id).toBe(1));
  expect(auth?.impersonating).toBe(false);
});

test('the idle-timeout hook is enabled only while authenticated, and firing its callback logs the user out', async () => {
  server.use(
    http.post('/api/v1/session', () => HttpResponse.json({ access_token: 't', user })),
    http.get('/api/v1/me', ({ request }) => {
      const auth = request.headers.get('Authorization');
      if (!auth) return new HttpResponse(null, { status: 401 });
      return HttpResponse.json({ user, abilities: { event: ['read'] } });
    }),
    http.delete('/api/v1/session', () => new HttpResponse(null, { status: 204 })),
  );

  let auth: ReturnType<typeof useAuth> | undefined;
  function Probe() { auth = useAuth(); return null; }
  render(<AuthProvider><Probe /></AuthProvider>);

  await waitFor(() => expect(auth?.status).toBe('anonymous'));
  expect(vi.mocked(useIdleTimeout)).toHaveBeenLastCalledWith(false, expect.any(Function));

  await act(() => auth!.login('a@b.de', 'foobar123'));
  await waitFor(() => expect(auth?.status).toBe('authenticated'));
  expect(vi.mocked(useIdleTimeout)).toHaveBeenLastCalledWith(true, expect.any(Function));

  const onTimeout = vi.mocked(useIdleTimeout).mock.calls.at(-1)![1];
  await act(async () => { onTimeout(); });

  await waitFor(() => expect(auth?.status).toBe('anonymous'));
  expect(auth?.user).toBeNull();
});

test('unmounting before the bootstrap /api/v1/me fetch resolves does not throw or set state on the unmounted tree', async () => {
  // Regression test for a real failure this test suite hit: AuthProvider's
  // bootstrap effect used to call setUser/setAbilities/setStatus
  // unconditionally once the fetch settled, with no unmount guard. In a
  // single test file that's merely a React warning, but across the whole
  // suite a leftover unresolved fetch from one test file's AuthProvider can
  // settle while a *later* file's jsdom environment is already torn down -
  // React's own scheduling internals then throw a "window is not defined"
  // unhandled rejection, observed from an unrelated file (PublicLayout.test.tsx)
  // several files later. That specific cross-file teardown timing can't be
  // reproduced in one isolated test, but the actual fix - never calling a
  // state setter once unmounted - is: this asserts resolving the fetch after
  // unmount doesn't throw, which is what the fix guarantees regardless of
  // when/where the promise settles.
  let resolveMe: ((value: { user: typeof user; abilities: Record<string, string[]> }) => void) | undefined;
  server.use(
    http.get('/api/v1/me', () => new Promise((resolve) => { resolveMe = (body) => resolve(HttpResponse.json(body)); })),
  );

  const { unmount } = render(<AuthProvider><div /></AuthProvider>);
  await waitFor(() => expect(resolveMe).toBeDefined());
  unmount();

  await act(async () => {
    resolveMe!({ user, abilities: { event: ['read'] } });
    await Promise.resolve();
  });
});
