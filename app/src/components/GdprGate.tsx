import { useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAcceptGdpr } from '../features/announcements/api';

/**
 * App-wide GDPR-consent gate. Extracted out of pages/DashboardPage.tsx (which
 * used to only swap out its own "recent announcements" widget) so
 * layouts/AppShell.tsx (see AppShell's gdprGateActive) can render it in place
 * of the ENTIRE authenticated app - sidebar, breadcrumbs, every route's
 * content - for a member who hasn't accepted the privacy policy, per the
 * spec: "If a user did not accept GDPR they don't see anything in the app
 * except for the accept GDPR button." Self-contained (owns its own
 * checked/accepting state, calls useAcceptGdpr itself) so a call site needs
 * nothing but `<GdprGate />`.
 */
export default function GdprGate() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const { mutate: acceptGdpr, isPending: accepting } = useAcceptGdpr();

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h1" sx={{ mb: 1 }}>{t('dashboard.gdprHeader')}</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>{t('dashboard.gdprMustAccept')}</Alert>
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={(_e, isChecked) => setChecked(isChecked)} />}
        label={t('dashboard.gdprAcceptLabel')}
      />
      <Box>
        <Button variant="contained" disabled={!checked || accepting} onClick={() => acceptGdpr()}>
          {t('dashboard.gdprAcceptButton')}
        </Button>
      </Box>
    </Box>
  );
}
