import { useEffect, useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDemoMode } from '../api/useDemoMode';
import { apiFetch } from '../api/client';
import type { DemoAccountsList } from '../api/types';

export const DEMO_BANNER_HEIGHT_PX = 40;
const DEMO_PASSWORD = 'Salomon333';

function useDemoAccounts(enabled: boolean) {
  return useQuery({
    queryKey: ['demo-accounts'],
    queryFn: () => apiFetch<DemoAccountsList>('/api/v1/public/demo-accounts'),
    enabled,
  });
}

export default function DemoBanner() {
  const { t } = useTranslation();
  const demo = useDemoMode();
  const [open, setOpen] = useState(false);
  const { data } = useDemoAccounts(demo && open);

  useEffect(() => {
    if (demo) {
      document.documentElement.style.setProperty('--demo-banner-height', `${DEMO_BANNER_HEIGHT_PX}px`);
    } else {
      document.documentElement.style.removeProperty('--demo-banner-height');
    }
    return () => {
      document.documentElement.style.removeProperty('--demo-banner-height');
    };
  }, [demo]);

  if (!demo) return null;

  return (
    <Box
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0, height: DEMO_BANNER_HEIGHT_PX,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
        bgcolor: 'warning.main', color: 'warning.contrastText', px: 2,
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}
    >
      <Typography variant="caption" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {t('demoBanner.text')}
      </Typography>
      <IconButton
        size="small"
        aria-label={t('demoBanner.infoLabel')}
        onClick={() => setOpen(true)}
        sx={{ color: 'inherit' }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('demoBanner.title')}
          <IconButton aria-label={t('demoBanner.close')} onClick={() => setOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('demoBanner.intro', { password: DEMO_PASSWORD })}
          </Typography>
          <List dense>
            {(data?.accounts ?? []).map((account) => (
              <ListItem key={account.email} disableGutters>
                <ListItemText
                  primary={account.email}
                  secondary={t(`demoBanner.roles.${account.role}`, { defaultValue: account.role })}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" color="text.secondary">
            {t('demoBanner.limits')}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
