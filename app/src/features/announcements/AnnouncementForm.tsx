import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { AnnouncementInput } from '../../api/types';

const announcementSchema = z.object({
  title: z.string().min(1).optional(),
  message_body: z.string().min(1).optional(),
});

export interface AnnouncementFormProps {
  defaultValues: AnnouncementInput;
  onSubmit: (values: AnnouncementInput) => void;
  submitting: boolean;
  submitError?: string | null;
}

export default function AnnouncementForm({ defaultValues, onSubmit, submitting, submitError }: AnnouncementFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema) as Resolver<AnnouncementInput>,
    defaultValues,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Controller name="title" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('announcements.title')} error={!!fieldState.error} required />
        )} />
        <Controller name="message_body" control={control} render={({ field, fieldState }) => (
          <TextField {...field} value={field.value ?? ''} label={t('announcements.messageBody')} error={!!fieldState.error} multiline minRows={6} required />
        )} />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('announcements.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
