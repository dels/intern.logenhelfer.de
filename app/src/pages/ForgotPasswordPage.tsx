import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Paper, TextField, Button, Typography, Alert, Link } from '@mui/material';
import { apiFetch } from '../api/client';
import bijou from '../assets/bijou-large.png';

const schema = z.object({
  email: z.string().email(),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    // Always shown regardless of the response body - the API never reveals
    // whether the address matched an account, see passwordReset.ts.
    await apiFetch('/api/v1/password/forgot', { method: 'POST', body: JSON.stringify(values) }).catch(() => undefined);
    setSent(true);
  });

  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: 380, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
          <img src={bijou} alt="" width={88} height={92} />
          <Typography variant="h3" component="h1">{t('auth.forgotPasswordTitle')}</Typography>
        </Box>
        {sent ? (
          <Alert severity="success">{t('auth.forgotPasswordSent')}</Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <TextField {...register('email')} label={t('auth.email')} type="email" fullWidth margin="normal"
              error={!!formState.errors.email} autoComplete="email" />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={formState.isSubmitting}>
              {t('auth.forgotPasswordSubmit')}
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
