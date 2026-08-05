import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicCalendarPage from './PublicCalendarPage';
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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PublicCalendarPage />
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

  it('links to the birthday calendar feed when the backend provides a URL', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Geburtstagkalender' })).toHaveAttribute('href', '/api/v1/public/birthdays/some-secret/calendar.ics');
  });

  it('does not show a birthday calendar link when the backend returns null', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: true, lodge: 'Zur Standhaftigkeit', language: 'de', logo_version: null, birthday_calendar_ics_url: null })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Geburtstagkalender' })).not.toBeInTheDocument();
  });

  it('vertically centers the date badge against the full row height', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    const row = screen.getByText('Sommerfest').closest('.MuiPaper-root');
    expect(row).toHaveStyle({ alignItems: 'center' });
  });
});
