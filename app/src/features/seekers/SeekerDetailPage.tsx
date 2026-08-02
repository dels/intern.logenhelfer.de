import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useSeeker, useDeleteSeeker } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';

export default function SeekerDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('SeekerDetailPage requires a :uuid route param');
  const { data: seeker, isLoading } = useSeeker(uuid);
  useSetBreadcrumb(seeker ? [
    { label: t('nav.seekers'), to: '/seekers' },
    { label: `${seeker.lastname}, ${seeker.firstname}` },
  ] : null);
  const { mutate: deleteSeeker, isPending: deleting, error: deleteError } = useDeleteSeeker();
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !seeker) return null;

  // Class-level abilities.seeker is correct here (not per-instance fields
  // like Member.can_edit/can_destroy) - Seeker's CanCanCan rules have no
  // block condition, so this boolean is the same for every seeker instance
  // given a fixed caller. See the plan's Global Constraints.
  const canUpdate = abilities.seeker?.includes('update');
  const canDestroy = abilities.seeker?.includes('destroy');

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{seeker.lastname}, {seeker.firstname}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/seekers/${uuid}/edit`)}>
                {t('seekers.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteSeeker(uuid, { onSuccess: () => navigate('/seekers') })}>
                  {t('seekers.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('seekers.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <Typography color="text.secondary">{seeker.source}</Typography>
      <Typography sx={{ mt: 1 }}>{t('seekers.status')}: {seeker.status_label}</Typography>
      {seeker.contact_value && <Typography>{seeker.contact_value}</Typography>}
      {seeker.notes && (
        <>
          <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>{t('seekers.notes')}</Typography>
          <Typography>{seeker.notes}</Typography>
        </>
      )}
    </Box>
  );
}
