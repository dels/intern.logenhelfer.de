import { useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import BijouLogo from '../../components/BijouLogo';
import { useLandingConfig } from '../public-landing/api';
import { useUploadLogo, useResetLogo } from './api';
import { apiErrorMessage } from '../../api/client';
import bijou from '../../assets/bijou.png';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/svg+xml';

export default function LogoSection() {
  const { t } = useTranslation();
  const { data: landingConfig } = useLandingConfig();
  const { mutateAsync: uploadLogo, isPending: uploading, error: uploadError } = useUploadLogo();
  const { mutate: resetLogo, isPending: resetting } = useResetLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    try {
      await uploadLogo(file);
    } catch {
      // Swallow: useUploadLogo's `error` (uploadError) already reactively
      // tracks and renders the failure below. This catch exists only so
      // the rejection doesn't surface as an unhandled promise rejection.
    }
  }

  const hasCustomLogo = Boolean(landingConfig?.logo_version);

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>{t('configuration.logoHeader')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('configuration.logoDescription')}</Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <BijouLogo defaultSrc={bijou} width={56} height={74} />
        <Box
          component="button"
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); void handleFiles(e.dataTransfer.files); }}
          sx={{
            font: 'inherit',
            color: 'inherit',
            bgcolor: isDragOver ? 'action.hover' : 'transparent',
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 2,
            flex: 1,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            hidden
            aria-label={t('configuration.logoUpload')}
            onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }}
          />
          {uploading ? <CircularProgress size={20} /> : <Typography color="text.secondary">{t('configuration.logoUpload')}</Typography>}
        </Box>
      </Stack>

      {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(uploadError)}</Alert>}

      <Button variant="outlined" disabled={!hasCustomLogo || resetting} onClick={() => resetLogo()}>
        {t('configuration.logoReset')}
      </Button>
    </Box>
  );
}
