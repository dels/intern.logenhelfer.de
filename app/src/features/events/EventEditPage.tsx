import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EventForm from './EventForm';
import { useEvent, useUpdateEvent } from './api';
import { apiErrorMessage } from '../../api/client';
import type { EventInput } from '../../api/types';

export default function EventEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('EventEditPage requires a :uuid route param');
  const { data: event, isLoading } = useEvent(uuid);
  const { mutate, isPending, error } = useUpdateEvent(uuid);

  if (isLoading || !event) return null;

  const defaultValues: EventInput = {
    title: event.title,
    date: event.date,
    time: event.time,
    whole_day: event.whole_day,
    location: event.location,
    public_description: event.public_description,
    private_description: event.private_description,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('events.edit')}</Typography>
      <EventForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/events/${uuid}`) })}
      />
    </>
  );
}
