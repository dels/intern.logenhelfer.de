import { Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Member } from '../../api/types';
import { formatDate } from '../../utils/formatDate';
import { PhoneLink, EmailLink } from '../../components/ContactLinks';

export default function MemberDetails({ member }: { member: Member }) {
  const { t, i18n } = useTranslation();
  const administrationalRoles = member.roles.filter((r) => r.kind === 'administrational');
  const officePositions = member.roles.filter((r) => r.kind === 'positions');

  return (
    <>
      <Typography color="text.secondary"><EmailLink email={member.email} /></Typography>
      {member.job_title && <Typography>{member.job_title}</Typography>}
      {member.mother_lodge && <Typography>{t('members.motherLodge')}: {member.mother_lodge}</Typography>}
      {member.accepted_at && <Typography>{t('members.acceptedAt')}: {formatDate(member.accepted_at, i18n.language)}</Typography>}
      <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>{t('members.roles')}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {administrationalRoles.map((r, i) => <Chip key={`${r.display_name}-${i}`} label={r.display_name} size="small" />)}
        {administrationalRoles.length === 0 && <Chip label="—" size="small" />}
      </Stack>
      <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>{t('members.positions')}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {officePositions.map((r, i) => <Chip key={`${r.display_name}-${i}`} label={r.display_name} size="small" />)}
        {officePositions.length === 0 && <Chip label="—" size="small" />}
      </Stack>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('members.enteredApprenticeSince')}: {formatDate(member.entered_apprentice_since, i18n.language) || '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('members.fellowCraftSince')}: {formatDate(member.fellow_craft_since, i18n.language) || '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('members.masterMasonSince')}: {formatDate(member.master_mason_since, i18n.language) || '—'}
        </Typography>
      </Stack>
      <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>{t('members.addresses')}</Typography>
      <List>
        {member.addresses.map((a) => (
          <ListItem key={a.id} sx={{ alignItems: 'flex-start' }}>
            <ListItemText
              primary={a.purpose || '—'}
              slotProps={{ secondary: { component: 'div' } }}
              secondary={
                <Stack sx={{ mt: 0.5 }}>
                  {a.street && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {a.street}
                    </Typography>
                  )}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {`${a.zip ?? ''} ${a.city ?? ''}`.trim()}
                  </Typography>
                  {a.phone && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t('members.phone')}: <PhoneLink phone={a.phone} />
                    </Typography>
                  )}
                  {a.fax && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t('members.fax')}: {a.fax}
                    </Typography>
                  )}
                  {a.mobile && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t('members.mobile')}: <PhoneLink phone={a.mobile} />
                    </Typography>
                  )}
                  {a.email && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t('members.email')}: <EmailLink email={a.email} />
                    </Typography>
                  )}
                </Stack>
              }
            />
          </ListItem>
        ))}
        {member.addresses.length === 0 && <Chip label="—" size="small" />}
      </List>
    </>
  );
}
