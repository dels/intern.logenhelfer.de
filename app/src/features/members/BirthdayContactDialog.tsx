import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMember } from './api';
import type { AddressSummary } from '../../api/types';
import { PhoneLink, EmailLink } from '../../components/ContactLinks';

export interface BirthdayContactDialogProps {
  uuid: string;
  open: boolean;
  onClose: () => void;
}

function hasContactInfo(address: AddressSummary): boolean {
  return Boolean(address.email || address.phone || address.mobile);
}

export default function BirthdayContactDialog({ uuid, open, onClose }: BirthdayContactDialogProps) {
  const { t } = useTranslation();
  const { data: member } = useMember(uuid);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {member ? `${member.firstname} ${member.lastname}` : ''}
        <IconButton aria-label={t('common.close')} onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {member && (
          <>
            <Typography><EmailLink email={member.email} /></Typography>
            <List>
              {member.addresses.filter(hasContactInfo).map((address) => (
                <ListItem key={address.id} sx={{ display: 'block' }}>
                  <ListItemText
                    primary={address.purpose}
                    secondary={
                      <>
                        {[
                          address.email && <EmailLink key="email" email={address.email} />,
                          address.phone && <PhoneLink key="phone" phone={address.phone} />,
                          address.mobile && <PhoneLink key="mobile" phone={address.mobile} />,
                        ]
                          .filter((el): el is React.JSX.Element => Boolean(el))
                          .map((el, i) => (
                            <span key={el.key}>{i > 0 && ' · '}{el}</span>
                          ))}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
