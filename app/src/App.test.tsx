import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import App from './App';
import { setAccessToken } from './api/token';
import './i18n';

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', gdpr_accepted: true };
const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file's /me mock is token-agnostic and there's no
// /session/refresh handler here, so a token must already be present for the
// mount to reach /me at all, same as a returning session in the same tab.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

test('renders the dashboard inside the shell', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Übersicht' })).toBeInTheDocument();
});
