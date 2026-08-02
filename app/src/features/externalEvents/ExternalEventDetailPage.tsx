import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  useConfirmExternalEventParticipant,
  useDeleteExternalEvent,
  useExternalEvent,
  useRegisterExternalEventParticipant,
  useRemoveExternalEventParticipant,
} from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/formatDate';

export default function ExternalEventDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities, user } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('ExternalEventDetailPage requires a :uuid route param');
  const { data: event, isLoading } = useExternalEvent(uuid);
  const { mutate: deleteEvent, isPending: deleting, error: deleteError } = useDeleteExternalEvent();
  const { mutate: register, isPending: registering, error: registerError } = useRegisterExternalEventParticipant(uuid);
  const { mutate: unregister, isPending: unregistering, error: unregisterError } = useRemoveExternalEventParticipant(uuid);
  const { mutate: confirm, isPending: confirming, error: confirmError } = useConfirmExternalEventParticipant(uuid);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading || !event) return null;

  const canManage = abilities.external_event?.includes('update') || abilities.external_event?.includes('destroy');
  // Deliberately a DIFFERENT CASL subject from `external_event`: the backend's
  // confirm route (api/src/routes/externalEvents.ts) gates on
  // `can('manage', 'ExternalEventParticipant')`, which is only granted
  // together with `manage ExternalEvent` by workingPlanAdminAbilities - NOT by
  // applicationAdminAbilities, which grants `manage ExternalEvent` alone. So
  // `canManage` (above) is the wrong gate for this button: an
  // applicationAdmin-only user would see it but get a 403 on click. `destroy`
  // (not `update`) is the discriminating action to check here - see
  // me.test.ts's "exposes external_event_participant.destroy..." test for why
  // `update` doesn't work (every degree-holding member has `update` on their
  // OWN participant record, and the abilities-map probe can't distinguish
  // "own record" from "any record" at this bare subject-type level).
  // Deliberately NOT unioned with `abilities.external_event` - that union
  // would resurrect exactly this bug for applicationAdmin-only users.
  const canConfirmParticipants = abilities.external_event_participant?.includes('destroy');
  const isIcsImported = event.ics_source_id !== null;
  const ownRegistration = event.participants.find((p) => p.user_uuid === user?.uuid);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{event.title}</Typography>
        {canManage && !isIcsImported && (
          <Stack direction="row" spacing={1}>
            {abilities.external_event?.includes('update') && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/external-events/${uuid}/edit`)}>
                {t('externalEvents.edit')}
              </Button>
            )}
            {abilities.external_event?.includes('destroy') && (
              confirmingDelete ? (
                <Button
                  color="error"
                  variant="contained"
                  disabled={deleting}
                  onClick={() => deleteEvent(uuid, { onSuccess: () => navigate('/external-events') })}
                >
                  {t('externalEvents.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmingDelete(true)}>
                  {t('externalEvents.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      {registerError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(registerError)}</Alert>}
      {unregisterError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(unregisterError)}</Alert>}
      {confirmError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(confirmError)}</Alert>}
      <Typography>{formatDate(event.date, i18n.language)} {event.time ?? ''}</Typography>
      <Typography color="text.secondary">{event.host} · {event.location}</Typography>
      {event.description && <Typography sx={{ mt: 2 }}>{event.description}</Typography>}

      <Box sx={{ mt: 2 }}>
        {!ownRegistration ? (
          <Button variant="contained" disabled={registering} onClick={() => register({})}>
            {t('externalEvents.register')}
          </Button>
        ) : (
          <Button color="error" disabled={unregistering} onClick={() => unregister(ownRegistration.user_uuid)}>
            {t('externalEvents.unregister')}
          </Button>
        )}
      </Box>

      <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>{t('externalEvents.participants')}</Typography>
      <List>
        {event.participants.map((p) => (
          <ListItem
            key={p.user_uuid}
            secondaryAction={
              canConfirmParticipants && !p.subscription_confirmed ? (
                <Button size="small" startIcon={<CheckIcon />} disabled={confirming} onClick={() => confirm(p.user_uuid)}>
                  {t('externalEvents.confirm')}
                </Button>
              ) : undefined
            }
          >
            <ListItemText
              primary={p.fullname}
              secondary={[p.festive_board ? t('externalEvents.festiveBoard') : null, p.subscription_confirmed ? t('externalEvents.confirmed') : null]
                .filter(Boolean)
                .join(' · ')}
            />
          </ListItem>
        ))}
        {event.participants.length === 0 && <Chip label="—" size="small" />}
      </List>
    </Box>
  );
}
