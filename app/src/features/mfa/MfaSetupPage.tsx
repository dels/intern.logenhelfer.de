import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MfaSetupWizard from './MfaSetupWizard';

export default function MfaSetupPage() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('mfa.setup.title')}</Typography>
      <MfaSetupWizard />
    </Box>
  );
}
