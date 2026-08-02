import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useOfficer, useDeleteOfficer } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { EmailLink } from '../../components/ContactLinks';

export default function OfficerDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('OfficerDetailPage requires a :uuid route param');
  const { data: officer, isLoading } = useOfficer(uuid);
  const { mutate: deleteOfficer, isPending: deleting, error: deleteError } = useDeleteOfficer();
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !officer) return null;

  const canUpdate = abilities.officer?.includes('update');
  const canDestroy = abilities.officer?.includes('destroy');

  return (
    <Box>
      <Link component="button" onClick={() => navigate(`/lodges/${officer.lodge_slug}`)} sx={{ mb: 1, display: 'block' }}>
        {officer.lodge_name}
      </Link>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{officer.lastname}, {officer.firstname}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/officers/${uuid}/edit`)}>
                {t('officers.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteOfficer({ uuid, lodgeSlug: officer.lodge_slug }, { onSuccess: () => navigate(`/lodges/${officer.lodge_slug}`) })}>
                  {t('officers.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('officers.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <Typography color="text.secondary">{officer.role_display_name}</Typography>
      {officer.role_email && <Typography sx={{ mt: 1 }}><EmailLink email={officer.role_email} /></Typography>}
    </Box>
  );
}
