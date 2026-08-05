import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, CircularProgress, Stack, TextField, Typography, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import { useDemoMode } from '../../api/useDemoMode';
import { useToast } from '../../notifications/useToast';
import { useAuth } from '../../auth/AuthProvider';
import { useMfaStatus, useStartMfaSetup, useVerifyTotpSetup, useVerifyEmailSetup, useVerifyPasskeySetup, useRemoveMfaMethod, useRemoveMfaPasskey, useMfaPasskeyCredentials } from './api';
import type { MfaSetupProof } from './api';
import MfaProofDialog from './MfaProofDialog';
import BackupCodesDisplay from './BackupCodesDisplay';

type Step = 'choose' | 'totp' | 'email' | 'done';

export default function MfaSetupWizard({ mode = 'initial' }: { mode?: 'initial' | 'manage' }) {
  const { t } = useTranslation();
  const demo = useDemoMode();
  const toast = useToast();
  const [step, setStep] = useState<Step>('choose');
  const [code, setCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [pendingProofFor, setPendingProofFor] = useState<'totp' | 'passkey' | null>(null);
  const [removingMethod, setRemovingMethod] = useState<{ kind: 'totp' | 'email' } | { kind: 'passkey'; credentialId: string } | null>(null);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const start = useStartMfaSetup();
  const verifyTotp = useVerifyTotpSetup();
  const verifyEmail = useVerifyEmailSetup();
  const verifyPasskey = useVerifyPasskeySetup();
  const status = useMfaStatus({ enabled: mode === 'manage' });
  const passkeys = useMfaPasskeyCredentials({ enabled: mode === 'manage' });
  const removeMethod = useRemoveMfaMethod();
  const removePasskey = useRemoveMfaPasskey();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  async function handleContinue() {
    if (mode === 'manage') {
      setStep('choose');
      setBackupCodes([]);
      return;
    }
    await refreshUser();
    navigate('/dashboard', { replace: true });
  }

  const existingMethods = mode === 'manage' ? (status.data?.methods ?? []) : [];
  // Defense in depth per the design spec's Data flow section: the server
  // (Task 2/3's wouldBeLastMethodAndMandatoryPastGrace) is the actual
  // authority and returns 422 regardless of this client-side state - this
  // only pre-empts a doomed request with an explanatory tooltip instead of
  // a round-trip error.
  const totalMethodCount = existingMethods.filter((m) => m !== 'passkey').length + (passkeys.data?.credentials.length ?? 0);
  // Re-verification must offer every method the user actually has enrolled,
  // not a fixed totp/backup_code pair - a passkey-only user otherwise has no
  // way to prove their identity at all. backup_code is always available once
  // any method is enrolled (see ensureBackupCodesExist server-side).
  const availableProofMethods = [
    ...(existingMethods.includes('totp') ? (['totp'] as const) : []),
    ...((passkeys.data?.credentials.length ?? 0) > 0 ? (['passkey'] as const) : []),
    'backup_code' as const,
  ];
  const gracePeriodPassed =
    status.data?.mode === 'mandatory' &&
    (!status.data.grace_period_ends_at || new Date(status.data.grace_period_ends_at).getTime() < Date.now());
  const removalBlocked = Boolean(gracePeriodPassed) && totalMethodCount <= 1;

  async function startTotpOrEmail(method: 'totp' | 'email', proof?: MfaSetupProof) {
    const result = await start.mutateAsync({ method, proof });
    if (method === 'totp') {
      setQrDataUrl(result.qr_code_data_url ?? null);
      setStep('totp');
    } else {
      setStep('email');
    }
  }

  async function startPasskey(proof?: MfaSetupProof) {
    // Split into two stages so a proof-gated `start` failure (wrong TOTP/
    // backup code - a 422) doesn't get reported as a generic "passkey
    // registration failed", matching how the totp branch's confirmAddProof
    // already distinguishes these (see below). Only show proofFailed when a
    // proof was actually supplied - `startPasskey()` is also called with no
    // proof at all on the primary first-enrollment path (`mode='initial'`,
    // where existingMethods is always empty), and a plain `start` failure
    // there hasn't verified anything, so proofFailed would be just as
    // misleading there as passkeyFailed is for a proof failure.
    let options: Awaited<ReturnType<typeof start.mutateAsync>>;
    try {
      options = await start.mutateAsync({ method: 'passkey', proof });
    } catch {
      toast.error(t(proof ? 'mfa.security.proofFailed' : 'mfa.setup.passkeyFailed'));
      return;
    }
    // Covers both the browser's own passkey prompt and the subsequent verify
    // round-trip, so the choose-method screen doesn't just sit there with no
    // feedback until the backup codes suddenly appear.
    setIsRegisteringPasskey(true);
    try {
      const response = await startRegistration({ optionsJSON: options as never });
      const result = await verifyPasskey.mutateAsync({ response });
      setBackupCodes(result.backup_codes);
      setStep('done');
    } catch (err) {
      // A WebAuthnError with this code means the user dismissed/cancelled
      // the browser's own passkey prompt (or it timed out) - not a real
      // failure worth alarming them with an error banner, matching
      // LoginPage.handlePasskeyLogin's identical handling.
      if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') {
        return;
      }
      toast.error(t('mfa.setup.passkeyFailed'));
    } finally {
      setIsRegisteringPasskey(false);
    }
  }

  // Note: mode='initial' only covers a user's very first enrollment (no
  // existing verified method yet), so it never needs to supply `proof` here -
  // see useStartMfaSetup's own doc comment for the scope boundary.
  async function choose(method: 'totp' | 'email' | 'passkey') {
    if (demo) {
      toast.error(t('mfa.demoUnavailable'));
      return;
    }
    if ((method === 'totp' || method === 'passkey') && existingMethods.length > 0) {
      setPendingProofFor(method);
      return;
    }
    if (method === 'email') {
      await startTotpOrEmail('email');
    } else if (method === 'totp') {
      await startTotpOrEmail('totp');
    } else {
      await startPasskey();
    }
  }

  async function confirmAddProof(proof: MfaSetupProof) {
    const method = pendingProofFor!;
    setPendingProofFor(null);
    if (method === 'totp') {
      try {
        await startTotpOrEmail('totp', proof);
      } catch {
        toast.error(t('mfa.security.proofFailed'));
      }
    } else {
      await startPasskey(proof);
    }
  }

  async function confirmRemoveProof(proof: MfaSetupProof) {
    const target = removingMethod!;
    setRemovingMethod(null);
    try {
      if (target.kind === 'passkey') {
        await removePasskey.mutateAsync({ credentialId: target.credentialId, proof });
      } else {
        await removeMethod.mutateAsync({ type: target.kind, proof });
      }
    } catch {
      toast.error(t('mfa.security.proofFailed'));
    }
  }

  async function confirmTotp() {
    const result = await verifyTotp.mutateAsync(code);
    setBackupCodes(result.backup_codes);
    setStep('done');
  }

  async function confirmEmail() {
    const result = await verifyEmail.mutateAsync(code);
    setBackupCodes(result.backup_codes);
    setStep('done');
  }

  if (isRegisteringPasskey) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress />
        <Typography>{t('mfa.setup.passkeyRegistering')}</Typography>
      </Box>
    );
  }

  if (step === 'choose') {
    return (
      <Box>
        {mode === 'manage' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>{t('mfa.security.methodsHeader')}</Typography>
            <List dense>
              {existingMethods.filter((m) => m !== 'passkey').map((m) => (
                <ListItem key={m} secondaryAction={
                  <Tooltip title={removalBlocked ? t('mfa.security.lastMethodTooltip') : ''}>
                    <span>
                      <Button size="small" disabled={removalBlocked} onClick={() => setRemovingMethod({ kind: m as 'totp' | 'email' })}>{t('mfa.security.remove')}</Button>
                    </span>
                  </Tooltip>
                }>
                  <ListItemText primary={t(`mfa.method.${m}`)} />
                </ListItem>
              ))}
              {(passkeys.data?.credentials ?? []).map((cred) => (
                <ListItem key={cred.credential_id} secondaryAction={
                  <Tooltip title={removalBlocked ? t('mfa.security.lastMethodTooltip') : ''}>
                    <span>
                      <Button size="small" disabled={removalBlocked} onClick={() => setRemovingMethod({ kind: 'passkey', credentialId: cred.credential_id })}>{t('mfa.security.remove')}</Button>
                    </span>
                  </Tooltip>
                }>
                  <ListItemText primary={cred.name} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Typography variant="h2">{t('mfa.setup.chooseMethod')}</Typography>
        <Stack spacing={2}>
          <Button variant="contained" onClick={() => choose('totp')}>{t('mfa.setup.authenticatorApp')}</Button>
          <Button variant="outlined" onClick={() => choose('email')}>{t('mfa.setup.email')}</Button>
          <Button variant="outlined" onClick={() => choose('passkey')}>{t('mfa.setup.passkey')}</Button>
        </Stack>
        <MfaProofDialog open={pendingProofFor !== null} onClose={() => setPendingProofFor(null)} onSubmit={confirmAddProof} availableMethods={availableProofMethods} />
        <MfaProofDialog open={removingMethod !== null} onClose={() => setRemovingMethod(null)} onSubmit={confirmRemoveProof} availableMethods={availableProofMethods} />
      </Box>
    );
  }

  if (step === 'totp') {
    return (
      <Stack spacing={2}>
        {qrDataUrl && <img src={qrDataUrl} alt={t('mfa.setup.qrAlt')} width={200} height={200} />}
        <TextField label={t('mfa.setup.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="contained" onClick={confirmTotp}>{t('common.confirm')}</Button>
      </Stack>
    );
  }

  if (step === 'email') {
    return (
      <Stack spacing={2}>
        <Typography>{t('mfa.setup.emailSent')}</Typography>
        <TextField label={t('mfa.setup.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="contained" onClick={confirmEmail}>{t('common.confirm')}</Button>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('mfa.setup.done')}</Typography>
      <BackupCodesDisplay codes={backupCodes} />
      <Button variant="contained" sx={{ mt: 2 }} onClick={handleContinue}>{t('mfa.setup.continue')}</Button>
    </Box>
  );
}
