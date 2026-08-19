import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppBar, Box, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonthRounded';
import InfoIcon from '@mui/icons-material/InfoRounded';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTipRounded';
import HelpIcon from '@mui/icons-material/HelpRounded';
import AccountCircleIcon from '@mui/icons-material/AccountCircleRounded';
import LoginIcon from '@mui/icons-material/LoginRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import bijou from '../assets/bijou.png';
import BijouLogo from '../components/BijouLogo';
import { useAuth } from '../auth/AuthProvider';
import { useLandingConfig } from '../features/public-landing/api';

const navActionSx = {
  minWidth: 0,
  px: { xs: 1, sm: 1.5 },
  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
} as const;

function ActionLabel({ label }: { label: string }) {
  return <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{label}</Box>;
}

export default function TopNav({ variant, onMenuClick }: { variant: 'authenticated' | 'public'; onMenuClick?: () => void }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { data: landingConfig } = useLandingConfig();

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', top: 'var(--demo-banner-height, 0px)' }}
    >
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1 } }}>
        {onMenuClick && (
          <IconButton aria-label={t('nav.openMenu')} edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BijouLogo defaultSrc={bijou} width={28} height={37} />
          <Typography variant="h2" sx={{ fontSize: 18 }}>{landingConfig?.lodge || 'Logenhelfer'}</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5}>
          {variant === 'public' && (
            <Button component={NavLink} to="/calendar" startIcon={<CalendarMonthIcon />} aria-label={t('publicLayout.calendarLink')} sx={navActionSx}>
              <ActionLabel label={t('publicLayout.calendarLink')} />
            </Button>
          )}
          <Button component={NavLink} to="/impressum" startIcon={<InfoIcon />} aria-label={t('publicLayout.impressumLink')} sx={navActionSx}>
            <ActionLabel label={t('publicLayout.impressumLink')} />
          </Button>
          <Button component={NavLink} to="/datenschutz" startIcon={<PrivacyTipIcon />} aria-label={t('publicLayout.datenschutzLink')} sx={navActionSx}>
            <ActionLabel label={t('publicLayout.datenschutzLink')} />
          </Button>
          <Button component={NavLink} to="/help" startIcon={<HelpIcon />} aria-label={t('topNav.helpLink')} sx={navActionSx}>
            <ActionLabel label={t('topNav.helpLink')} />
          </Button>
          {variant === 'authenticated' ? (
            <>
              <Button component={NavLink} to="/account" startIcon={<AccountCircleIcon />} aria-label={t('account.navLabel')} sx={navActionSx}>
                <ActionLabel label={t('account.navLabel')} />
              </Button>
              <Button onClick={() => void logout()} startIcon={<LogoutIcon />} aria-label={t('auth.signOut')} sx={navActionSx}>
                <ActionLabel label={t('auth.signOut')} />
              </Button>
            </>
          ) : (
            <Button component={NavLink} to="/login" startIcon={<LoginIcon />} aria-label={t('publicLayout.loginLink')} sx={navActionSx}>
              <ActionLabel label={t('publicLayout.loginLink')} />
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
