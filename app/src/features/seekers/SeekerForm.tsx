import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { SeekerInput } from '../../api/types';

// Mirrors Seeker's own presence validations (rails-app/app/models/seeker.rb)
// for the fields this increment exposes.
const seekerSchema = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  source: z.string().nullable().optional(),
  invite: z.boolean().optional(),
  status: z.coerce.number().optional(),
  preferred_way_of_contact: z.coerce.number().optional(),
  notes: z.string().nullable().optional(),
  address: z.object({
    type_of_address: z.coerce.number().optional(),
    purpose: z.string().optional(),
    street1: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    fax: z.string().nullable().optional(),
    mobile: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
  }).optional(),
});

const STATUS_OPTIONS = [
  { value: 0, key: 'contacted' }, { value: 10, key: 'visiting' },
  { value: 20, key: 'applicationExpected' }, { value: 30, key: 'applicationReceived' },
  { value: 40, key: 'ballotageScheduled' }, { value: 50, key: 'readyForAdmission' },
  { value: 60, key: 'admissionScheduled' }, { value: 100, key: 'accepted' }, { value: 1000, key: 'declined' },
];

const CONTACT_OPTIONS = [
  { value: 10, key: 'email' }, { value: 20, key: 'phone' }, { value: 30, key: 'fax' },
  { value: 40, key: 'mobile' }, { value: 50, key: 'mail' }, { value: 100, key: 'seeRemarks' },
];

export interface SeekerFormProps {
  defaultValues: SeekerInput;
  onSubmit: (values: SeekerInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function SeekerForm({ defaultValues, onSubmit, submitting, submitError }: SeekerFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm<SeekerInput>({
    resolver: zodResolver(seekerSchema) as Resolver<SeekerInput>,
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="firstname" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.firstname')} error={!!fieldState.error} required />
        )} />
        <Controller name="lastname" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.lastname')} error={!!fieldState.error} required />
        )} />
        <Controller name="source" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.source')} />
        )} />
        <Controller name="invite" control={control} render={({ field }) => (
          <FormControlLabel control={<Checkbox checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />} label={t('seekers.invite')} />
        )} />
        <Controller name="status" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} select label={t('seekers.status')}>
            {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t(`seekers.statusOptions.${o.key}`)}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="preferred_way_of_contact" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} select label={t('seekers.preferredWayOfContact')}>
            <MenuItem value="">—</MenuItem>
            {CONTACT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t(`seekers.contactOptions.${o.key}`)}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="notes" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.notes')} multiline minRows={2} />
        )} />
        <Typography variant="h2" sx={{ mt: 2 }}>{t('seekers.address')}</Typography>
        <Controller name="address.street1" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.street')} />
        )} />
        <Controller name="address.zip" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.zip')} />
        )} />
        <Controller name="address.city" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.city')} />
        )} />
        <Controller name="address.phone" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.phone')} />
        )} />
        <Controller name="address.mobile" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.mobile')} />
        )} />
        <Controller name="address.email" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('seekers.addressFields.email')} />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('seekers.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
