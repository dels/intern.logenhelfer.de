import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LodgeForm from './LodgeForm';
import { useCreateLodge } from './api';
import { apiErrorMessage } from '../../api/client';
import type { LodgeInput } from '../../api/types';

const emptyLodge: LodgeInput = { name: '', description: '' };

export default function LodgeCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateLodge();

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('lodges.create')}</Typography>
      <LodgeForm
        defaultValues={emptyLodge}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (lodge) => navigate(`/lodges/${lodge.slug}`) })}
      />
    </>
  );
}
