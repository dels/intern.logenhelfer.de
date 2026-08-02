import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useRoles } from '../categories/api';
import type { DirectoryInput, RoleSummary } from '../../api/types';

const directorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category_slug: z.string().optional(),
  role_ids: z.array(z.number()).optional(),
});

export interface DirectoryFormProps {
  defaultValues: DirectoryInput;
  onSubmit: (values: DirectoryInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function DirectoryForm({ defaultValues, onSubmit, submitting, submitError }: DirectoryFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles } = useRoles();
  const { control, handleSubmit } = useForm<DirectoryInput>({
    resolver: zodResolver(directorySchema) as Resolver<DirectoryInput>,
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="name" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('directories.name')} error={!!fieldState.error} required />
        )} />
        <Controller name="description" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('directories.description')} multiline minRows={2} />
        )} />
        <Controller name="role_ids" control={control} render={({ field }) => (
          <Autocomplete
            multiple
            options={roles?.rows ?? []}
            getOptionLabel={(r: RoleSummary) => r.display_name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={(roles?.rows ?? []).filter((r) => (field.value ?? []).includes(r.id))}
            onChange={(_e, value) => field.onChange(value.map((r) => r.id))}
            renderInput={(params) => <TextField {...params} label={t('directories.roles')} />}
          />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('directories.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
