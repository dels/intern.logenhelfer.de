import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function StatisticsIndexPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.indexTitle')}</Typography>
      <StatisticsNavTabs />
    </Box>
  );
}
