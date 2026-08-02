import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Paper, TextField, Button, Typography, Alert, Link } from '@mui/material';
import { apiFetch, ApiError, apiErrorMessage } from '../api/client';
import bijou from '../assets/bijou-large.png';
import BijouLogo from '../components/BijouLogo';

const schema = z.object({
  new_password: z.string().min(8),
  new_password_confirmation: z.string().min(1),
}).refine((values) => values.new_password === values.new_password_confirmation, {
  message: 'mismatch',
  path: ['new_password_confirmation'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await apiFetch('/api/v1/password/reset', { method: 'POST', body: JSON.stringify({ token, ...values }) });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? t('auth.resetPasswordInvalidToken') : apiErrorMessage(err));
    }
  });

  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: 380, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
          <BijouLogo defaultSrc={bijou} width={88} height={92} />
          <Typography variant="h3" component="h1">{t('auth.resetPasswordTitle')}</Typography>
        </Box>
        {success ? (
          <Alert severity="success">{t('auth.resetPasswordSuccess')}</Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField {...register('new_password')} label={t('auth.newPassword')} type="password" fullWidth margin="normal"
              error={!!formState.errors.new_password} autoComplete="new-password" />
            <TextField {...register('new_password_confirmation')} label={t('auth.newPasswordConfirmation')} type="password" fullWidth margin="normal"
              error={!!formState.errors.new_password_confirmation} autoComplete="new-password" />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={formState.isSubmitting || !token}>
              {t('auth.resetPasswordSubmit')}
            </Button>
          </form>
        )}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" variant="body2">{t('auth.backToLogin')}</Link>
        </Box>
      </Paper>
    </Box>
  );
}
