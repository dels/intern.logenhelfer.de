import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Paper, Typography } from '@mui/material';

// Client-side catch-all for unmatched in-app routes (routes.tsx's `*` under
// AppShell/RequireAuth) — separate from the static nginx-level error pages
// at app/public/errors/*.html, which cover the app not being reachable at
// all. This one only ever renders while the SPA itself is already running.
export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 4 }}>
      <Paper sx={{ p: 4, width: 380, textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 1 }}>
          404
        </Typography>
        <Typography variant="h1" component="h1" sx={{ mb: 2 }}>
          {t('notFound.heading')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('notFound.body')}
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          {t('notFound.backToDashboard')}
        </Button>
      </Paper>
    </Box>
  );
}
