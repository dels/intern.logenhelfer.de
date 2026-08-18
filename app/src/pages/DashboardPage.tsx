import { Link as RouterLink, useNavigate } from 'react-router';
import {
  Alert, Box, Button, Card, CardContent, LinearProgress, Link, List, ListItem, ListItemButton, ListItemText, Skeleton, Stack, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAnnouncements } from '../features/announcements/api';
import { useAuth } from '../auth/AuthProvider';
import { useMembers } from '../features/members/api';
import { useEvents, toLocalDateString } from '../features/events/api';
import { useSeekers, useSeekerNames } from '../features/seekers/api';
import { useMemStats } from '../features/statistics/api';
import MfaSetupBanner from '../features/mfa/MfaSetupBanner';
import { formatDate } from '../utils/formatDate';
import { formatBytes } from '../utils/formatBytes';
import type { EventList } from '../api/types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, abilities } = useAuth();
  const todayStr = toLocalDateString(new Date());
  const { data: eventsData, isLoading: eventsLoading } = useEvents(0, 4, 'date', todayStr);

  return (
    <Box>
      <Typography variant="h1">{t('nav.dashboard')}</Typography>
      {user && <Typography sx={{ mt: 1 }}>{t('dashboard.welcome', { name: `${user.firstname} ${user.lastname}` })}</Typography>}
      {abilities.attached_file?.includes('manage') && <StorageBanner />}
      <MfaSetupBanner />
      <Box sx={{
        mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, maxWidth: 800, mx: 'auto',
      }}
      >
        <RecentAnnouncements />
        <UpcomingEventsCard eventsData={eventsData} isLoading={eventsLoading} />
        <MembersStatCard />
        {(abilities.seeker?.includes('read') || abilities.seeker?.includes('names_list')) && <SeekersStatCard />}
      </Box>
    </Box>
  );
}

function StatCard({ value, label, sub, to, linkLabel, isLoading }: {
  value: number | undefined; label: string; sub?: string; to: string; linkLabel: string; isLoading?: boolean;
}) {
  return (
    <Card sx={{ minWidth: 160, flex: '1 1 160px' }}>
      <CardContent>
        {isLoading ? <Skeleton variant="text" width={60} height={48} /> : <Typography variant="h3" component="div">{value ?? 0}</Typography>}
        <Typography color="text.secondary">{label}</Typography>
        {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>}
        <Link component={RouterLink} to={to} sx={{ mt: 1, display: 'block' }}>{linkLabel}</Link>
      </CardContent>
    </Card>
  );
}

function MembersStatCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useMembers(0, 1, 'lastname', '');
  return (
    <StatCard value={data?.row_count} isLoading={isLoading} label={t('nav.users')} to="/members" linkLabel={t('dashboard.seeAllMembers')} />
  );
}

function SeekersStatCard() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const hasFullRead = abilities.seeker?.includes('read') ?? false;
  const { data: fullData, isLoading: fullLoading } = useSeekers(0, 1, 'lastname', 'active', hasFullRead);
  const { data: namesData, isLoading: namesLoading } = useSeekerNames(!hasFullRead);
  const count = hasFullRead ? fullData?.row_count : namesData?.row_count;
  const isLoading = hasFullRead ? fullLoading : namesLoading;
  const to = hasFullRead ? '/seekers' : '/seekers/names';
  return <StatCard value={count} isLoading={isLoading} label={t('nav.seekers')} to={to} linkLabel={t('dashboard.seeAllSeekers')} />;
}

function StorageBanner() {
  const { t } = useTranslation();
  const { data } = useMemStats();

  if (!data || !data.max_db_mem_size_bytes) return null;

  const percent = Math.round((data.memory_used_bytes / data.max_db_mem_size_bytes) * 100);

  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <Typography sx={{ mb: 1 }}>
        {t('dashboard.storage.banner', {
          percent,
          used: formatBytes(data.memory_used_bytes),
          max: formatBytes(data.max_db_mem_size_bytes),
        })}
      </Typography>
      <LinearProgress variant="determinate" value={percent} color="warning" />
    </Alert>
  );
}

function UpcomingEventsCard({ eventsData, isLoading }: { eventsData?: EventList; isLoading: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) return null;

  const rows = eventsData?.rows ?? [];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h2">{t('dashboard.upcomingEventsTitle')}</Typography>
          <Link component="button" onClick={() => navigate('/events')}>{t('dashboard.openWorkingplan')}</Link>
        </Box>
        {rows.length ? (
          <List disablePadding>
            {rows.map((event, i) => {
              const dateLabel = formatDate(event.date, i18n.language, { dateStyle: 'medium' });
              const whenLabel = event.whole_day ? t('events.wholeDay') : (event.time ?? '');
              const secondary = [whenLabel, event.location].filter(Boolean).join(' · ');
              return (
                <ListItem key={event.uuid} divider={i < rows.length - 1} disableGutters>
                  <ListItemText primary={`${dateLabel} · ${event.title}`} secondary={secondary || undefined} />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography color="text.secondary">{t('dashboard.stats.noUpcomingEvents')}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function RecentAnnouncements() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useAnnouncements(0, 5);

  if (isLoading) return null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h2">{t('dashboard.recentAnnouncements')}</Typography>
          <Link component="button" onClick={() => navigate('/announcements')}>{t('dashboard.seeAllAnnouncements')}</Link>
        </Box>
        {data?.rows.length ? (
          <List disablePadding>
            {data.rows.map((announcement, i) => (
              <ListItemButton
                key={announcement.uuid}
                divider={i < data.rows.length - 1}
                onClick={() => navigate(`/announcements/${announcement.uuid}`)}
              >
                <ListItemText
                  primary={announcement.title}
                  secondary={new Date(announcement.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">{t('dashboard.noAnnouncements')}</Typography>
        )}
        <Stack sx={{ mt: 1 }}>
          <Button variant="text" onClick={() => navigate('/announcements')}>{t('dashboard.seeAllAnnouncements')}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
