import { Link as RouterLink, useNavigate } from 'react-router';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useExternalEvents } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { formatDate } from '../../utils/formatDate';

export default function ExternalEventsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { data, isLoading } = useExternalEvents(0, 100);
  const canCreate = abilities.external_event?.includes('create') ?? false;
  const rows = data?.rows ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('nav.externalEvents')}</Typography>
        {canCreate && (
          <Button component={RouterLink} to="/external-events/new" startIcon={<AddIcon />} variant="contained">
            {t('externalEvents.create')}
          </Button>
        )}
      </Box>
      {isLoading && <Typography>{t('common.loading')}</Typography>}
      {!isLoading && rows.length === 0 && (
        <Typography color="text.secondary">{t('externalEvents.empty')}</Typography>
      )}
      {!isLoading && rows.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('externalEvents.date')}</TableCell>
              <TableCell>{t('externalEvents.title')}</TableCell>
              <TableCell>{t('externalEvents.host')}</TableCell>
              <TableCell>{t('externalEvents.location')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((event) => (
              <TableRow
                key={event.uuid}
                hover
                onClick={() => navigate(`/external-events/${event.uuid}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{formatDate(event.date, i18n.language)}{event.time ? ` ${event.time}` : ''}</TableCell>
                <TableCell>
                  <RouterLink
                    to={`/external-events/${event.uuid}`}
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                  >
                    {event.title}
                  </RouterLink>
                </TableCell>
                <TableCell>{event.host}</TableCell>
                <TableCell>{event.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
