import { useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { ExternalEventInput } from '../../api/types';
import { useExternalEventDefaults } from './api';
import { minutesBetween, shiftTime } from '../../utils/timeMath';

// NOTE (see ExternalEventCreatePage.tsx for the full writeup): this
// component's own useExternalEventDefaults() call is a SECOND subscriber to
// the same ['external-events','defaults'] query the create page reads to
// decide whether to render this form at all. That's fine once the query has
// resolved at least once - but keep it in mind before adding any new
// render-gating logic upstream that keys off this same query's isLoading.

// ExternalEvent validates presence of title/host/location/date/time
// (api/src/routes/externalEvents.ts's validateExternalEvent) - mirror that
// here so a missing field is caught client-side, not as a silent 422 the
// user never sees. description is the only optional field.
//
// Field types below are all `.optional()` to match the generated
// ExternalEventInput type (every field is optional there, since the API's
// request body schema itself doesn't encode requiredness) - the required-ness
// checks live in the `.superRefine` instead, following the same
// object-level-refine approach EventForm.tsx uses for its whole_day/time
// requirement.
const externalEventSchema = z
  .object({
    title: z.string().optional(),
    host: z.string().optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    end_time: z.string().optional(),
    description: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    (['title', 'host', 'location', 'date', 'time'] as const).forEach((key) => {
      if (!data[key]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'required', path: [key] });
      }
    });
  });

export interface ExternalEventFormProps {
  defaultValues: ExternalEventInput;
  onSubmit: (values: ExternalEventInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function ExternalEventForm({ defaultValues, onSubmit, submitting, submitError }: ExternalEventFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { control, handleSubmit, getValues, setValue } = useForm<ExternalEventInput>({
    resolver: zodResolver(externalEventSchema),
    defaultValues,
  });
  const { data: defaults } = useExternalEventDefaults();
  const durationMinutes = defaults?.duration_minutes ?? 60;
  // Tracks the begin-time value at focus, so blur can compute how far it
  // moved - the end-time field has no equivalent logic, which is what
  // guarantees editing end time never moves begin time.
  const beginOnFocusRef = useRef<string | null>(null);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} value={field.value ?? ''} label={t('externalEvents.title')} error={!!fieldState.error} required />
          )}
        />
        <Controller
          name="host"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} value={field.value ?? ''} label={t('externalEvents.host')} error={!!fieldState.error} required />
          )}
        />
        <Controller
          name="location"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} value={field.value ?? ''} label={t('externalEvents.location')} error={!!fieldState.error} required />
          )}
        />
        <Controller
          name="date"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} value={field.value ?? ''} type="date" label={t('externalEvents.date')} error={!!fieldState.error} required
              slotProps={{ inputLabel: { shrink: true } }} />
          )}
        />
        <Controller
          name="time"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              type="time"
              label={t('externalEvents.beginTime')}
              error={!!fieldState.error}
              required
              slotProps={{ inputLabel: { shrink: true } }}
              onFocus={() => { beginOnFocusRef.current = field.value ?? null; }}
              onBlur={() => {
                field.onBlur();
                const newBegin = field.value;
                const prevBegin = beginOnFocusRef.current;
                // Nothing in this handler should do anything unless the begin
                // time's value actually changed on this blur - both the fill
                // (empty end-time) and shift (already-filled end-time) branches
                // are scoped to "when the user changes the begin time" per spec.
                if (!newBegin || prevBegin === newBegin) return;
                const currentEnd = getValues('end_time');
                if (!currentEnd) {
                  setValue('end_time', shiftTime(newBegin, durationMinutes));
                } else if (prevBegin) {
                  // prevBegin can be '' (begin was empty at focus time) even though
                  // it differs from newBegin - that's not a real prior duration to
                  // preserve, so guard against feeding an empty string into
                  // minutesBetween (which would produce NaN and corrupt end_time).
                  setValue('end_time', shiftTime(currentEnd, minutesBetween(prevBegin, newBegin)));
                }
              }}
            />
          )}
        />
        <Controller
          name="end_time"
          control={control}
          render={({ field }) => (
            <TextField {...field} value={field.value ?? ''} type="time" label={t('externalEvents.endTime')}
              slotProps={{ inputLabel: { shrink: true } }} />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => <TextField {...field} value={field.value ?? ''} label={t('externalEvents.description')} multiline minRows={2} />}
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('externalEvents.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
