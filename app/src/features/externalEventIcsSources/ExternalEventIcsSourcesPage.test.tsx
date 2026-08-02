import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExternalEventIcsSourcesPage from './ExternalEventIcsSourcesPage';
import '../../i18n';

let sources: { uuid: string; name: string; url: string; created_at: string }[] = [];
let lastCreateBody: unknown = null;
let lastUpdateBody: unknown = null;
let lastSortParam: string | null = null;
let syncResponse: { created: number; updated: number; removed: number } | 'error' = { created: 2, updated: 1, removed: 0 };
let updateResponse: 'success' | 'error' = 'success';

const server = setupServer(
  http.get('/api/v1/external_event_ics_sources', ({ request }) => {
    lastSortParam = new URL(request.url).searchParams.get('sort');
    return HttpResponse.json({ rows: sources, row_count: sources.length });
  }),
  http.post('/api/v1/external_event_ics_sources', async ({ request }) => {
    const body = (await request.json()) as { name: string; url: string };
    lastCreateBody = body;
    const created = { uuid: 'new-1', name: body.name, url: body.url, created_at: '2026-01-01T00:00:00Z' };
    sources = [...sources, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('/api/v1/external_event_ics_sources/:uuid', async ({ request, params }) => {
    const body = (await request.json()) as { name?: string; url?: string };
    lastUpdateBody = body;
    if (updateResponse === 'error') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'URL zeigt auf eine nicht erlaubte Adresse' }, { status: 422 });
    }
    const existing = sources.find((s) => s.uuid === params.uuid);
    const updated = { ...existing!, ...body };
    sources = sources.map((s) => (s.uuid === params.uuid ? updated : s));
    return HttpResponse.json(updated);
  }),
  http.delete('/api/v1/external_event_ics_sources/:uuid', ({ params }) => {
    sources = sources.filter((s) => s.uuid !== params.uuid);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('/api/v1/external_event_ics_sources/:uuid/sync', () => {
    if (syncResponse === 'error') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'ICS-Datei konnte nicht geladen werden' }, { status: 422 });
    }
    return HttpResponse.json(syncResponse);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  lastCreateBody = null;
  lastUpdateBody = null;
  lastSortParam = null;
  syncResponse = { created: 2, updated: 1, removed: 0 };
  updateResponse = 'success';
});
afterAll(() => server.close());

beforeEach(() => {
  sources = [{ uuid: 's1', name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_at: '2026-01-01T00:00:00Z' }];
});

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ExternalEventIcsSourcesPage />
    </QueryClientProvider>,
  );
}

describe('ExternalEventIcsSourcesPage', () => {
  it('lists existing sources in a data table (not a plain list)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());
    expect(screen.getByText('https://example.test/cal.ics')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('requests the default sort (by name) on first load', async () => {
    renderPage();
    await waitFor(() => expect(lastSortParam).toBe('name'));
  });

  it('re-requests with the reversed sort param when the URL column header is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^URL/ }));
    await waitFor(() => expect(lastSortParam).toBe('url'));

    await user.click(screen.getByRole('columnheader', { name: /^URL/ }));
    await waitFor(() => expect(lastSortParam).toBe('-url'));
  });

  it('shows an empty state when there are no sources', async () => {
    sources = [];
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine externen ICS-Kalender konfiguriert.')).toBeInTheDocument());
  });

  it('disables the add button until both name and url are filled in', async () => {
    sources = [];
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine externen ICS-Kalender konfiguriert.')).toBeInTheDocument());

    const addButton = screen.getByRole('button', { name: 'Hinzufügen' });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Nachbarloge');
    expect(addButton).toBeDisabled();

    await user.type(screen.getByLabelText('URL'), 'https://example.test/cal.ics');
    expect(addButton).toBeEnabled();
  });

  it('submits a new source and clears the form', async () => {
    sources = [];
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine externen ICS-Kalender konfiguriert.')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Name'), 'Nachbarloge');
    await user.type(screen.getByLabelText('URL'), 'https://example.test/cal.ics');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await waitFor(() => expect(lastCreateBody).toEqual({ name: 'Nachbarloge', url: 'https://example.test/cal.ics' }));
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(''));
    expect(screen.getByLabelText('URL')).toHaveValue('');
  });

  it('removes a source on delete', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(screen.queryByText('Nachbarloge')).not.toBeInTheDocument());
  });

  it('syncs a source now and shows the created/updated/removed result', async () => {
    syncResponse = { created: 3, updated: 1, removed: 2 };
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Jetzt synchronisieren' }));

    await waitFor(() => expect(screen.getByText(/3.*1.*2/)).toBeInTheDocument());
  });

  it('invalidates both the ICS-source list and the external-events list after a successful sync', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <ExternalEventIcsSourcesPage />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Jetzt synchronisieren' }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['external-events'] })));
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['external-event-ics-sources'] }));
  });

  it('shows an error message when sync fails', async () => {
    syncResponse = 'error';
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Jetzt synchronisieren' }));

    await waitFor(() => expect(screen.getByText('ICS-Datei konnte nicht geladen werden')).toBeInTheDocument());
  });

  it('renders the Add button without flex-shrinking below its content', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());
    const addButton = screen.getByRole('button', { name: 'Hinzufügen' });
    expect(addButton).toHaveStyle({ flexShrink: '0' });
  });

  it('anchors the sync-result Snackbar bottom-center, not the default bottom-left', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Jetzt synchronisieren' }));

    await waitFor(() => expect(screen.getByText(/2.*1.*0/)).toBeInTheDocument());
    const snackbar = document.querySelector('.MuiSnackbar-root');
    expect(snackbar).toHaveClass('MuiSnackbar-anchorOriginBottomCenter');
  });

  it('edits a source\'s name and url via the edit dialog, without the action buttons overlapping the row', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));

    const dialog = within(await screen.findByRole('dialog'));
    const nameField = dialog.getByLabelText('Name');
    const urlField = dialog.getByLabelText('URL');
    expect(nameField).toHaveValue('Nachbarloge');
    expect(urlField).toHaveValue('https://example.test/cal.ics');
    await user.clear(nameField);
    await user.type(nameField, 'Neue Loge');
    await user.clear(urlField);
    await user.type(urlField, 'https://example.test/neu.ics');
    await user.click(dialog.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(lastUpdateBody).toEqual({ name: 'Neue Loge', url: 'https://example.test/neu.ics' }));
    await waitFor(() => expect(screen.getByText('Neue Loge')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels an edit without saving', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.clear(dialog.getByLabelText('Name'));
    await user.type(dialog.getByLabelText('Name'), 'Verworfen');
    await user.click(dialog.getByRole('button', { name: 'Abbrechen' }));

    expect(lastUpdateBody).toBeNull();
    expect(screen.getByText('Nachbarloge')).toBeInTheDocument();
    expect(screen.queryByText('Verworfen')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows an error and keeps the dialog open when saving fails (e.g. SSRF rejection)', async () => {
    updateResponse = 'error';
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Nachbarloge')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.clear(dialog.getByLabelText('URL'));
    await user.type(dialog.getByLabelText('URL'), 'https://internal.example.test/cal.ics');
    await user.click(dialog.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(dialog.getByText('URL zeigt auf eine nicht erlaubte Adresse')).toBeInTheDocument());
    expect(dialog.getByLabelText('URL')).toHaveValue('https://internal.example.test/cal.ics');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
