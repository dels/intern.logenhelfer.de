import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MemberForm from './MemberForm';
import { useMember, useUpdateMember } from './api';
import { buildMemberFormDefaults } from './memberFormDefaults';
import { apiErrorMessage } from '../../api/client';

export default function MemberEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('MemberEditPage requires a :uuid route param');
  const { data: member, isLoading } = useMember(uuid);
  const { mutate, isPending, error } = useUpdateMember(uuid);

  if (isLoading || !member) return null;

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('members.edit')}</Typography>
      <MemberForm
        defaultValues={buildMemberFormDefaults(member)}
        editableFields={member.editable_fields}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/members/${uuid}`) })}
      />
    </>
  );
}
