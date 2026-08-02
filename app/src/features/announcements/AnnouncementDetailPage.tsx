import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useAnnouncement, useDeleteAnnouncement } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';

export default function AnnouncementDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('AnnouncementDetailPage requires a :uuid route param');
  const { data: announcement, isLoading } = useAnnouncement(uuid);
  useSetBreadcrumb(announcement ? [
    { label: t('nav.announcements'), to: '/announcements' },
    { label: announcement.title },
  ] : null);
  const { mutate: deleteAnnouncement, isPending: deleting, error: deleteError } = useDeleteAnnouncement();
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !announcement) return null;

  // Class-level abilities.announcement is correct here (not per-instance) -
  // Announcement's manage ability has no block condition, so this boolean is
  // the same for every announcement instance given a fixed caller. Same
  // reasoning already used for abilities.lodge/abilities.category elsewhere.
  const canUpdate = abilities.announcement?.includes('update');
  const canDestroy = abilities.announcement?.includes('destroy');

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{announcement.title}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/announcements/${uuid}/edit`)}>
                {t('announcements.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteAnnouncement(uuid, { onSuccess: () => navigate('/announcements') })}>
                  {t('announcements.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('announcements.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <Typography color="text.secondary" variant="body2">
        {t('announcements.createdBy', {
          name: announcement.created_by_name,
          date: new Date(announcement.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
        })}
      </Typography>
      {announcement.updated_by_name && (
        <Typography color="text.secondary" variant="body2">
          {t('announcements.updatedBy', {
            name: announcement.updated_by_name,
            date: new Date(announcement.updated_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
          })}
        </Typography>
      )}
      <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{announcement.message_body}</Typography>
    </Box>
  );
}
