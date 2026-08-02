import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/formatDate';
import { useFile } from './api';
import { useRoles } from '../categories/api';

interface FileInfoDialogProps {
  uuid: string;
  open: boolean;
  onClose: () => void;
}

export default function FileInfoDialog({ uuid, open, onClose }: FileInfoDialogProps) {
  const { t, i18n } = useTranslation();
  const { data: file, isLoading } = useFile(uuid, { enabled: open });
  const { data: roles } = useRoles();

  const roleNames = (file?.role_ids ?? [])
    .map((id) => roles?.rows.find((r) => r.id === id)?.display_name)
    .filter((name): name is string => Boolean(name));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('files.infoTitle')}</DialogTitle>
      <DialogContent>
        {isLoading || !file ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}><CircularProgress size={24} /></Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography><strong>{t('files.uploadedBy')}:</strong> {file.uploader_email}</Typography>
            <Typography><strong>{t('files.uploadedAt')}:</strong> {formatDate(file.created_at, i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</Typography>
            <Typography><strong>{t('files.downloadCount')}:</strong> {file.download_count}</Typography>
            <Typography><strong>{t('files.roles')}:</strong> {roleNames.length > 0 ? roleNames.join(', ') : '—'}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
