import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import AccountPage from './AccountPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
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
  http.get('/api/v1/me', () => HttpResponse.json({
    user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster', birthday_calendar_consent: false, birthday_calendar_consent_requested: true },
    abilities: {},
  })),
  http.patch('/api/v1/me/password', async ({ request }) => {
    const body = await request.json() as { current_password: string; new_password: string; new_password_confirmation: string };
    if (body.current_password !== 'correct-password') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'Aktuelles Passwort ist falsch' }, { status: 422 });
    }
    return HttpResponse.json({ user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: {} });
  }),
  http.patch('/api/v1/me/birthday_calendar_consent', async ({ request }) => {
    const body = await request.json() as { consent: boolean };
    return HttpResponse.json({
      user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster', birthday_calendar_consent: body.consent, birthday_calendar_consent_requested: true },
      abilities: {},
    });
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
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file's /me mock is token-agnostic and there's no
// /session/refresh handler here, so a token must already be present for the
// mount to reach /me at all, same as a returning session in the same tab.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
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

  it('shows the birthday-calendar consent switch when the feature requests it', async () => {
    renderPage();
    expect(await screen.findByRole('switch', { name: /Geburtstagskalender/i })).toBeInTheDocument();
  });

  it('hides the birthday-calendar consent switch when not requested', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({
        user: { id: 1, uuid: 'm1', email: 'a@b.de', firstname: 'Max', lastname: 'Muster', birthday_calendar_consent: false, birthday_calendar_consent_requested: false },
        abilities: {},
      })),
    );
    renderPage();
    await screen.findByLabelText(/E-Mail/);
    expect(screen.queryByRole('switch', { name: /Geburtstagskalender/i })).not.toBeInTheDocument();
  });

  it('toggles the birthday-calendar consent switch', async () => {
    renderPage();
    const user = userEvent.setup();
    const toggle = await screen.findByRole('switch', { name: /Geburtstagskalender/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('a second profile save in the same session, after an earlier address edit, still omits the untouched addresses array (regression: dirtyFields must not survive across saves within one mount)', async () => {
    // Regression for the residual bug in the prior fix wave (c875302a):
    // MemberForm only omits `addresses` from the PATCH payload when
    // formState.dirtyFields.addresses is falsy, but nothing ever reset that
    // dirty flag - it's computed against react-hook-form's mount-time
    // defaultValues. MemberEditPage/MemberAccordionList are safe because
    // their form unmounts after a successful save; AccountPage is the one
    // consumer whose form stays mounted (self-service profile page), so
    // without a remount-on-success fix, editing the address mobile field,
    // saving, then editing the base-data mobile field and saving again
    // (same page visit) would still resubmit `addresses` on the second
    // save, re-triggering the backend's syncUserMobile overwrite of the
    // second edit. See AccountPage.tsx's `formKey` bump for the fix.
    const mobileMemberFixture = {
      ...memberFixture,
      editable_fields: ['job_title', 'mobile', 'addresses', 'email'],
      mobile: '0151-1111111',
      addresses: [
        { id: 1, type_of_address: 0, purpose: 'Privat', street: null, zip: null, city: null, phone: null, fax: null, mobile: '0170-2222222', email: null },
      ],
    };
    const patchBodies: Record<string, unknown>[] = [];
    server.use(
      http.get('/api/v1/members/m1', () => HttpResponse.json(mobileMemberFixture)),
      http.patch('/api/v1/members/m1', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        patchBodies.push(body);
        // Mirror the real backend's own last-word-wins address sync: only
        // update what was actually present in this request's body, and
        // persist it for the next request's GET-equivalent (setQueryData)
        // to build on - matching how the real server would have the
        // second save's mobile edit reach a database row whose address
        // mobile was already updated by the first save.
        if ('addresses' in body) mobileMemberFixture.addresses = body.addresses as typeof mobileMemberFixture.addresses;
        if ('mobile' in body) mobileMemberFixture.mobile = body.mobile as string;
        return HttpResponse.json({ ...mobileMemberFixture });
      }),
    );

    const { container } = renderPage();
    const user = userEvent.setup();

    // Both the base-data email field and the address row's own email field
    // render with the same "E-Mail" label - disambiguate by `name` (same
    // convention MemberForm.test.tsx already uses for its own base/address
    // mobile-field pair) rather than screen.findByLabelText, which would
    // throw on the resulting duplicate match.
    await waitFor(() => expect(container.querySelector('input[name="email"]')).toBeInTheDocument());
    const addressMobileInput = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
    expect(addressMobileInput).toBeInTheDocument();
    await user.clear(addressMobileInput);
    await user.type(addressMobileInput, '0170-3333333');

    await user.click(screen.getAllByRole('button', { name: 'Speichern' })[0]!);
    await waitFor(() => expect(patchBodies).toHaveLength(1));
    expect(patchBodies[0]).toHaveProperty('addresses');

    // Wait for the post-save remount: a fresh MemberForm instance whose
    // baseline already carries the just-saved address mobile forward.
    await waitFor(() => {
      const input = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
      expect(input).toHaveValue('0170-3333333');
    });

    const baseMobileInput = container.querySelector('input[name="mobile"]') as HTMLInputElement;
    await user.clear(baseMobileInput);
    await user.type(baseMobileInput, '0151-9999999');

    await user.click(screen.getAllByRole('button', { name: 'Speichern' })[0]!);
    await waitFor(() => expect(patchBodies).toHaveLength(2));

    expect(patchBodies[1]).not.toHaveProperty('addresses');
    expect(patchBodies[1]).toMatchObject({ mobile: '0151-9999999' });
  });
});
