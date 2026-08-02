import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SeekerForm from './SeekerForm';
import { useCreateSeeker } from './api';
import { apiErrorMessage } from '../../api/client';
import type { SeekerInput } from '../../api/types';

const emptySeeker: SeekerInput = {
  firstname: '', lastname: '', source: '', invite: true, status: 0,
  address: { type_of_address: 0, purpose: 'Privat' },
};

export default function SeekerCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateSeeker();

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('seekers.create')}</Typography>
      <SeekerForm
        defaultValues={emptySeeker}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (seeker) => navigate(`/seekers/${seeker.uuid}`) })}
      />
    </>
  );
}
