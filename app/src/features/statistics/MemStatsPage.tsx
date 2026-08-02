import { Alert, Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMemStats } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { formatBytes } from '../../utils/formatBytes';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function MemStatsPage() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const { data, isLoading } = useMemStats();

  if (!abilities.statistic?.includes('mem_stats')) {
    return <Alert severity="error">{t('statistics.forbidden')}</Alert>;
  }

  if (isLoading || !data) {
    return (
      <Box>
        <StatisticsNavTabs />
        <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.memStats')}</Typography>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="text" width={280} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  const remaining = data.max_db_mem_size_bytes - data.memory_used_bytes;

  return (
    <Box>
      <StatisticsNavTabs />
      <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.memStats')}</Typography>
      <Typography sx={{ mb: 1 }}>{t('statistics.userCount', { count: data.user_count })}</Typography>
      <Typography sx={{ mb: 1 }}>{t('statistics.eventCount', { count: data.event_count })}</Typography>
      <Typography sx={{ mb: 1 }}>{t('statistics.memoryUsed', { size: formatBytes(data.memory_used_bytes) })}</Typography>
      <Typography sx={{ mb: 1 }}>
        {remaining >= 0 ? t('statistics.memoryAvailable', { size: formatBytes(remaining) }) : t('statistics.memoryFull')}
      </Typography>
      <Typography sx={{ mb: 1 }}>
        {t('statistics.memoryUsedInclArchived', { size: formatBytes(data.memory_used_incl_archived_bytes) })}
      </Typography>
    </Box>
  );
}
