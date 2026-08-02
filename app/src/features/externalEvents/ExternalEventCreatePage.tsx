import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ExternalEventForm from './ExternalEventForm';
import { useCreateExternalEvent, useExternalEventDefaults } from './api';
import { apiErrorMessage } from '../../api/client';
import type { ExternalEventInput } from '../../api/types';

const emptyExternalEvent: ExternalEventInput = { title: '', host: '', location: '', date: '', time: '', description: null };

export default function ExternalEventCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateExternalEvent();
  const { data: defaults, isLoading } = useExternalEventDefaults();
  // ExternalEventForm (below) independently subscribes to this exact same
  // ['external-events', 'defaults'] query (it needs duration_minutes for its
  // own begin/end-time shifting logic - see that file). For a caller who
  // lacks 'create' ability on ExternalEvent (a plain member hitting this
  // route directly - the form still renders regardless of role, see
  // authorization-boundaries.spec.ts), that endpoint 403s and the query
  // never acquires data. TanStack Query has no persisted "settled" state for
  // a query that's never had data: every additional observer that mounts on
  // such a query - i.e. this form mounting for the first time below -
  // triggers a genuine new fetch, which reports back through `isLoading`
  // here too (shared cache entry) as if this were the very first load again.
  // Gating the render on raw `isLoading` therefore unmounts the form the
  // instant it appears, which un-mounts the form's own observer, which lets
  // it mount again next settle, forever - a real, confirmed infinite
  // render loop (thousands of renders/sec), not a hypothetical one. Latching
  // on the first resolution and never re-blocking afterwards breaks the
  // cycle: the form only has to survive being mounted once for its own
  // observer to stop toggling in and out of existence.
  const hasLoadedOnceRef = useRef(false);
  if (!isLoading) hasLoadedOnceRef.current = true;

  if (!hasLoadedOnceRef.current) return null;

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('externalEvents.create')}</Typography>
      <ExternalEventForm
        defaultValues={{ ...emptyExternalEvent, location: defaults?.location ?? '' }}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (created) => navigate(`/external-events/${created.uuid}`) })}
      />
    </>
  );
}
