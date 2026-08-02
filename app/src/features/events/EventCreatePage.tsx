import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EventForm from './EventForm';
import { useCreateEvent, useEventDefaults } from './api';
import { apiErrorMessage } from '../../api/client';
import type { EventInput } from '../../api/types';

const emptyEvent: EventInput = { title: '', date: '', whole_day: false };

export default function EventCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateEvent();
  const { data: defaults, isLoading } = useEventDefaults();
  // EventForm (below) independently subscribes to this exact same
  // ['events', 'defaults'] query for its own begin/end-time shifting logic
  // (see EventForm.tsx). For a caller who lacks 'create' ability on Event (a
  // plain member hitting this route directly - the form still renders
  // regardless of role, the backend's ability check is the sole enforcement
  // point), that endpoint 403s and the query never acquires data. TanStack
  // Query has no persisted "settled" state for a query that's never had
  // data: every additional observer that mounts on such a query - i.e. this
  // form mounting for the first time below - triggers a genuine new fetch,
  // which reports back through `isLoading` here too (shared cache entry) as
  // if this were the very first load again. Gating the render on raw
  // `isLoading` therefore unmounts the form the instant it appears, which
  // un-mounts the form's own observer, which lets it mount again next
  // settle, forever - a real, confirmed infinite render loop (see the
  // identical, first-discovered case in ExternalEventCreatePage.tsx).
  // Latching on the first resolution and never re-blocking afterwards
  // breaks the cycle: the form only has to survive being mounted once for
  // its own observer to stop toggling in and out of existence.
  const hasLoadedOnceRef = useRef(false);
  if (!isLoading) hasLoadedOnceRef.current = true;

  if (!hasLoadedOnceRef.current) return null;

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('events.create')}</Typography>
      <EventForm
        defaultValues={{ ...emptyEvent, location: defaults?.location ?? '' }}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (event) => navigate(`/events/${event.uuid}`) })}
      />
    </>
  );
}
