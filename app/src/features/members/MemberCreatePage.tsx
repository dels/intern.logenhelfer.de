import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MemberForm from './MemberForm';
import { useCreateMember, useNextMatriculationNumber } from './api';
import { apiErrorMessage } from '../../api/client';
import type { MemberInput } from '../../api/types';

// Creation is admin/secretary-only (Api::V1::MembersController#create
// requires `ability.can?(:create, User)`), so the form always shows the
// full field set here - there is no self-service "create yourself" flow.
const ADMIN_FIELDS = [
  'email', 'firstname', 'lastname', 'date_of_birth', 'matriculation_number', 'job_title',
  'entered_apprentice_since', 'fellow_craft_since', 'master_mason_since', 'addresses',
];
const emptyMember: MemberInput = {
  firstname: '', lastname: '', email: '', date_of_birth: '', job_title: '',
  entered_apprentice_since: '', fellow_craft_since: '', master_mason_since: '', addresses: [],
};

export default function MemberCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateMember();
  const { data: suggestion, isLoading: suggestionLoading } = useNextMatriculationNumber();

  // react-hook-form (inside MemberForm) only applies `defaultValues` once, at
  // mount - fetching the suggested matriculation number after MemberForm has
  // already mounted would never populate the field. Wait for the suggestion
  // query to settle (success OR failure - see the error-branch note below)
  // before mounting MemberForm at all.
  if (suggestionLoading) return null;

  // On a failed suggestion request (e.g. a transient network error - the
  // ability check itself already gates this whole page via routing, so a
  // 403 here would be unusual), fall back to an empty field rather than
  // blocking member creation entirely; the admin can still type a number by
  // hand.
  const defaultValues: MemberInput = {
    ...emptyMember,
    matriculation_number: suggestion?.next_matriculation_number,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('members.create')}</Typography>
      <MemberForm
        defaultValues={defaultValues}
        editableFields={ADMIN_FIELDS}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (member) => navigate(`/members/${member.uuid}`) })}
      />
    </>
  );
}
