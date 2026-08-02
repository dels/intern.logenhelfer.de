import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import ShieldIcon from '@mui/icons-material/Shield';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useTranslation } from 'react-i18next';
import { useMember, useUpdateMember } from './api';
import { buildMemberFormDefaults } from './memberFormDefaults';
import MemberDetails from './MemberDetails';
import MemberForm from './MemberForm';
import { apiErrorMessage } from '../../api/client';
import type { MemberSummary } from '../../api/types';

function MemberAccordionRow({ member, expanded, onToggle }: { member: MemberSummary; expanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const { data: fullMember, isLoading } = useMember(member.uuid ?? '', { enabled: expanded });
  const { mutate, isPending, error } = useUpdateMember(member.uuid ?? '');

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography>{member.firstname} {member.lastname}</Typography>
          {member.can_edit && (
            <Tooltip title={member.mfa_enabled ? t('members.mfaEnabled') : t('members.mfaDisabled')}>
              {member.mfa_enabled ? <ShieldIcon fontSize="small" color="success" /> : <ShieldOutlinedIcon fontSize="small" color="disabled" />}
            </Tooltip>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading || !fullMember ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={20} /></Box>
        ) : isEditing ? (
          <MemberForm
            defaultValues={buildMemberFormDefaults(fullMember)}
            editableFields={fullMember.editable_fields}
            submitting={isPending}
            submitError={apiErrorMessage(error)}
            onSubmit={(values) => mutate(values, { onSuccess: () => setIsEditing(false) })}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {member.can_edit && (
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
                <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => setIsEditing(true)}>
                  {t('members.edit')}
                </Button>
              </Stack>
            )}
            <MemberDetails member={fullMember} />
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function MemberAccordionList({ members }: { members: MemberSummary[] }) {
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  return (
    <Box>
      {members.map((member) => (
        <MemberAccordionRow
          key={member.uuid}
          member={member}
          expanded={expandedUuid === member.uuid}
          onToggle={() => setExpandedUuid((current) => (current === member.uuid ? null : member.uuid ?? null))}
        />
      ))}
    </Box>
  );
}
