import { useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useDemoMode } from '../../api/useDemoMode';
import { useToast } from '../../notifications/useToast';
import { useMfaStatus } from './api';

const DISMISSED_KEY = 'mfa-setup-banner-dismissed';

export default function MfaSetupBanner() {
  const { t } = useTranslation();
  const { data } = useMfaStatus();
  const demo = useDemoMode();
  const navigate = useNavigate();
  const toast = useToast();
  // sessionStorage-backed, not just component state: the design spec calls
  // this "dismissible-per-session," so a dismissal must survive navigating
  // away from and back to the dashboard, not just re-render.
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');

  if (!data || data.methods.length > 0) return null;

  // Mandatory mode only ever reaches this component while still within the
  // grace period - past it, RequireAuth (app/src/auth/RequireAuth.tsx) has
  // already redirected to /mfa/setup before DashboardPage mounts at all, so
  // there is no third "past grace" case to render here.
  const isMandatory = data.mode === 'mandatory';
  // `dismissed` can only ever become true via the dismissible branch's
  // onClose below (a non-dismissible banner never renders a close button),
  // so it's only consulted here, in that path - a mandatory-mode banner is
  // never suppressed by a leftover dismissal from before the account's
  // mode changed.
  if (!isMandatory && dismissed) return null;

  const daysLeft = isMandatory && data.grace_period_ends_at
    ? Math.max(0, Math.ceil((new Date(data.grace_period_ends_at).getTime() - Date.now()) / 86_400_000))
    : null;

  // Non-dismissible whenever it's the mandatory-grace-period case, or (per
  // the design spec) in demo mode - even though demo mode forces `mfa_mode`
  // to 'optional' server-side, so in practice this only ever combines with
  // isMandatory being false.
  const dismissible = !demo && !isMandatory;

  // The setup CTA lives in the Alert's own children, not its `action` slot -
  // MUI's <Alert> only ever auto-renders its built-in close button when
  // `action` is left unset; passing both `action` and `onClose` together
  // silently drops the close button. Keeping the CTA out of `action` lets
  // `onClose` below render MUI's real close button whenever dismissible.
  return (
    <Alert
      severity={isMandatory ? 'warning' : 'info'}
      sx={{ mt: 2 }}
      onClose={dismissible ? () => { sessionStorage.setItem(DISMISSED_KEY, 'true'); setDismissed(true); } : undefined}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <span>{isMandatory ? t('mfa.dashboard.bannerCountdown', { days: daysLeft }) : t('mfa.dashboard.banner')}</span>
        <Button
          color="inherit"
          size="small"
          onClick={() => (demo ? toast.error(t('mfa.demoUnavailable')) : navigate('/mfa/setup'))}
        >
          {t('mfa.dashboard.setupCta')}
        </Button>
      </Box>
    </Alert>
  );
}
