import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnouncementForm from './AnnouncementForm';
import { useCreateAnnouncement } from './api';
import { apiErrorMessage } from '../../api/client';
import type { AnnouncementInput } from '../../api/types';

const emptyAnnouncement: AnnouncementInput = { title: '', message_body: '' };

export default function AnnouncementCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateAnnouncement();

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('announcements.create')}</Typography>
      <AnnouncementForm
        defaultValues={emptyAnnouncement}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (announcement) => navigate(`/announcements/${announcement.uuid}`) })}
      />
    </>
  );
}
