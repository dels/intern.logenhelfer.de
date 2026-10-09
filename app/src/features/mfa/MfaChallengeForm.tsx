import { useState } from 'react';
import { Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { WebAuthnError } from '@simplewebauthn/browser';

export type MfaMethod = 'totp' | 'email' | 'backup_code';

export default function MfaChallengeForm({
  methods, onSubmit, onPasskeySubmit, onSendEmailCode,
}: {
  methods: string[];
  onSubmit: (input: { method: MfaMethod; code: string; remember_device: boolean }) => Promise<void>;
  onPasskeySubmit?: (rememberDevice: boolean) => Promise<void>;
  onSendEmailCode?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<string>(methods[0] ?? 'totp');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeError, setEmailCodeError] = useState(false);

  async function handlePasskeyVerify() {
    if (!onPasskeySubmit) return;
    setVerifyingPasskey(true);
    try {
      await onPasskeySubmit(remember);
    } catch (err) {
      if (!(err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED')) throw err;
    } finally {
      setVerifyingPasskey(false);
    }
  }

  async function handleSendEmailCode() {
    if (!onSendEmailCode) return;
    setEmailCodeError(false);
    try {
      await onSendEmailCode();
      setEmailCodeSent(true);
    } catch {
      setEmailCodeError(true);
    }
  }

  return (
    <Stack spacing={2}>
      <TextField select label={t('mfa.challenge.method')} value={method} onChange={(e) => { setMethod(e.target.value); setEmailCodeSent(false); setEmailCodeError(false); }}>
        {methods.map((m) => <MenuItem key={m} value={m}>{t(`mfa.method.${m}`)}</MenuItem>)}
        <MenuItem value="backup_code">{t('mfa.method.backup_code')}</MenuItem>
      </TextField>
      {method === 'email' && (
        <Button variant="outlined" onClick={handleSendEmailCode}>{t('mfa.challenge.sendEmailCode')}</Button>
      )}
      {method === 'email' && emailCodeSent && <span>{t('mfa.challenge.emailCodeSent')}</span>}
      {method === 'email' && emailCodeError && <span>{t('mfa.challenge.emailCodeSendFailed')}</span>}
      {method !== 'passkey' && (
        <TextField label={t('mfa.challenge.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} />
      )}
      <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label={t('mfa.challenge.rememberDevice')} />
      {method === 'passkey' ? (
        <Button
          variant="contained"
          onClick={handlePasskeyVerify}
          disabled={verifyingPasskey}
          startIcon={verifyingPasskey ? <CircularProgress size={16} /> : undefined}
        >
          {t('mfa.challenge.verifyWithPasskey')}
        </Button>
      ) : (
        <Button variant="contained" onClick={() => onSubmit({ method: method as MfaMethod, code, remember_device: remember })}>{t('common.confirm')}</Button>
      )}
    </Stack>
  );
}
