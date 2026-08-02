import { Alert, Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { useSeekerNames } from './api';

/**
 * Names-only view of active seekers - no status/contact/address/notes -
 * gated by the show_seeker_names_to_brothers AppConfig flag (see
 * api/src/routes/seekers.ts's seekerNamesListAllowedForCaller). Available to
 * Brothers who otherwise have no Seeker access at all; the Worshipful Master
 * and council members already have full access via /seekers instead.
 */
export default function SeekerNamesListPage() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const allowed = abilities.seeker?.includes('names_list') ?? false;
  const { data, isLoading } = useSeekerNames(allowed);

  if (!allowed) {
    return <Alert severity="error">{t('seekers.forbidden')}</Alert>;
  }

  const rows = data?.rows ?? [];

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('seekers.namesList.title')}</Typography>
      {!isLoading && rows.length === 0 && <Typography color="text.secondary">{t('seekers.namesList.empty')}</Typography>}
      {rows.length > 0 && (
        <List disablePadding>
          {rows.map((seeker, i) => (
            <ListItem key={`${seeker.lastname}-${seeker.firstname}-${i}`} divider={i < rows.length - 1} disableGutters>
              <ListItemText primary={`${seeker.lastname}, ${seeker.firstname}`} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
