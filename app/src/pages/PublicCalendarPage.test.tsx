import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicCalendarPage from './PublicCalendarPage';
import { ToastProvider } from '../notifications/ToastProvider';
import '../i18n';

const server = setupServer(
  http.get('/api/v1/public/workingplan', () =>
    HttpResponse.json({
      from: '2026-07-11', to: '2027-01-11',
      rows: [
        { title: 'Sommerfest', location: 'Garten', public_description: 'Grillen im Garten', date: '2026-07-20', whole_day: true, time: null },
        { title: 'Logenabend', location: 'Logenhaus', public_description: null, date: '2026-08-05', whole_day: false, time: '19:00' },
      ],
    }),
  ),
  http.get('/api/v1/public/landing', () =>
    HttpResponse.json({ calendar_as_landing_page: true, lodge: 'Zur Standhaftigkeit', language: 'de', logo_version: null, birthday_calendar_ics_url: '/api/v1/public/birthdays/some-secret/calendar.ics' }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  Reflect.deleteProperty(navigator, 'clipboard');
});
afterAll(() => server.close());

// jsdom has no Clipboard implementation - define it directly on the real
// `navigator` (rather than `vi.stubGlobal('navigator', {...})`) so every
// other property (userAgent, language, ...) stays intact for the rest of
// the test. Cleaned up in the afterEach above, even on assertion failure.
function stubClipboardWriteText(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PublicCalendarPage />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PublicCalendarPage', () => {
  it('renders upcoming public events without requiring auth', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByText('Grillen im Garten')).toBeInTheDocument();
  });

  it('shows the date for a whole-day event without a time', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByText('20.07.2026')).toBeInTheDocument();
  });

  it('shows the date and time for a non-whole-day event', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Logenabend')).toBeInTheDocument());
    expect(screen.getByText('05.08.2026, 19:00')).toBeInTheDocument();
  });

  it('shows an empty state when there are no events', async () => {
    server.use(http.get('/api/v1/public/workingplan', () => HttpResponse.json({ from: '2026-07-11', to: '2027-01-11', rows: [] })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Aktuell keine Termine.')).toBeInTheDocument());
  });

  it('links to the .ics subscription feed at its canonical URL', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Diesen Kalender abonnieren (.ics)' })).toHaveAttribute('href', '/arbeitsplan.ics');
  });

  it('links to the PDF export at its canonical URL', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Als PDF herunterladen' })).toHaveAttribute('href', '/arbeitsplan.pdf');
  });

  it('copies the absolute birthday-calendar URL to the clipboard and shows a toast, instead of navigating', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboardWriteText(writeText);
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());

    const button = screen.getByRole('button', { name: 'Geburtstagkalender' });
    expect(button.tagName).not.toBe('A');
    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(new URL('/api/v1/public/birthdays/some-secret/calendar.ics', window.location.origin).href);
    await waitFor(() => expect(screen.getByText('Link kopiert. Füge ihn in deiner Kalender-App als Kalenderabo hinzu.')).toBeInTheDocument());
  });

  it('shows an error toast when the clipboard write fails', async () => {
    stubClipboardWriteText(vi.fn().mockRejectedValue(new Error('denied')));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Geburtstagkalender' }));

    await waitFor(() => expect(screen.getByText('Kopieren des Links fehlgeschlagen.')).toBeInTheDocument());
  });

  it('does not show a birthday calendar button when the backend returns null', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: true, lodge: 'Zur Standhaftigkeit', language: 'de', logo_version: null, birthday_calendar_ics_url: null })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Geburtstagkalender' })).not.toBeInTheDocument();
  });

  it('vertically centers the date badge against the full row height', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    const row = screen.getByText('Sommerfest').closest('.MuiPaper-root');
    expect(row).toHaveStyle({ alignItems: 'center' });
  });
});
