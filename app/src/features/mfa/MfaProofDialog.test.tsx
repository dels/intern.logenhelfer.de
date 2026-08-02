import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MfaProofDialog from './MfaProofDialog';
import '../../i18n';

describe('MfaProofDialog', () => {
  it('submits the entered method and code', async () => {
    const onSubmit = vi.fn();
    render(<MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith({ method: 'totp', code: '123456' });
  });

  it('submits backup_code as the method when selected', async () => {
    const onSubmit = vi.fn();
    render(<MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByLabelText(/methode|method/i));
    await userEvent.click(await screen.findByRole('option', { name: /backup/i }));
    await userEvent.type(screen.getByLabelText(/code/i), 'AAAAA-BBBBB');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    expect(onSubmit).toHaveBeenCalledWith({ method: 'backup_code', code: 'AAAAA-BBBBB' });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<MfaProofDialog open onClose={onClose} onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /abbrechen|cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing interactive when closed', () => {
    render(<MfaProofDialog open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument();
  });

  // Regression test: the dialog is never unmounted between uses (only `open`
  // toggles), so without an explicit reset-on-reopen, a previously typed
  // code/method selection stayed visible the next time the dialog was
  // opened - e.g. add-method proof, then remove-method proof reusing the
  // same still-mounted instance.
  it('resets the code and method fields on the closed -> open transition, not just on submit', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByLabelText(/methode|method/i));
    await userEvent.click(await screen.findByRole('option', { name: /backup/i }));
    await userEvent.type(screen.getByLabelText(/code/i), 'AAAAA-BBBBB');
    expect(screen.getByLabelText(/code/i)).toHaveValue('AAAAA-BBBBB');

    rerender(<MfaProofDialog open={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    rerender(<MfaProofDialog open onClose={vi.fn()} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/code/i)).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    expect(onSubmit).toHaveBeenLastCalledWith({ method: 'totp', code: '' });
  });
});
