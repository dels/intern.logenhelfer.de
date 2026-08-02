import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ExternalEventForm from './ExternalEventForm';
import { useExternalEvent, useUpdateExternalEvent } from './api';
import { apiErrorMessage } from '../../api/client';
import type { ExternalEventInput } from '../../api/types';

export default function ExternalEventEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('ExternalEventEditPage requires a :uuid route param');
  const { data: event, isLoading } = useExternalEvent(uuid);
  const { mutate, isPending, error } = useUpdateExternalEvent(uuid);

  if (isLoading || !event) return null;

  const defaultValues: ExternalEventInput = {
    title: event.title,
    host: event.host ?? '',
    location: event.location,
    date: event.date,
    time: event.time ?? '',
    description: event.description,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('externalEvents.edit')}</Typography>
      <ExternalEventForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/external-events/${uuid}`) })}
      />
    </>
  );
}
