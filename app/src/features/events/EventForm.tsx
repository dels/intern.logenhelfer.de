import { useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { EventInput } from '../../api/types';
import { useEventDefaults } from './api';
import { minutesBetween, shiftTime } from '../../utils/timeMath';

// Event validates presence of `time` unless `whole_day` (rails-app/app/models/event.rb) -
// mirror that here so a missing time is caught client-side, not as a silent 422 the
// user never sees (apiFetch throws, and a mutation with no onError just sits there).
const eventSchema = z
  .object({
    title: z.string().min(1),
    date: z.string().min(1),
    time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
    whole_day: z.boolean().optional(),
    location: z.string().nullable().optional(),
    public_description: z.string().nullable().optional(),
    private_description: z.string().nullable().optional(),
  })
  .refine((data) => data.whole_day || !!data.time, {
    message: 'required',
    path: ['time'],
  });

export interface EventFormProps {
  defaultValues: EventInput;
  onSubmit: (values: EventInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function EventForm({ defaultValues, onSubmit, submitting, submitError }: EventFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { control, handleSubmit, watch, getValues, setValue } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });
  const wholeDay = watch('whole_day');
  const { data: defaults } = useEventDefaults();
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
            <TextField {...field} label={t('events.title')} error={!!fieldState.error} required />
          )}
        />
        <Controller
          name="date"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} type="date" label={t('events.date')} error={!!fieldState.error} required
              slotProps={{ inputLabel: { shrink: true } }} />
          )}
        />
        <Controller
          name="whole_day"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />}
              label={t('events.wholeDay')}
            />
          )}
        />
        {!wholeDay && (
          <>
            <Controller
              name="time"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  type="time"
                  label={t('events.beginTime')}
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
                <TextField {...field} value={field.value ?? ''} type="time" label={t('events.endTime')}
                  slotProps={{ inputLabel: { shrink: true } }} />
              )}
            />
          </>
        )}
        <Controller
          name="location"
          control={control}
          render={({ field }) => <TextField {...field} value={field.value ?? ''} label={t('events.location')} />}
        />
        <Controller
          name="public_description"
          control={control}
          render={({ field }) => (
            <TextField {...field} value={field.value ?? ''} label={t('events.publicDescription')} multiline minRows={2} />
          )}
        />
        <Controller
          name="private_description"
          control={control}
          render={({ field }) => (
            <TextField {...field} value={field.value ?? ''} label={t('events.privateDescription')} multiline minRows={2} />
          )}
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('events.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
