import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface DistrictFormProps {
  open: boolean;
  initialName?: string;
  submitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function DistrictForm({ open, initialName, submitting, submitError, onClose, onSubmit }: DistrictFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName ?? '');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initialName === undefined ? t('configuration.districtCreate') : t('configuration.districtEdit')}</DialogTitle>
      <DialogContent>
        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
        <TextField
          fullWidth
          label={t('configuration.districtName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('configuration.cancel')}</Button>
        <Button variant="contained" disabled={submitting || !name.trim()} onClick={() => onSubmit(name.trim())}>
          {t('configuration.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
