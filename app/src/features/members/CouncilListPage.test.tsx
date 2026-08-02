import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import CouncilListPage from './CouncilListPage';
import '../../i18n';

const twoRows = [
  {
    role_display_name: 'Meister vom Stuhl',
    role_email: 'mvs@example.org',
    holder_uuid: 'u-1',
    holder_fullname: 'Zeta Muster',
    holder_phone: '030-1',
    holder_mobile: '0170-1',
  },
  {
    role_display_name: 'Sekretär',
    role_email: 'sek@example.org',
    holder_uuid: 'u-2',
    holder_fullname: 'Alpha Beispiel',
    holder_phone: '030-2',
    holder_mobile: '0170-2',
  },
];

const server = setupServer(
  http.get('/api/v1/members/members_of_council', () => HttpResponse.json({ rows: twoRows })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/members/council']}>
        <CouncilListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CouncilListPage', () => {
  it('renders a council role with its holder', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Meister vom Stuhl')).toBeInTheDocument());
    expect(screen.getByText('Zeta Muster')).toBeInTheDocument();
  });

  it('sorts rows client-side when the Amtsinhaber column header is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Zeta Muster')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Amtsinhaber/ }));
    await waitFor(() => {
      const cells = screen.getAllByRole('gridcell').filter((el) => el.getAttribute('data-field') === 'holder_fullname');
      expect(cells.map((c) => c.textContent)).toEqual(['Alpha Beispiel', 'Zeta Muster']);
    });

    await user.click(screen.getByRole('columnheader', { name: /^Amtsinhaber/ }));
    await waitFor(() => {
      const cells = screen.getAllByRole('gridcell').filter((el) => el.getAttribute('data-field') === 'holder_fullname');
      expect(cells.map((c) => c.textContent)).toEqual(['Zeta Muster', 'Alpha Beispiel']);
    });
  });

  it('renders role email, holder phone, and holder mobile as clickable tel:/mailto: links', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Zeta Muster')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'mvs@example.org' })).toHaveAttribute('href', 'mailto:mvs@example.org');
    expect(screen.getByRole('link', { name: '030-1' })).toHaveAttribute('href', 'tel:030-1');
    expect(screen.getByRole('link', { name: '0170-1' })).toHaveAttribute('href', 'tel:0170-1');
  });

  it('renders every holder of a position held by more than one person', async () => {
    // Regression test: getRowId used to key rows by role_display_name alone,
    // so a role with two holders collided and DataGrid silently dropped the
    // second row.
    server.use(
      http.get('/api/v1/members/members_of_council', () => HttpResponse.json({
        rows: [
          { role_display_name: 'zug. MvSt', role_email: null, holder_uuid: 'u-3', holder_fullname: 'Erste Person', holder_phone: '', holder_mobile: '' },
          { role_display_name: 'zug. MvSt', role_email: null, holder_uuid: 'u-4', holder_fullname: 'Zweite Person', holder_phone: '', holder_mobile: '' },
        ],
      })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Erste Person')).toBeInTheDocument());
    expect(screen.getByText('Zweite Person')).toBeInTheDocument();
  });

  it('shows the shared members navigation tabs, with Council selected', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toBeInTheDocument();
  });
});
