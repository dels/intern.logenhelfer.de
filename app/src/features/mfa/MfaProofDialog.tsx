import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { MfaSetupProof } from './api';

export default function MfaProofDialog({
  open, onClose, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (proof: MfaSetupProof) => void;
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'totp' | 'backup_code'>('totp');
  const [code, setCode] = useState('');

  // The dialog is never unmounted between uses (only `open` toggles), so
  // without this it'd still show whatever was typed the last time it was
  // open. Reset on the closed->open transition, not on every render.
  useEffect(() => {
    if (open) {
      setMethod('totp');
      setCode('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('mfa.security.proofDialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label={t('mfa.challenge.method')} value={method} onChange={(e) => setMethod(e.target.value as 'totp' | 'backup_code')}>
            <MenuItem value="totp">{t('mfa.method.totp')}</MenuItem>
            <MenuItem value="backup_code">{t('mfa.method.backup_code')}</MenuItem>
          </TextField>
          <TextField label={t('mfa.challenge.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => onSubmit({ method, code })}>{t('common.confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
}
