import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FileInfoDialog from './FileInfoDialog';
import i18n from '../../i18n';

const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [{ id: 1, name: 'Kassenwart', display_name: 'Kassenwart' }] })),
  http.get('/api/v1/attached_files/file-1', () =>
    HttpResponse.json({
      uuid: 'file-1', filename: 'satzung.pdf', content_type: 'application/pdf', content_length: 2048,
      directory_slug: 'finanzen', directory_name: 'Finanzen', category_slug: 'kassenwesen', category_name: 'Kassenwesen',
      uploader_email: 'a@b.de', role_ids: [1], created_at: '2026-07-01T12:00:00.000Z', download_count: 4,
    }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderDialog(open: boolean) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <FileInfoDialog uuid="file-1" open={open} onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe('FileInfoDialog', () => {
  it('does not fetch the file while closed', async () => {
    // Assert on whether the network request actually fired, not merely on
    // whether the UI has rendered a result yet - the latter passes trivially
    // even if `enabled` were hardcoded to `true`, since the fetch is async
    // and no `waitFor` runs before a synchronous assertion.
    let fetchCount = 0;
    server.use(
      http.get('/api/v1/attached_files/file-1', () => {
        fetchCount += 1;
        return HttpResponse.json({
          uuid: 'file-1', filename: 'satzung.pdf', content_type: 'application/pdf', content_length: 2048,
          directory_slug: 'finanzen', directory_name: 'Finanzen', category_slug: 'kassenwesen', category_name: 'Kassenwesen',
          uploader_email: 'a@b.de', role_ids: [1], created_at: '2026-07-01T12:00:00.000Z', download_count: 4,
        });
      }),
    );
    renderDialog(false);
    // Give any (incorrectly) in-flight request time to complete. The `roles`
    // request fires unconditionally, so any resulting state update must be
    // flushed inside `act` or React logs (and this suite's setup escalates
    // to a hard failure on) an "update not wrapped in act" warning.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(fetchCount).toBe(0);
    expect(screen.queryByText('a@b.de')).not.toBeInTheDocument();
  });

  it('shows uploader, download count, and role names once opened', async () => {
    renderDialog(true);
    await waitFor(() => expect(screen.getByText('a@b.de')).toBeInTheDocument());
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Kassenwart')).toBeInTheDocument();
  });

  it('renders the upload date in the app i18n language, not the browser default locale - regression test for a locale-consistency bug', async () => {
    await i18n.changeLanguage('en');
    try {
      renderDialog(true);
      await waitFor(() => expect(screen.getByText('a@b.de')).toBeInTheDocument());
      expect(screen.getByText(/Jul(y)? 1, 2026/i)).toBeInTheDocument();
    } finally {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });
});
