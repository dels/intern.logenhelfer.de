import { useRef, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUploadLogo } from './api';
import { apiErrorMessage } from '../../api/client';

export default function LogoUploadWidget() {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useUploadLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    try {
      await mutateAsync(file);
      setNonce((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>{t('configuration.logo.header')}</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          component="img"
          src={`/api/v1/public/logo/icon-192.png?v=${nonce}`}
          alt=""
          sx={{ width: 64, height: 64, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
        />
        <Button variant="outlined" disabled={isPending} onClick={() => inputRef.current?.click()}>
          {t('configuration.logo.upload')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/png,image/jpeg"
          aria-label={t('configuration.logo.upload')}
          onChange={(e) => { void handleFile(e.target.files); e.target.value = ''; }}
        />
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 1, maxWidth: 480 }}>{error}</Alert>}
    </Box>
  );
}
