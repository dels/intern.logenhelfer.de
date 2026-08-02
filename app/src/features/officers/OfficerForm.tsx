import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { usePositionRoles } from './api';
import type { OfficerInput, RoleSummary } from '../../api/types';

const officerSchema = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  role_id: z.coerce.number().optional(),
  role_email: z.string().nullable().optional(),
  lodge_slug: z.string().optional(),
});

export interface OfficerFormProps {
  defaultValues: OfficerInput;
  onSubmit: (values: OfficerInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function OfficerForm({ defaultValues, onSubmit, submitting, submitError }: OfficerFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles } = usePositionRoles();
  const { control, handleSubmit } = useForm<OfficerInput>({
    resolver: zodResolver(officerSchema) as Resolver<OfficerInput>,
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="firstname" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('officers.firstname')} error={!!fieldState.error} required />
        )} />
        <Controller name="lastname" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('officers.lastname')} error={!!fieldState.error} required />
        )} />
        <Controller name="role_id" control={control} render={({ field }) => (
          <Autocomplete
            options={roles?.rows ?? []}
            getOptionLabel={(r: RoleSummary) => r.display_name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={(roles?.rows ?? []).find((r) => r.id === field.value) ?? null}
            onChange={(_e, value) => field.onChange(value?.id)}
            renderInput={(params) => <TextField {...params} label={t('officers.role')} required />}
          />
        )} />
        <Controller name="role_email" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('officers.roleEmail')} />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('officers.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
