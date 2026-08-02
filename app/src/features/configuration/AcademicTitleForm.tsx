import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface AcademicTitleFormProps {
  open: boolean;
  initialShort?: string;
  submitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (short: string) => void;
}

export default function AcademicTitleForm({ open, initialShort, submitting, submitError, onClose, onSubmit }: AcademicTitleFormProps) {
  const { t } = useTranslation();
  const [short, setShort] = useState(initialShort ?? '');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initialShort === undefined ? t('configuration.academicTitleCreate') : t('configuration.academicTitleEdit')}</DialogTitle>
      <DialogContent>
        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
        <TextField
          fullWidth
          label={t('configuration.academicTitleShort')}
          value={short}
          onChange={(e) => setShort(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('configuration.cancel')}</Button>
        <Button variant="contained" disabled={submitting || !short.trim()} onClick={() => onSubmit(short.trim())}>
          {t('configuration.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
