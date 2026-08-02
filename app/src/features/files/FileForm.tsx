import { useForm, Controller } from 'react-hook-form';
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useRoles } from '../categories/api';
import type { RoleSummary } from '../../api/types';

export interface FileFormValues {
  filename: string;
  role_ids: number[];
}

export interface FileFormProps {
  defaultValues: FileFormValues;
  onSubmit: (values: FileFormValues) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function FileForm({ defaultValues, onSubmit, submitting, submitError }: FileFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles } = useRoles();
  const { control, handleSubmit } = useForm<FileFormValues>({ defaultValues });

  return (
    // Wrapped in a single-arg lambda rather than passed as handleSubmit(onSubmit)
    // directly: react-hook-form's handleSubmit always invokes its callback as
    // (data, event) - forwarding onSubmit as-is would call it with a second
    // SyntheticEvent argument, silently breaking the FileFormProps contract
    // (onSubmit: (values: FileFormValues) => void) - caught by
    // FileForm.test.tsx's toHaveBeenCalledWith assertion.
    <Box component="form" onSubmit={handleSubmit((values) => onSubmit(values))} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="filename" control={control} render={({ field }) => (
          <TextField {...field} label={t('files.filename')} required />
        )} />
        <Controller name="role_ids" control={control} render={({ field }) => (
          <Autocomplete
            multiple
            options={roles?.rows ?? []}
            getOptionLabel={(r: RoleSummary) => r.display_name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={(roles?.rows ?? []).filter((r) => (field.value ?? []).includes(r.id))}
            onChange={(_e, value) => field.onChange(value.map((r) => r.id))}
            renderInput={(params) => <TextField {...params} label={t('files.roles')} />}
          />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('files.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
