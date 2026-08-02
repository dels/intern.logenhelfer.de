import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnouncementForm from './AnnouncementForm';
import { useAnnouncement, useUpdateAnnouncement } from './api';
import { apiErrorMessage } from '../../api/client';
import type { AnnouncementInput } from '../../api/types';

export default function AnnouncementEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('AnnouncementEditPage requires a :uuid route param');
  const { data: announcement, isLoading } = useAnnouncement(uuid);
  const { mutate, isPending, error } = useUpdateAnnouncement(uuid);

  if (isLoading || !announcement) return null;

  const defaultValues: AnnouncementInput = {
    title: announcement.title,
    message_body: announcement.message_body,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('announcements.edit')}</Typography>
      <AnnouncementForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/announcements/${uuid}`) })}
      />
    </>
  );
}
