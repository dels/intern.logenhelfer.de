import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BirthdayContactDialog from './BirthdayContactDialog';
import '../../i18n';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderDialog(props: { uuid: string; open: boolean; onClose: () => void }) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BirthdayContactDialog {...props} />
    </QueryClientProvider>,
  );
}

describe('BirthdayContactDialog', () => {
  it('shows email and per-address contact info, omitting addresses with no contact fields', async () => {
    server.use(
      http.get('/api/v1/members/:uuid', () =>
        HttpResponse.json({
          uuid: 'u1', email: 'max@example.test', firstname: 'Max', lastname: 'Mustermann',
          date_of_birth: '1990-09-15', created_at: '', updated_at: '', roles: [], can_edit: false, can_destroy: false,
          can_impersonate: false, editable_fields: [], mother_lodge: null, accepted_at: null,
          addresses: [
            { id: 1, type_of_address: 0, purpose: 'Privat', street: 'Musterstr. 1', zip: '12345', city: 'Musterstadt', phone: '0123', fax: null, mobile: null, email: null },
            { id: 2, type_of_address: 1, purpose: 'Geschäftlich', street: '', zip: null, city: null, phone: null, fax: null, mobile: null, email: null },
          ],
        }),
      ),
    );
    renderDialog({ uuid: 'u1', open: true, onClose: () => {} });
    expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    expect(await screen.findByText('Privat')).toBeInTheDocument();
    expect(screen.queryByText('Geschäftlich')).not.toBeInTheDocument();
  });

  it('renders the member email and per-address phone/mobile/email as clickable tel:/mailto: links', async () => {
    server.use(
      http.get('/api/v1/members/:uuid', () =>
        HttpResponse.json({
          uuid: 'u1', email: 'max@example.test', firstname: 'Max', lastname: 'Mustermann',
          date_of_birth: '1990-09-15', created_at: '', updated_at: '', roles: [], can_edit: false, can_destroy: false,
          can_impersonate: false, editable_fields: [], mother_lodge: null, accepted_at: null,
          addresses: [
            { id: 1, type_of_address: 0, purpose: 'Privat', street: 'Musterstr. 1', zip: '12345', city: 'Musterstadt', phone: '0123', fax: null, mobile: '0170 456', email: 'privat@example.test' },
          ],
        }),
      ),
    );
    renderDialog({ uuid: 'u1', open: true, onClose: () => {} });
    expect(await screen.findByRole('link', { name: 'max@example.test' })).toHaveAttribute('href', 'mailto:max@example.test');
    expect(screen.getByRole('link', { name: 'privat@example.test' })).toHaveAttribute('href', 'mailto:privat@example.test');
    expect(screen.getByRole('link', { name: '0123' })).toHaveAttribute('href', 'tel:0123');
    expect(screen.getByRole('link', { name: '0170 456' })).toHaveAttribute('href', 'tel:0170456');
  });

  it('has exactly a top-right close icon and one visible close button', async () => {
    const onClose = vi.fn();
    server.use(http.get('/api/v1/members/:uuid', () => HttpResponse.json({ uuid: 'u1', email: 'max@example.test', firstname: 'Max', lastname: 'Mustermann', date_of_birth: null, created_at: '', updated_at: '', roles: [], can_edit: false, can_destroy: false, can_impersonate: false, editable_fields: [], mother_lodge: null, accepted_at: null, addresses: [] })));
    renderDialog({ uuid: 'u1', open: true, onClose });
    const closeButtons = await screen.findAllByRole('button', { name: /schließen|close/i });
    expect(closeButtons).toHaveLength(2);
    await userEvent.click(closeButtons[closeButtons.length - 1]!);
    expect(onClose).toHaveBeenCalled();
  });
});
