import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MfaChallengeForm from './MfaChallengeForm';
// Needed for the method-switching case below, which selects an option by
// its real translated label ("E-Mail") - without this, i18next keys render
// untranslated (e.g. "mfa.challenge.method") since nothing else in this
// file's render tree initializes it.
import '../../i18n';

describe('MfaChallengeForm', () => {
  it('submits the entered code with the selected method', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MfaChallengeForm methods={['totp', 'email']} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/code/i), '654321');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith({ method: 'totp', code: '654321', remember_device: false });
  });

  // Deferred from Task 21's review: the previous test only ever exercised
  // the default method ('totp', the first entry in `methods`) - it would
  // still pass even if the method <TextField select>'s onChange were wired
  // to nothing at all. This proves switching actually changes what's
  // submitted.
  it('submits the method the user switches to, not the default', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MfaChallengeForm methods={['totp', 'email']} onSubmit={onSubmit} />);

    // "Methode" (mfa.challenge.method) is the select's label; its options
    // are labelled via mfa.method.<key> ("Authenticator App" / "E-Mail").
    await userEvent.click(screen.getByLabelText('Methode'));
    await userEvent.click(await screen.findByRole('option', { name: 'E-Mail' }));

    await userEvent.type(screen.getByLabelText(/code/i), '111222');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith({ method: 'email', code: '111222', remember_device: false });
  });

  // Regression test for a bug found in the pre-merge branch-wide review: the
  // method selector (the only place `backup_code` can be chosen) used to be
  // wrapped in `{methods.length > 1 && (...)}`, so a user with exactly one
  // enrolled method (e.g. TOTP only) never saw the selector at all and had no
  // way to reach the backup-code option they saved specifically for the
  // "lost my device" scenario. Every earlier test in this file only ever
  // rendered with 2+ methods, which is exactly why this shipped unnoticed.
  it('still shows the method selector - and lets the user pick backup_code - with only a single enrolled method', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MfaChallengeForm methods={['totp']} onSubmit={onSubmit} />);

    // The selector must be present at all, not just have backup_code as an
    // option within an already-rendered selector.
    const select = screen.getByLabelText('Methode');
    expect(select).toBeInTheDocument();

    await userEvent.click(select);
    await userEvent.click(await screen.findByRole('option', { name: 'Backup-Code' }));

    await userEvent.type(screen.getByLabelText(/code/i), '99999999');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith({ method: 'backup_code', code: '99999999', remember_device: false });
  });
});
