import { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { subscribe } from '../api/serverStatus';

export default function ServerStatusBanner() {
  const { t } = useTranslation();
  const [down, setDown] = useState(false);

  useEffect(() => subscribe(setDown), []);

  if (!down) return null;

  return (
    <Alert severity="error" sx={{ borderRadius: 0 }}>
      {t('common.serverUnavailable')}
    </Alert>
  );
}
