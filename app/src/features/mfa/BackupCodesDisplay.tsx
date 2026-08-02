import { Alert, Box, List, ListItem, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function BackupCodesDisplay({ codes }: { codes: string[] }) {
  const { t } = useTranslation();
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>{t('mfa.backupCodes.warning')}</Alert>
      <List dense>
        {codes.map((code) => (
          <ListItem key={code}><Typography component="code">{code}</Typography></ListItem>
        ))}
      </List>
    </Box>
  );
}
