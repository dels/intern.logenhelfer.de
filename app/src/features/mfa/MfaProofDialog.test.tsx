import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { startAuthentication, WebAuthnError } from '@simplewebauthn/browser';
import MfaProofDialog from './MfaProofDialog';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

vi.mock('@simplewebauthn/browser', async () => {
  const actual = await vi.importActual<typeof import('@simplewebauthn/browser')>('@simplewebauthn/browser');
  return { ...actual, startAuthentication: vi.fn() };
});

const server = setupServer(
  http.post('/api/v1/mfa/proof/passkey/options', () => HttpResponse.json({ challenge: 'chal', rpId: 'localhost', allowCredentials: [] })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderDialog(props: Partial<ComponentProps<typeof MfaProofDialog>> = {}) {
  const client = new QueryClient();
  const onSubmit = props.onSubmit ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MfaProofDialog open onClose={onClose} onSubmit={onSubmit} {...props} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { onSubmit, onClose };
}

describe('MfaProofDialog', () => {
  it('submits the entered method and code', async () => {
    const { onSubmit } = renderDialog();

    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith({ method: 'totp', code: '123456' });
  });

  it('submits backup_code as the method when selected', async () => {
    const { onSubmit } = renderDialog();

    await userEvent.click(screen.getByLabelText(/methode|method/i));
    await userEvent.click(await screen.findByRole('option', { name: /backup/i }));
    await userEvent.type(screen.getByLabelText(/code/i), 'AAAAA-BBBBB');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith({ method: 'backup_code', code: 'AAAAA-BBBBB' });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const { onClose } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: /abbrechen|cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing interactive when closed', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MfaProofDialog open={false} onClose={vi.fn()} onSubmit={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument();
  });

  // Regression test: the dialog is never unmounted between uses (only `open`
  // toggles), so without an explicit reset-on-reopen, a previously typed
  // code/method selection stayed visible the next time the dialog was
  // opened - e.g. add-method proof, then remove-method proof reusing the
  // same still-mounted instance.
  it('resets the code and method fields on the closed -> open transition, not just on submit', async () => {
    const client = new QueryClient();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    await userEvent.click(screen.getByLabelText(/methode|method/i));
    await userEvent.click(await screen.findByRole('option', { name: /backup/i }));
    await userEvent.type(screen.getByLabelText(/code/i), 'AAAAA-BBBBB');
    expect(screen.getByLabelText(/code/i)).toHaveValue('AAAAA-BBBBB');

    rerender(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MfaProofDialog open={false} onClose={vi.fn()} onSubmit={onSubmit} />
        </ToastProvider>
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText(/code/i)).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    expect(onSubmit).toHaveBeenLastCalledWith({ method: 'totp', code: '' });
  });

  // Core regression coverage: a user whose only enrolled method is a passkey
  // previously had no way to re-verify at all (the dialog only ever offered
  // totp/backup_code). availableMethods drives which options actually show.
  it('offers only the given availableMethods, defaulting to the first one', async () => {
    renderDialog({ availableMethods: ['passkey', 'backup_code'] });

    // No code field for the default (passkey) selection - passkey proof
    // isn't a typed code, it's a WebAuthn ceremony.
    expect(screen.queryByLabelText(/^code$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mit passkey|passkey/i })).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/methode|method/i));
    expect(screen.queryByRole('option', { name: /^authenticator/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /backup/i })).toBeInTheDocument();
  });

  it('completes the passkey proof ceremony and submits the assertion response', async () => {
    vi.mocked(startAuthentication).mockResolvedValue({ id: 'cred-a', rawId: 'cred-a', type: 'public-key' } as never);
    const { onSubmit } = renderDialog({ availableMethods: ['passkey', 'backup_code'] });

    await userEvent.click(screen.getByRole('button', { name: /mit passkey|passkey/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ method: 'passkey', response: { id: 'cred-a', rawId: 'cred-a', type: 'public-key' } }));
  });

  it('silently does nothing when the user cancels the passkey prompt', async () => {
    vi.mocked(startAuthentication).mockRejectedValue(new WebAuthnError({ message: 'aborted', code: 'ERROR_CEREMONY_ABORTED', cause: new Error('aborted') }));
    const { onSubmit } = renderDialog({ availableMethods: ['passkey', 'backup_code'] });

    await userEvent.click(screen.getByRole('button', { name: /mit passkey|passkey/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /mit passkey|passkey/i })).not.toBeDisabled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/fehlgeschlagen|failed/i)).not.toBeInTheDocument();
  });
});
