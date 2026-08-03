import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import AccountPage from './AccountPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

const memberFixture = {
  uuid: 'm1',
  email: 'a@b.de',
  firstname: 'Max',
  lastname: 'Muster',
  matriculation_number: 42,
  job_title: 'Zimmermann',
  date_of_birth: '1980-01-01',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  addresses: [],
  roles: [],
  role_ids: [],
  can_edit: true,
  can_destroy: false,
  can_impersonate: false,
  editable_fields: ['job_title', 'addresses', 'email'],
  mother_lodge: null,
  accepted_at: null,
};

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: {} })),
  http.patch('/api/v1/me/password', async ({ request }) => {
    const body = await request.json() as { current_password: string; new_password: string; new_password_confirmation: string };
    if (body.current_password !== 'correct-password') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'Aktuelles Passwort ist falsch' }, { status: 422 });
    }
    return HttpResponse.json({ user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: {} });
  }),
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture)),
  http.patch('/api/v1/members/m1', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...memberFixture, ...body });
  }),
  // MfaAccountSection (now mounted inline on this page) queries these.
  http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: [], mode: 'optional', grace_period_ends_at: null })),
  http.get('/api/v1/mfa/passkeys', () => HttpResponse.json({ credentials: [] })),
  http.get('/api/v1/mfa/trusted-devices', () => HttpResponse.json({ devices: [] })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/account']}>
          <AccountPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

// MemberForm's own save button and AccountPage's password-form save button
// both render the same accessible name ("Speichern") - the profile section
// (backed by MemberForm) always ends up first in document order, so once
// both sections have mounted, index [1] is always the password form's own
// button. Waiting for the profile section's email field first guarantees
// both buttons already exist (no raciness from the profile's async
// useMember load resolving after the click).
async function clickPasswordSaveButton(): Promise<void> {
  await screen.findByLabelText(/E-Mail/);
  const saveButtons = screen.getAllByRole('button', { name: 'Speichern' });
  await userEvent.click(saveButtons[1]!);
}

describe('AccountPage', () => {
  it('shows a success message after changing the password', async () => {
    renderPage();
    const user = userEvent.setup();

    await userEvent.type(await screen.findByLabelText('Aktuelles Passwort'), 'correct-password');
    await user.type(screen.getByLabelText('Neues Passwort'), 'newpass123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'newpass123');
    await clickPasswordSaveButton();

    await waitFor(() => expect(screen.getByText('Passwort erfolgreich geändert.')).toBeInTheDocument());
  });

  it('shows the server error when the current password is wrong', async () => {
    renderPage();
    const user = userEvent.setup();

    await userEvent.type(await screen.findByLabelText('Aktuelles Passwort'), 'wrong-password');
    await user.type(screen.getByLabelText('Neues Passwort'), 'newpass123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'newpass123');
    await clickPasswordSaveButton();

    await waitFor(() => expect(screen.getByText('Aktuelles Passwort ist falsch')).toBeInTheDocument());
  });

  it('shows a client-side error when the confirmation does not match', async () => {
    renderPage();
    const user = userEvent.setup();

    await userEvent.type(await screen.findByLabelText('Aktuelles Passwort'), 'correct-password');
    await user.type(screen.getByLabelText('Neues Passwort'), 'newpass123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'different456');
    await clickPasswordSaveButton();

    await waitFor(() => expect(screen.getByText('Die Passwörter stimmen nicht überein.')).toBeInTheDocument());
  });

  it('renders the profile section with exactly the self-service editable fields (email, job title, addresses)', async () => {
    renderPage();

    expect(await screen.findByLabelText(/E-Mail/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Beruf/)).toBeInTheDocument();
    // Fields only ever in ADMIN_FIELDS must not render for a self-service edit.
    expect(screen.queryByLabelText(/Vorname/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Matrikelnummer/)).not.toBeInTheDocument();
  });

  it('submits the profile form and shows a success message', async () => {
    renderPage();
    const user = userEvent.setup();

    const emailField = await screen.findByLabelText(/E-Mail/);
    await user.clear(emailField);
    await user.type(emailField, 'new@b.de');
    // There are two "Speichern" buttons on the page (profile + password) -
    // the profile section's form is the first one in document order.
    const saveButtons = screen.getAllByRole('button', { name: 'Speichern' });
    await user.click(saveButtons[0]!);

    await waitFor(() => expect(screen.getByText('Profil erfolgreich aktualisiert.')).toBeInTheDocument());
  });

  it('shows the server error when the profile update is rejected (e.g. email already taken)', async () => {
    server.use(
      http.patch('/api/v1/members/m1', () =>
        HttpResponse.json({ error: 'unprocessable', detail: 'E-Mail ist bereits vergeben' }, { status: 422 })),
    );
    renderPage();
    const user = userEvent.setup();

    const emailField = await screen.findByLabelText(/E-Mail/);
    await user.clear(emailField);
    await user.type(emailField, 'taken@b.de');
    const saveButtons = screen.getAllByRole('button', { name: 'Speichern' });
    await user.click(saveButtons[0]!);

    await waitFor(() => expect(screen.getByText('E-Mail ist bereits vergeben')).toBeInTheDocument());
  });

  it('renders the MFA management section inline, not as a link to a separate page', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: /mfa verwalten|manage mfa/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sicherheit verwalten|mfa verwalten|manage security|manage mfa/i })).not.toBeInTheDocument();
  });
});
