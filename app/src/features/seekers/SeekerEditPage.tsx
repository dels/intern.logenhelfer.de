import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SeekerForm from './SeekerForm';
import { useSeeker, useUpdateSeeker } from './api';
import { apiErrorMessage } from '../../api/client';
import type { SeekerInput } from '../../api/types';

export default function SeekerEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('SeekerEditPage requires a :uuid route param');
  const { data: seeker, isLoading } = useSeeker(uuid);
  const { mutate, isPending, error } = useUpdateSeeker(uuid);

  if (isLoading || !seeker) return null;

  const defaultValues: SeekerInput = {
    firstname: seeker.firstname,
    lastname: seeker.lastname,
    source: seeker.source,
    invite: seeker.invite,
    status: seeker.status,
    preferred_way_of_contact: seeker.preferred_way_of_contact,
    notes: seeker.notes,
    address: {
      type_of_address: seeker.address.type_of_address,
      purpose: seeker.address.purpose,
      street1: seeker.address.street,
      zip: seeker.address.zip,
      city: seeker.address.city,
      phone: seeker.address.phone,
      fax: seeker.address.fax,
      mobile: seeker.address.mobile,
      email: seeker.address.email,
    },
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('seekers.edit')}</Typography>
      <SeekerForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/seekers/${uuid}`) })}
      />
    </>
  );
}
