import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OfficerForm from './OfficerForm';
import { useOfficer, useUpdateOfficer } from './api';
import { apiErrorMessage } from '../../api/client';
import type { OfficerInput } from '../../api/types';

export default function OfficerEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('OfficerEditPage requires a :uuid route param');
  const { data: officer, isLoading } = useOfficer(uuid);
  const { mutate, isPending, error } = useUpdateOfficer(uuid);

  if (isLoading || !officer) return null;

  const defaultValues: OfficerInput = {
    firstname: officer.firstname,
    lastname: officer.lastname,
    role_id: officer.role_id,
    role_email: officer.role_email,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('officers.edit')}</Typography>
      <OfficerForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/officers/${uuid}`) })}
      />
    </>
  );
}
