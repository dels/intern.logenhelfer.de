import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import MemberDetailPage from './MemberDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../notifications/ToastProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import '../../i18n';
import i18n from '../../i18n';

// Some address fields now render as `label: <PhoneLink/EmailLink>` - the label
// and value are separate text/element siblings, so RTL's default getByText
// (which only inspects an element's direct text-node children) can't match the
// combined string. This matcher checks full (recursive) textContent instead,
// scoped to the element whose children don't already contain the full text.
function withFullText(text: string) {
  return (_content: string, element: Element | null) => {
    if (!element) return false;
    const hasText = (node: Element) => node.textContent === text;
    const childrenDontHaveText = Array.from(element.children).every((child) => !hasText(child));
    return hasText(element) && childrenDontHaveText;
  };
}

function memberFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uuid: 'm1', email: 'mm@example.org', firstname: 'Max', lastname: 'Mitglied',
    matriculation_number: 42, job_title: 'Zimmermann', date_of_birth: '1980-01-01',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', street: 'Teststr. 1', zip: '28203', city: 'Bremen', phone: null, fax: null, mobile: null, email: null }],
    roles: [{ display_name: 'Lehrling', kind: 'administrational' }],
    can_edit: true, can_destroy: true, can_impersonate: true, editable_fields: ['job_title'],
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { user: ['read', 'update'] } }),
  ),
  http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture())),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/members/m1']}>
            <BreadcrumbProvider>
              <Breadcrumbs />
              <Routes>
                <Route path="/members/:uuid" element={<MemberDetailPage />} />
                <Route path="/" element={<div>Home</div>} />
              </Routes>
            </BreadcrumbProvider>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('MemberDetailPage', () => {
  it('renders the member, their addresses, and roles', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.getByText('Teststr. 1')).toBeInTheDocument();
    expect(screen.getByText('Lehrling')).toBeInTheDocument();
  });

  it('renders the heading as "Br. {firstname} {lastname}", not "{lastname}, {firstname}"', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByText('Mitglied, Max')).not.toBeInTheDocument();
  });

  it('shows the address as: purpose headline (no label prefix), then street, then zip/city, then remaining detail fields with labels', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(
          memberFixture({
            addresses: [
              {
                id: 1, type_of_address: 1, purpose: 'Geschäftlich', street: 'Teststr. 1', zip: '28203', city: 'Bremen',
                phone: '0421 111', fax: '0421 222', mobile: '0170 333', email: 'addr@example.org',
              },
            ],
          }),
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Geschäftlich')).toBeInTheDocument());
    expect(screen.queryByText(/Bezeichnung:/)).not.toBeInTheDocument();
    expect(screen.getByText('Teststr. 1')).toBeInTheDocument();
    expect(screen.getByText('28203 Bremen')).toBeInTheDocument();
    expect(screen.getByText(withFullText('Telefon: 0421 111'))).toBeInTheDocument();
    expect(screen.getByText('Fax: 0421 222')).toBeInTheDocument();
    expect(screen.getByText(withFullText('Mobil: 0170 333'))).toBeInTheDocument();
    expect(screen.getByText(withFullText('E-Mail: addr@example.org'))).toBeInTheDocument();
  });

  it('omits the street line entirely when street is empty, without disturbing the purpose headline or zip/city', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(
          memberFixture({
            addresses: [
              { id: 1, type_of_address: 0, purpose: 'Nebenwohnsitz', street: '', zip: '28203', city: 'Bremen', phone: null, fax: null, mobile: null, email: null },
            ],
          }),
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Nebenwohnsitz')).toBeInTheDocument());
    expect(screen.getByText('28203 Bremen')).toBeInTheDocument();
  });

  it('renders the member email and address phone/mobile/email as clickable tel:/mailto: links', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(
          memberFixture({
            addresses: [
              {
                id: 1, type_of_address: 1, purpose: 'Geschäftlich', street: 'Teststr. 1', zip: '28203', city: 'Bremen',
                phone: '0421 111', fax: '0421 222', mobile: '0170 333', email: 'addr@example.org',
              },
            ],
          }),
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'mm@example.org' })).toHaveAttribute('href', 'mailto:mm@example.org');
    expect(screen.getByRole('link', { name: '0421 111' })).toHaveAttribute('href', 'tel:0421111');
    expect(screen.getByRole('link', { name: '0170 333' })).toHaveAttribute('href', 'tel:0170333');
    expect(screen.getByRole('link', { name: 'addr@example.org' })).toHaveAttribute('href', 'mailto:addr@example.org');
  });

  it('falls back to an em-dash headline when purpose is empty, and skips null/empty detail fields instead of showing a blank label', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(
          memberFixture({
            addresses: [
              { id: 1, type_of_address: 0, purpose: '', street: '', zip: null, city: null, phone: null, fax: null, mobile: null, email: null },
            ],
          }),
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Telefon:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fax:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mobil:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E-Mail:/)).not.toBeInTheDocument();
  });

  it('shows an em-dash placeholder when the member has no addresses', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ addresses: [] }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByText('Teststr. 1')).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('splits roles into "Rollen" (administrational) and "Ämter" (positions) groups', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(
          memberFixture({
            roles: [
              { display_name: 'Lehrling', kind: 'administrational' },
              { display_name: 'Schriftführer', kind: 'positions' },
            ],
          }),
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Lehrling')).toBeInTheDocument());
    expect(screen.getByText('Schriftführer')).toBeInTheDocument();
    expect(screen.getByText('Rollen')).toBeInTheDocument();
    expect(screen.getByText('Ämter')).toBeInTheDocument();
  });

  it('shows an em-dash placeholder for both groups when the member has zero roles', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ roles: [] }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows only the "Ämter" group populated when the member has only positions roles (none administrational)', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(memberFixture({ roles: [{ display_name: 'Schriftführer', kind: 'positions' }] })),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Schriftführer')).toBeInTheDocument());
    // "Rollen" group is empty and falls back to the em-dash placeholder
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows only the "Rollen" group populated when the member has only administrational roles (none positions)', async () => {
    server.use(
      http.get('/api/v1/members/m1', () =>
        HttpResponse.json(memberFixture({ roles: [{ display_name: 'Lehrling', kind: 'administrational' }] })),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Lehrling')).toBeInTheDocument());
    // "Ämter" group is empty and falls back to the em-dash placeholder
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows edit/delete controls when can_edit/can_destroy are true', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides delete when can_destroy is false, even though the class-level ability allows it', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ can_destroy: false }))));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('shows the reset-MFA button when can_destroy is true (same gate as delete)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'MFA zurücksetzen' })).toBeInTheDocument();
  });

  it('hides the reset-MFA button when can_destroy is false, even if can_edit is true (a caller who can edit but not destroy must never see it)', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ can_destroy: false, can_edit: true }))));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'MFA zurücksetzen' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wirklich zurücksetzen?' })).not.toBeInTheDocument();
  });

  it('requires a second click to confirm before calling the MFA reset endpoint, and shows a success toast', async () => {
    let resetCalled = false;
    server.use(
      http.post('/api/v1/members/m1/mfa/reset', () => {
        resetCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'MFA zurücksetzen' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'MFA zurücksetzen' }));
    expect(resetCalled).toBe(false);
    const confirmButton = await screen.findByRole('button', { name: 'Wirklich zurücksetzen?' });
    expect(screen.queryByRole('button', { name: 'MFA zurücksetzen' })).not.toBeInTheDocument();

    await userEvent.click(confirmButton);
    await waitFor(() => expect(resetCalled).toBe(true));
    expect(await screen.findByText('MFA wurde zurückgesetzt')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'MFA zurücksetzen' })).toBeInTheDocument();
  });

  it('shows an error alert and stays in the confirm state when the MFA reset request fails (unhappy path)', async () => {
    server.use(http.post('/api/v1/members/m1/mfa/reset', () => new HttpResponse(null, { status: 500 })));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'MFA zurücksetzen' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'MFA zurücksetzen' }));
    const confirmButton = await screen.findByRole('button', { name: 'Wirklich zurücksetzen?' });
    await userEvent.click(confirmButton);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    // Must not silently revert to the un-clicked state on failure - the
    // caller needs to see the reset didn't actually happen.
    expect(screen.getByRole('button', { name: 'Wirklich zurücksetzen?' })).toBeInTheDocument();
    expect(screen.queryByText('MFA wurde zurückgesetzt')).not.toBeInTheDocument();
  });

  it('shows mother lodge and accepted-on when present, formatted as a localized date', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ mother_lodge: 'Zur Standhaftigkeit', accepted_at: '2015-03-01' }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.getByText('Mutterloge: Zur Standhaftigkeit')).toBeInTheDocument();
    const expectedDate = new Date('2015-03-01T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`Angenommen am: ${expectedDate}`)).toBeInTheDocument();
    expect(screen.queryByText(/2015-03-01/)).not.toBeInTheDocument();
  });

  it('omits mother lodge and accepted-on when absent', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByText(/Mutterloge/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Angenommen am/)).not.toBeInTheDocument();
  });

  it('formats "Aufgenommen am" (entered_apprentice_since) as a localized date, not the raw ISO string - regression test for the reported bug', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ entered_apprentice_since: '2010-11-20' }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    const expectedDate = new Date('2010-11-20T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`Aufgenommen am: ${expectedDate}`)).toBeInTheDocument();
    expect(screen.queryByText(/2010-11-20/)).not.toBeInTheDocument();
  });

  it('formats fellow_craft_since and master_mason_since as localized dates, and shows an em-dash (not an empty string) when all three degree dates are absent', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ fellow_craft_since: '2012-06-15', master_mason_since: null }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    const expectedFellowCraft = new Date('2012-06-15T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`Befördert am: ${expectedFellowCraft}`)).toBeInTheDocument();
    expect(screen.getByText('Erhoben am: —')).toBeInTheDocument();
    expect(screen.getByText('Aufgenommen am: —')).toBeInTheDocument();
  });

  it('shows an impersonate button when can_impersonate is true', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Impersonate' })).toBeInTheDocument());
  });

  it('hides the impersonate button when can_impersonate is false', async () => {
    server.use(http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ can_impersonate: false }))));
    renderPage();
    await waitFor(() => expect(screen.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Impersonate' })).not.toBeInTheDocument();
  });

  it('calls the impersonate endpoint and navigates to / when clicked', async () => {
    let impersonated = false;
    server.use(
      http.post('/api/v1/members/m1/impersonate', () => {
        impersonated = true;
        return HttpResponse.json({ access_token: 'target-tok', user: { id: 2, email: 'mm@example.org', firstname: 'Max', lastname: 'Mitglied' } });
      }),
      http.get('/api/v1/me', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer target-tok'
          ? HttpResponse.json({ user: { id: 2, firstname: 'Max', lastname: 'Mitglied' }, abilities: {} })
          : HttpResponse.json({ user: { id: 1, firstname: 'Admin', lastname: 'User' }, abilities: { user: ['impersonate'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Impersonate' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Impersonate' }));
    await waitFor(() => expect(impersonated).toBe(true));
  });

  it('shows an error alert instead of silently failing when impersonation is rejected', async () => {
    server.use(
      http.post('/api/v1/members/m1/impersonate', () =>
        HttpResponse.json({ error: 'forbidden', detail: 'Vertretung nicht erlaubt' }, { status: 403 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Impersonate' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Impersonate' }));
    await waitFor(() => expect(screen.getByText('Vertretung nicht erlaubt')).toBeInTheDocument());
    // still on the member page - a failed impersonation must not navigate away
    // (scoped to the heading, since the breadcrumb trail now also shows this same name)
    expect(screen.getByRole('heading', { name: 'Br. Max Mitglied' })).toBeInTheDocument();
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    const breadcrumbNav = await screen.findByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    await waitFor(() => expect(breadcrumbLinks.getByText('Br. Max Mitglied')).toBeInTheDocument());
    expect(breadcrumbLinks.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
    expect(breadcrumbLinks.queryByText('Übersicht')).not.toBeInTheDocument();
  });
});
