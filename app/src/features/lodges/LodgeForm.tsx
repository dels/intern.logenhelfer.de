import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useDistricts } from './api';
import type { DistrictSummary, LodgeInput } from '../../api/types';

const lodgeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  district_id: z.coerce.number().optional(),
});

export interface LodgeFormProps {
  defaultValues: LodgeInput;
  onSubmit: (values: LodgeInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function LodgeForm({ defaultValues, onSubmit, submitting, submitError }: LodgeFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: districts } = useDistricts();
  const { control, handleSubmit } = useForm<LodgeInput>({
    resolver: zodResolver(lodgeSchema) as Resolver<LodgeInput>,
    defaultValues,
  });

  const noDistricts = (districts?.rows.length ?? 0) === 0;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        {noDistricts && (
          <Alert severity="warning">{t('lodges.noDistricts')}</Alert>
        )}
        <Controller name="name" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('lodges.name')} error={!!fieldState.error} required />
        )} />
        <Controller name="description" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('lodges.description')} multiline minRows={2} />
        )} />
        <Controller name="district_id" control={control} render={({ field }) => (
          <Autocomplete
            options={districts?.rows ?? []}
            getOptionLabel={(d: DistrictSummary) => d.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={(districts?.rows ?? []).find((d) => d.id === field.value) ?? null}
            onChange={(_e, value) => field.onChange(value?.id)}
            renderInput={(params) => <TextField {...params} label={t('lodges.district')} required />}
          />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting || noDistricts}>
            {t('lodges.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
