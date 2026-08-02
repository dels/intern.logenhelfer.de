import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OfficerForm from './OfficerForm';
import { useCreateOfficer } from './api';
import { apiErrorMessage } from '../../api/client';
import type { OfficerInput } from '../../api/types';

export default function OfficerCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lodgeSlug } = useParams<{ lodgeSlug: string }>();
  if (!lodgeSlug) throw new Error('OfficerCreatePage requires a :lodgeSlug route param');
  const { mutate, isPending, error } = useCreateOfficer();

  const emptyOfficer: OfficerInput = { firstname: '', lastname: '', lodge_slug: lodgeSlug };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('officers.create')}</Typography>
      <OfficerForm
        defaultValues={emptyOfficer}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (officer) => navigate(`/officers/${officer.uuid}`) })}
      />
    </>
  );
}
