import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useTranslation } from 'react-i18next';
import { useEvent, useDeleteEvent, useRegisterEventParticipant, useRemoveEventParticipant } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/formatDate';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';

export default function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities, user } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('EventDetailPage requires a :uuid route param');
  const { data: event, isLoading } = useEvent(uuid);
  useSetBreadcrumb(event ? [
    { label: t('nav.events'), to: '/events' },
    { label: event.title },
  ] : null);
  const { mutate: deleteEvent, isPending: deleting, error: deleteError } = useDeleteEvent();
  const { mutate: register, isPending: registering, error: registerError } = useRegisterEventParticipant(uuid, event?.title ?? '');
  const { mutate: unregister, isPending: unregistering, error: unregisterError } = useRemoveEventParticipant(uuid);
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !event) return null;

  const canManage = abilities.event?.includes('update') || abilities.event?.includes('destroy');
  const ownRegistration = event.participants.find((p) => p.uuid === user?.uuid);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{event.title}</Typography>
        {canManage && (
          <Stack direction="row" spacing={1}>
            {abilities.event?.includes('update') && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/events/${uuid}/edit`)}>
                {t('events.edit')}
              </Button>
            )}
            {abilities.event?.includes('destroy') && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteEvent(uuid, { onSuccess: () => navigate('/events') })}>
                  {t('events.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('events.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      {registerError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(registerError)}</Alert>}
      {unregisterError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(unregisterError)}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Typography>{formatDate(event.date, i18n.language)} {event.time ?? ''}</Typography>
          {event.location && <Typography color="text.secondary">{event.location}</Typography>}
          {event.public_description && <Typography sx={{ mt: 2 }}>{event.public_description}</Typography>}

          <Box sx={{ mt: 2 }}>
            {!ownRegistration ? (
              <Button variant="contained" size="large" startIcon={<HowToRegIcon />} disabled={registering} onClick={() => register({})}>
                {t('events.register')}
              </Button>
            ) : (
              <Button variant="outlined" color="error" size="large" startIcon={<EventBusyIcon />} disabled={unregistering} onClick={() => unregister(ownRegistration.uuid)}>
                {t('events.unregister')}
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 320 } }}>
          <Typography variant="h2" sx={{ mb: 1 }}>{t('events.participants')}</Typography>
          <List>
            {event.participants.map((p) => (
              <ListItem key={p.uuid}>
                <ListItemText primary={p.fullname} />
              </ListItem>
            ))}
            {event.participants.length === 0 && <Chip label="—" size="small" />}
          </List>
        </Box>
      </Stack>
    </Box>
  );
}
