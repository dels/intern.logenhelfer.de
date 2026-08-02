import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRoles } from '../features/categories/api';

export default function VisibleToRoles({ roleIds }: { roleIds: number[] }) {
  const { t } = useTranslation();
  const { data: roles } = useRoles();
  if (!roles) return null;
  if (roleIds.length === 0) {
    return <Typography variant="body2" color="text.secondary">{t('common.visibleToNone')}</Typography>;
  }
  const names = roles.rows.filter((r) => roleIds.includes(r.id)).map((r) => r.display_name).join(', ');
  return <Typography variant="body2" color="text.secondary">{t('common.visibleTo', { groups: names })}</Typography>;
}
