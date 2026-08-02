import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccountRounded';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTranslation } from 'react-i18next';
import { useMember, useDeleteMember, useResetMemberMfa } from './api';
import { apiErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';
import MemberDetails from './MemberDetails';

export default function MemberDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('MemberDetailPage requires a :uuid route param');
  const { data: member, isLoading } = useMember(uuid);
  useSetBreadcrumb(member ? [
    { label: t('nav.users'), to: '/members' },
    { label: t('members.brotherName', { firstname: member.firstname, lastname: member.lastname }) },
  ] : null);
  const { mutate: deleteMember, isPending: deleting, error: deleteError } = useDeleteMember();
  const [confirming, setConfirming] = useState(false);
  const { mutate: resetMfa, isPending: resettingMfa, error: resetMfaError } = useResetMemberMfa();
  const [confirmingMfaReset, setConfirmingMfaReset] = useState(false);
  const [impersonateError, setImpersonateError] = useState<unknown>(null);

  const handleImpersonate = () => {
    setImpersonateError(null);
    impersonate(uuid)
      .then(() => navigate('/'))
      .catch((error: unknown) => setImpersonateError(error));
  };

  if (isLoading || !member) return null;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('members.brotherName', { firstname: member.firstname, lastname: member.lastname })}</Typography>
        {(member.can_edit || member.can_destroy || member.can_impersonate) && (
          <Stack direction="row" spacing={1}>
            {member.can_impersonate && (
              <Button startIcon={<SwitchAccountIcon />} onClick={handleImpersonate}>
                {t('members.impersonate')}
              </Button>
            )}
            {member.can_edit && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/members/${uuid}/edit`)}>
                {t('members.edit')}
              </Button>
            )}
            {member.can_destroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteMember(uuid, { onSuccess: () => navigate('/members') })}>
                  {t('members.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('members.delete')}
                </Button>
              )
            )}
            {member.can_destroy && (
              confirmingMfaReset ? (
                <Button color="warning" variant="contained" disabled={resettingMfa}
                  onClick={() => resetMfa(uuid, { onSuccess: () => setConfirmingMfaReset(false) })}>
                  {t('members.mfaResetConfirm')}
                </Button>
              ) : (
                <Button color="warning" startIcon={<ShieldIcon />} onClick={() => setConfirmingMfaReset(true)}>
                  {t('members.mfaReset')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      {resetMfaError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(resetMfaError)}</Alert>}
      {impersonateError != null && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(impersonateError)}</Alert>}
      <MemberDetails member={member} />
    </Box>
  );
}
