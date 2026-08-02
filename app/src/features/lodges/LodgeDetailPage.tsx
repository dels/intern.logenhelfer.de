import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useLodge, useDeleteLodge } from './api';
import { useOfficers } from '../officers/api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';

export default function LodgeDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('LodgeDetailPage requires a :slug route param');
  const { data: lodge, isLoading } = useLodge(slug);
  const { data: officers } = useOfficers(slug);
  const { mutate: deleteLodge, isPending: deleting, error: deleteError } = useDeleteLodge();
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !lodge) return null;

  // Class-level abilities.lodge is correct here (not per-instance) -
  // Lodge's manage ability has no block condition, so this boolean is the
  // same for every lodge instance given a fixed caller. Same reasoning
  // already used for abilities.category/abilities.seeker elsewhere.
  const canUpdate = abilities.lodge?.includes('update');
  const canDestroy = abilities.lodge?.includes('destroy');
  const canCreateOfficer = abilities.officer?.includes('create');

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{lodge.name}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/lodges/${slug}/edit`)}>
                {t('lodges.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteLodge(slug, { onSuccess: () => navigate('/lodges') })}>
                  {t('lodges.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('lodges.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <Typography color="text.secondary">{lodge.district_name}</Typography>
      {lodge.description && <Typography sx={{ mt: 1 }}>{lodge.description}</Typography>}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
        <Typography variant="h2">{t('lodges.officers')}</Typography>
        {canCreateOfficer && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => navigate(`/lodges/${slug}/officers/new`)}>
            {t('officers.create')}
          </Button>
        )}
      </Stack>
      <List>
        {(officers?.rows ?? []).map((o) => (
          <ListItem key={o.uuid} onClick={() => navigate(`/officers/${o.uuid}`)} sx={{ cursor: 'pointer' }}>
            <ListItemText primary={`${o.lastname}, ${o.firstname}`} secondary={o.role_display_name} />
          </ListItem>
        ))}
        {officers?.rows.length === 0 && <Typography color="text.secondary">—</Typography>}
      </List>
    </Box>
  );
}
