import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WebAuthnError } from '@simplewebauthn/browser';
import { Box, Paper, TextField, Button, Typography, Alert, Link, Divider } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import { useLandingConfig } from '../features/public-landing/api';
import { ApiError, apiErrorMessage, getMfaChallengeMethods } from '../api/client';
import MfaChallengeForm from '../features/mfa/MfaChallengeForm';
import bijou from '../assets/bijou-large.png';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

interface PendingMfaChallenge {
  token: string;
  methods: string[];
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, completeMfaChallenge, loginWithPasskey } = useAuth();
  const { data: landingConfig } = useLandingConfig();
  const navigate = useNavigate();
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [pendingMfa, setPendingMfa] = useState<PendingMfaChallenge | null>(null);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function reportLoginError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      setFailedMessage(t('auth.invalidCredentials'));
    } else if (err instanceof ApiError && err.status < 500) {
      setFailedMessage(apiErrorMessage(err));
    } else {
      setFailedMessage(t('auth.networkError'));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFailedMessage(null);
    try {
      const result = await login(values.email, values.password);
      if (result === 'logged_in') {
        // If mfaSetupRequired is true, RequireAuth (app/src/auth/RequireAuth.tsx)
        // redirects to /mfa/setup itself once this navigation reaches a
        // route behind it - no branching needed here.
        navigate('/', { replace: true });
      } else {
        const { methods } = await getMfaChallengeMethods(result.mfa_pending_token);
        setPendingMfa({ token: result.mfa_pending_token, methods });
      }
    } catch (err) {
      reportLoginError(err);
    }
  });

  async function handleMfaSubmit(input: { method: string; code: string; remember_device: boolean }) {
    if (!pendingMfa) return;
    setFailedMessage(null);
    try {
      await completeMfaChallenge(pendingMfa.token, input);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFailedMessage(t('auth.mfaInvalidCode'));
      } else if (err instanceof ApiError && err.status < 500) {
        setFailedMessage(apiErrorMessage(err));
      } else {
        setFailedMessage(t('auth.networkError'));
      }
    }
  }

  async function handlePasskeyLogin() {
    setFailedMessage(null);
    setPasskeySubmitting(true);
    try {
      await loginWithPasskey();
      navigate('/', { replace: true });
    } catch (err) {
      // A WebAuthnError with this code means the user dismissed/cancelled
      // the browser's own passkey prompt (or it timed out) - not a real
      // failure worth alarming them with an error banner.
      if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') {
        // no-op
      } else if (err instanceof ApiError) {
        setFailedMessage(t('auth.passkeyLoginFailed'));
      } else {
        setFailedMessage(t('auth.networkError'));
      }
    } finally {
      setPasskeySubmitting(false);
    }
  }

  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: 380, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
          <img src={bijou} alt="" width={88} height={92} />
          <Typography variant="h3" component="h1">{landingConfig?.lodge || 'Logenhelfer'}</Typography>
        </Box>
        {failedMessage && <Alert severity="error" sx={{ mb: 2 }}>{failedMessage}</Alert>}
        {pendingMfa ? (
          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{t('mfa.challenge.title')}</Typography>
            <MfaChallengeForm methods={pendingMfa.methods} onSubmit={handleMfaSubmit} />
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component="button" type="button" variant="body2" onClick={() => { setPendingMfa(null); setFailedMessage(null); }}>
                {t('auth.backToLogin')}
              </Link>
            </Box>
          </Box>
        ) : (
          <>
            <form onSubmit={onSubmit} noValidate>
              <TextField {...register('email')} label={t('auth.email')} type="email" fullWidth margin="normal"
                error={!!formState.errors.email} autoComplete="email" />
              <TextField {...register('password')} label={t('auth.password')} type="password" fullWidth margin="normal"
                error={!!formState.errors.password} autoComplete="current-password" />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={formState.isSubmitting}>
                {t('auth.signIn')}
              </Button>
            </form>
            <Divider sx={{ my: 2 }} />
            <Button variant="outlined" fullWidth onClick={handlePasskeyLogin} disabled={passkeySubmitting}>
              {t('auth.signInWithPasskey')}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">{t('auth.forgotPassword')}</Link>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
