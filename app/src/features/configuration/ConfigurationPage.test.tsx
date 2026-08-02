import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import ConfigurationPage from './ConfigurationPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

function appConfigFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    public_wp_available_to_anon_users: true,
    working_plan_as_start_page: false,
    archive: false,
    show_admins: true,
    domain: 'logenhelfer.de',
    organisation: 'ACME',
    lodge: 'Zur Standhaftigkeit',
    lodge_short: 'zs',
    language: 'de',
    default_workingplan_timespan: 120,
    public_workingplan_html_timespan: 180,
    public_workingplan_ics_timespan: 365,
    default_event_location: '',
    user_change_notification_email: '',
    default_from_email: 'website@logenhelfer.de',
    technical_contact_email: 'technik@logenhelfer.de',
    mvst_email: '',
    zip: '',
    location: '',
    max_db_mem_size: '104857600',
    workingplan_footer: '',
    impressum: '',
    help: '',
    robots_txt: 'User-Agent: *\nDisallow: /',
    ...overrides,
  };
}

let lastPatchBody: unknown = null;
let districts: { id: number; name: string }[] = [];
let academicTitles: { id: number; short: string }[] = [];
let roles: { id: number; name: string; display_name: string; email: string | null }[] = [];

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { app_config: ['read', 'update'] } }),
  ),
  http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: false })),
  http.get('/api/v1/app_config', () => HttpResponse.json(appConfigFixture())),
  http.patch('/api/v1/app_config', async ({ request }) => {
    lastPatchBody = await request.json();
    return HttpResponse.json(appConfigFixture(lastPatchBody as Record<string, unknown>));
  }),
  http.get('/api/v1/districts', () => HttpResponse.json({ rows: districts })),
  http.delete('/api/v1/districts/:id', ({ params }) => {
    districts = districts.filter((d) => d.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/v1/academic_titles', () => HttpResponse.json({ rows: academicTitles })),
  http.post('/api/v1/academic_titles', async ({ request }) => {
    const body = (await request.json()) as { short: string };
    const created = { id: academicTitles.length + 1, short: body.short };
    academicTitles = [...academicTitles, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('/api/v1/academic_titles/:id', async ({ params, request }) => {
    const body = (await request.json()) as { short: string };
    academicTitles = academicTitles.map((t) => (t.id === Number(params.id) ? { ...t, short: body.short } : t));
    return HttpResponse.json(academicTitles.find((t) => t.id === Number(params.id)));
  }),
  http.delete('/api/v1/academic_titles/:id', ({ params }) => {
    academicTitles = academicTitles.filter((t) => t.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: roles })),
  http.patch('/api/v1/roles/:id', async ({ params, request }) => {
    const body = (await request.json()) as { email: string | null };
    roles = roles.map((r) => (r.id === Number(params.id) ? { ...r, email: body.email } : r));
    return HttpResponse.json(roles.find((r) => r.id === Number(params.id)));
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => { server.resetHandlers(); lastPatchBody = null; });
afterAll(() => server.close());

beforeEach(() => {
  districts = [{ id: 1, name: 'Nordwest' }, { id: 2, name: 'Nordost' }];
  academicTitles = [{ id: 1, short: 'Dr.' }, { id: 2, short: 'Prof.' }];
  roles = [
    { id: 1, name: 'chairman', display_name: 'Vorsitzender', email: 'vorsitz@logenhelfer.de' },
    { id: 2, name: 'treasurer', display_name: 'Schatzmeister', email: null },
  ];
});

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter>
            <ConfigurationPage />
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ConfigurationPage', () => {
  it('renders all six settings tabs with the correct labels', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Funktionen' })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Konfiguration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Impressum' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Distrikte' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Akademische Titel' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rollen (E-Mail-Adressen)' })).toBeInTheDocument();
  });

  it('shows the Distrikte, Akademische Titel and Rollen sections only while their own tab is active', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nordwest')).toBeInTheDocument());
    expect(screen.getByText('Nordwest')).not.toBeVisible();
    expect(screen.getByText('Dr.')).not.toBeVisible();
    expect(screen.getByText('Vorsitzender')).not.toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Distrikte' }));
    expect(screen.getByText('Nordwest')).toBeVisible();
    expect(screen.getByText('Dr.')).not.toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Akademische Titel' }));
    expect(screen.getByText('Dr.')).toBeVisible();
    expect(screen.getByText('Nordwest')).not.toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Rollen (E-Mail-Adressen)' }));
    expect(screen.getByText('Vorsitzender')).toBeVisible();
    expect(screen.getByText('Dr.')).not.toBeVisible();
  });

  it('renders current AppConfig values in form fields', async () => {
    const user = userEvent.setup();
    renderPage();
    const publicWpSwitch = await screen.findByRole('switch', { name: /Öffentlicher Arbeitsplan/ });
    expect(publicWpSwitch).toBeChecked();
    const archiveSwitch = screen.getByRole('switch', { name: /Archiv-Modus/ });
    expect(archiveSwitch).not.toBeChecked();

    await user.click(screen.getByRole('tab', { name: 'Konfiguration' }));
    expect(screen.getByDisplayValue('logenhelfer.de')).toBeInTheDocument();
  });

  it('submits the changed AppConfig values on save', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    const domainField = await screen.findByDisplayValue('logenhelfer.de');
    await user.clear(domainField);
    await user.type(domainField, 'example.org');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(lastPatchBody).not.toBeNull());
    expect((lastPatchBody as Record<string, unknown>).domain).toBe('example.org');
  });

  it('shows the max_db_mem_size field in MB and saves it back as a byte string', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    const field = await screen.findByRole('spinbutton', { name: 'maximaler Datenbankspeicherplatz' });
    expect(field).toHaveValue(100);

    await user.clear(field);
    await user.type(field, '200');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(lastPatchBody).not.toBeNull());
    expect((lastPatchBody as Record<string, unknown>).max_db_mem_size).toBe(String(200 * 1024 * 1024));
  });

  it('disables the max_db_mem_size field when the environment reports demo mode', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: true })));
    renderPage();

    const field = await screen.findByLabelText(/maximaler Datenbankspeicherplatz/);
    expect(field).toBeDisabled();
  });

  it('shows exactly one alert when saving AppConfig fails, not a duplicate inline+toast pair', async () => {
    server.use(
      http.patch('/api/v1/app_config', () => HttpResponse.json({ detail: 'Ungültige Konfiguration' }, { status: 422 })),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await screen.findAllByText('Ungültige Konfiguration');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('renders the language field as a select with German/English options, and saves a change', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    await user.click(await screen.findByRole('combobox', { name: /Sprache/ }));
    await user.click(await screen.findByRole('option', { name: 'Englisch' }));
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(lastPatchBody).not.toBeNull());
    expect((lastPatchBody as Record<string, unknown>).language).toBe('en');
  });

  it('shows a Hilfe-Inhalt field and submits its value', async () => {
    server.use(
      http.get('/api/v1/app_config', () => HttpResponse.json(appConfigFixture({ help: '' }))),
    );
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <MemoryRouter><ConfigurationPage /></MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    const field = await screen.findByLabelText('Hilfe-Inhalt');
    await user.type(field, '<p>Testhilfe</p>');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(lastPatchBody).toMatchObject({ help: '<p>Testhilfe</p>' }));
  });

  it('shows exactly the Funktionen toggles on the Funktionen tab', async () => {
    renderPage();
    await screen.findByRole('switch', { name: /Öffentlicher Arbeitsplan/ });
    expect(screen.getByRole('switch', { name: 'Arbeitsplan als Startseite' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Administratoren in Benutzerliste anzeigen?' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Namen der Suchenden für alle Brüder sichtbar' })).toBeInTheDocument();
    // Konfiguration-only fields must not be present while on the Funktionen tab.
    expect(screen.queryByRole('textbox', { name: 'Domain' })).not.toBeInTheDocument();
  });

  it('shows Domain, Vereinsname, Loge and Abkürzung Loge on the Konfiguration tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Konfiguration' }));
    expect(screen.getByRole('textbox', { name: 'Domain' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Vereinsname' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Loge' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Abkürzung Loge' })).toBeInTheDocument();
    // Funktionen-only toggles must not be present while on the Konfiguration tab.
    expect(screen.queryByRole('switch', { name: 'Arbeitsplan als Startseite' })).not.toBeInTheDocument();
  });

  it('shows the legal-notice fields on the Impressum tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Impressum' }));
    expect(screen.getByLabelText('Impressums-Text')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'PLZ' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Ort' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Kontakt-Adresse des MvSt.' })).toBeInTheDocument();
    // Konfiguration-only field must not be present while on the Impressum tab.
    expect(screen.queryByRole('textbox', { name: 'Domain' })).not.toBeInTheDocument();
  });

  it('renders the district list and removes a row on delete', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Distrikte' }));
    expect(screen.getByText('Nordwest')).toBeInTheDocument();
    expect(screen.getByText('Nordost')).toBeInTheDocument();

    const [firstDeleteButton] = screen.getAllByLabelText('Löschen');
    await user.click(firstDeleteButton!);
    await user.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));

    await waitFor(() => expect(screen.queryByText('Nordwest')).not.toBeInTheDocument());
    expect(screen.getByText('Nordost')).toBeInTheDocument();
  });

  it('renders the academic title list and creates/edits a title', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Akademische Titel' }));
    expect(screen.getByText('Dr.')).toBeInTheDocument();
    expect(screen.getByText('Prof.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Titel hinzufügen' }));
    const shortField = screen.getByLabelText('Kurzform');
    await user.type(shortField, 'Mag.');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(screen.getByText('Mag.')).toBeInTheDocument());

    const editButtons = screen.getAllByLabelText('Titel bearbeiten');
    await user.click(editButtons[0]!);
    const editField = await screen.findByDisplayValue('Dr.');
    await user.clear(editField);
    await user.type(editField, 'Dr. med.');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(screen.getByText('Dr. med.')).toBeInTheDocument());
  });

  it('shows the delete-refused error when an academic title is still in use', async () => {
    server.use(
      http.delete('/api/v1/academic_titles/:id', () =>
        HttpResponse.json({ error: 'unprocessable', detail: 'Titel wird noch von Mitgliedern verwendet' }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Akademische Titel' }));
    expect(screen.getByText('Dr.')).toBeInTheDocument();

    // The District tab panel is mounted-but-hidden while Akademische Titel
    // is active, so getAllByLabelText still finds its (invisible) buttons -
    // the academic titles' delete buttons come after the two district rows.
    const deleteButtons = screen.getAllByLabelText('Löschen');
    await user.click(deleteButtons[districts.length]!);
    await user.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));

    await waitFor(() => expect(screen.getByText('Titel wird noch von Mitgliedern verwendet')).toBeInTheDocument());
    expect(screen.getByText('Dr.')).toBeInTheDocument();
  });

  it('renders the roles list with email values and updates one via the edit dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Rollen (E-Mail-Adressen)' }));
    expect(screen.getByText('Vorsitzender')).toBeInTheDocument();
    expect(screen.getByText('vorsitz@logenhelfer.de')).toBeInTheDocument();
    expect(screen.getByText('Schatzmeister')).toBeInTheDocument();

    const editButtons = screen.getAllByLabelText('E-Mail bearbeiten');
    await user.click(editButtons[1]!);
    const emailField = screen.getByLabelText('E-Mail-Adresse');
    await user.type(emailField, 'schatzmeister@logenhelfer.de');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(screen.getByText('schatzmeister@logenhelfer.de')).toBeInTheDocument());
  });
});
