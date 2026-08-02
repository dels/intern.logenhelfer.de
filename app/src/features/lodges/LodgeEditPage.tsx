import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LodgeForm from './LodgeForm';
import { useLodge, useUpdateLodge } from './api';
import { apiErrorMessage } from '../../api/client';
import type { LodgeInput } from '../../api/types';

export default function LodgeEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('LodgeEditPage requires a :slug route param');
  const { data: lodge, isLoading } = useLodge(slug);
  const { mutate, isPending, error } = useUpdateLodge(slug);

  if (isLoading || !lodge) return null;

  const defaultValues: LodgeInput = {
    name: lodge.name,
    description: lodge.description,
    district_id: lodge.district_id,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('lodges.edit')}</Typography>
      <LodgeForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/lodges/${slug}`) })}
      />
    </>
  );
}
