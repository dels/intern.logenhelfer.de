import { useState } from 'react';
import { Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type MfaMethod = 'totp' | 'email' | 'backup_code';

export default function MfaChallengeForm({
  methods, onSubmit,
}: {
  methods: string[];
  onSubmit: (input: { method: MfaMethod; code: string; remember_device: boolean }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<MfaMethod>((methods[0] as MfaMethod) ?? 'totp');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <Stack spacing={2}>
      <TextField select label={t('mfa.challenge.method')} value={method} onChange={(e) => setMethod(e.target.value as MfaMethod)}>
        {methods.map((m) => <MenuItem key={m} value={m}>{t(`mfa.method.${m}`)}</MenuItem>)}
        <MenuItem value="backup_code">{t('mfa.method.backup_code')}</MenuItem>
      </TextField>
      <TextField label={t('mfa.challenge.codeLabel')} value={code} onChange={(e) => setCode(e.target.value)} />
      <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label={t('mfa.challenge.rememberDevice')} />
      <Button variant="contained" onClick={() => onSubmit({ method, code, remember_device: remember })}>{t('common.confirm')}</Button>
    </Stack>
  );
}
