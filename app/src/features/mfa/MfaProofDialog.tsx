import { useEffect, useState } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { startAuthentication, WebAuthnError } from '@simplewebauthn/browser';
import { useToast } from '../../notifications/useToast';
import { useMfaProofPasskeyOptions } from './api';
import type { MfaSetupProof } from './api';

type ProofMethod = 'totp' | 'passkey' | 'backup_code';

export default function MfaProofDialog({
  open, onClose, onSubmit, availableMethods = ['totp', 'backup_code'],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (proof: MfaSetupProof) => void;
  availableMethods?: ProofMethod[];
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [method, setMethod] = useState<ProofMethod>(availableMethods[0] ?? 'backup_code');
  const [code, setCode] = useState('');
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);
  const getPasskeyOptions = useMfaProofPasskeyOptions();

  // The dialog is never unmounted between uses (only `open` toggles), so
  // without this it'd still show whatever was typed the last time it was
  // open. Reset on the closed->open transition, not on every render.
  useEffect(() => {
    if (open) {
      setMethod(availableMethods[0] ?? 'backup_code');
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleConfirm() {
    if (method !== 'passkey') {
      onSubmit({ method, code });
      return;
    }
    setVerifyingPasskey(true);
    try {
      const options = await getPasskeyOptions.mutateAsync();
      const response = await startAuthentication({ optionsJSON: options });
      onSubmit({ method: 'passkey', response });
    } catch (err) {
      if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') return;
      toast.error(t('mfa.security.proofFailed'));
    } finally {
      setVerifyingPasskey(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('mfa.security.proofDialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label={t('mfa.challenge.method')} value={method} onChange={(e) => setMethod(e.target.value as ProofMethod)}>
            {availableMethods.map((m) => <MenuItem key={m} value={m}>{t(`mfa.method.${m}`)}</MenuItem>)}
          </TextField>
          {method !== 'passkey' && <TextField label={t('mfa.challenge.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={verifyingPasskey} startIcon={verifyingPasskey ? <CircularProgress size={16} /> : undefined}>
          {method === 'passkey' ? t('mfa.security.verifyWithPasskey') : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
