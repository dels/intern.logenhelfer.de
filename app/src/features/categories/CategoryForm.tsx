import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useRoles } from './api';
import type { CategoryInput, RoleSummary } from '../../api/types';

const categorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  role_ids: z.array(z.number()).optional(),
});

export interface CategoryFormProps {
  defaultValues: CategoryInput;
  onSubmit: (values: CategoryInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function CategoryForm({ defaultValues, onSubmit, submitting, submitError }: CategoryFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles } = useRoles();
  const { control, handleSubmit } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryInput>,
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="name" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('categories.name')} error={!!fieldState.error} required />
        )} />
        <Controller name="description" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label={t('categories.description')} multiline minRows={2} />
        )} />
        <Controller name="role_ids" control={control} render={({ field }) => (
          <Autocomplete
            multiple
            options={roles?.rows ?? []}
            getOptionLabel={(r: RoleSummary) => r.display_name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={(roles?.rows ?? []).filter((r) => (field.value ?? []).includes(r.id))}
            onChange={(_e, value) => field.onChange(value.map((r) => r.id))}
            renderInput={(params) => <TextField {...params} label={t('categories.roles')} />}
          />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('categories.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
