import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfRounded';
import RssFeedIcon from '@mui/icons-material/RssFeedRounded';
import CakeIcon from '@mui/icons-material/CakeRounded';
import { useTranslation } from 'react-i18next';
import { usePublicWorkingplan } from '../features/public-calendar/api';
import { useLandingConfig } from '../features/public-landing/api';

export default function PublicCalendarPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = usePublicWorkingplan();
  const { data: landing } = useLandingConfig();

  if (isLoading) return null;

  const hasRows = Boolean(data?.rows.length);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('publicCalendar.heading')}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button size="small" startIcon={<PictureAsPdfIcon />} component="a" href="/arbeitsplan.pdf">
          {t('publicCalendar.exportPdf')}
        </Button>
        <Button size="small" startIcon={<RssFeedIcon />} component="a" href="/arbeitsplan.ics">
          {t('publicCalendar.icsSubscribe')}
        </Button>
        {landing?.birthday_calendar_ics_url && (
          <Button size="small" startIcon={<CakeIcon />} component="a" href={landing.birthday_calendar_ics_url}>
            {t('publicCalendar.birthdayCalendarSubscribe')}
          </Button>
        )}
      </Stack>
      {hasRows && data ? (
        <Stack spacing={2}>
          {data.rows.map((event, i) => {
            const eventDate = new Date(`${event.date}T00:00:00`);
            const dateLabel = eventDate.toLocaleDateString(i18n.language, { dateStyle: 'medium' });
            const whenLabel = !event.whole_day && event.time ? `${dateLabel}, ${event.time}` : dateLabel;
            const dayLabel = eventDate.toLocaleDateString(i18n.language, { day: 'numeric' });
            const monthLabel = eventDate.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', '');
            return (
              <Paper key={i} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{
                  flexShrink: 0, width: 56, height: 56, borderRadius: 1,
                  bgcolor: 'primary.dark', color: '#FFFFFF',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
                >
                  <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{dayLabel}</Typography>
                  <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{monthLabel}</Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h2">{event.title}</Typography>
                  <Typography color="text.secondary">{whenLabel}</Typography>
                  {event.location && <Typography color="text.secondary">{event.location}</Typography>}
                  {event.public_description && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{event.public_description}</Typography>}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Typography color="text.secondary">{t('publicCalendar.noEvents')}</Typography>
      )}
    </Box>
  );
}
