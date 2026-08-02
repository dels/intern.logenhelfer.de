import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FileDropZone from './FileDropZone';
import '../../i18n';

function attachedFileResponse(filename: string) {
  return {
    uuid: `file-${filename}`, filename, content_type: 'text/plain', content_length: 3,
    directory_slug: 'finanzen', directory_name: 'Finanzen',
    category_slug: 'kassenwesen', category_name: 'Kassenwesen',
    uploader_email: 'a@b.de', role_ids: [1], created_at: '2026-07-01T00:00:00.000Z', download_count: 0,
  };
}

const server = setupServer(
  http.post('/api/v1/attached_files', () => HttpResponse.json(attachedFileResponse('a.pdf'), { status: 201 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderZone(roleIds: number[] = [1]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <FileDropZone directorySlug="finanzen" roleIds={roleIds} />
    </QueryClientProvider>,
  );
}

describe('FileDropZone', () => {
  it('renders the drop zone prompt', () => {
    renderZone();
    expect(screen.getByText('Dateien hierher ziehen oder klicken zum Auswählen')).toBeInTheDocument();
  });

  it('uploads a single selected file using the given roleIds and directorySlug', async () => {
    let capturedBody: FormData | undefined;
    server.use(
      http.post('/api/v1/attached_files', async ({ request }) => {
        capturedBody = await request.formData();
        return HttpResponse.json(attachedFileResponse('a.pdf'), { status: 201 });
      }),
    );
    renderZone([1, 2]);
    const file = new File(['contents'], 'a.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Dateien hierher ziehen oder klicken zum Auswählen');

    await userEvent.upload(input, file);

    await waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody!.getAll('role_ids[]')).toEqual(['1', '2']);
    expect(capturedBody!.get('directory_slug')).toBe('finanzen');
  });

  it('uploads multiple selected files one by one', async () => {
    let uploadCount = 0;
    server.use(
      http.post('/api/v1/attached_files', () => {
        uploadCount += 1;
        return HttpResponse.json(attachedFileResponse(`file-${uploadCount}`), { status: 201 });
      }),
    );
    renderZone();
    const fileA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Dateien hierher ziehen oder klicken zum Auswählen');

    await userEvent.upload(input, [fileA, fileB]);

    await waitFor(() => expect(uploadCount).toBe(2));
  });

  it('shows an inline error when an upload fails, without throwing', async () => {
    server.use(
      http.post('/api/v1/attached_files', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })),
    );
    renderZone();
    const file = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Dateien hierher ziehen oder klicken zum Auswählen');

    await userEvent.upload(input, file);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('stops the batch after the first failure instead of uploading the rest', async () => {
    let callCount = 0;
    server.use(
      http.post('/api/v1/attached_files', () => {
        callCount += 1;
        return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
      }),
    );
    renderZone();
    const fileA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Dateien hierher ziehen oder klicken zum Auswählen');

    await userEvent.upload(input, [fileA, fileB]);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(callCount).toBe(1);
  });
});
