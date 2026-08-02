import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import App from './App';
import './i18n';

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', gdpr_accepted: true };
const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders the dashboard inside the shell', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Übersicht' })).toBeInTheDocument();
});
