import { useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useUploadFile } from './api';
import { apiErrorMessage } from '../../api/client';

export interface FileDropZoneProps {
  directorySlug: string;
  roleIds: number[];
}

export default function FileDropZone({ directorySlug, roleIds }: FileDropZoneProps) {
  const { t } = useTranslation();
  const { mutateAsync } = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      // Sequential on purpose: each POST re-checks the caller's create
      // ability and the shared DB-memory guard, so an early rejection
      // (403/422) must stop the batch rather than race ahead with the rest
      // in parallel.
      // eslint-disable-next-line no-await-in-loop
      for (const file of files) await mutateAsync({ file, directorySlug, roleIds });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        void uploadFiles(e.dataTransfer.files);
      }}
      sx={{
        display: 'block',
        width: '100%',
        font: 'inherit',
        color: 'inherit',
        bgcolor: isDragOver ? 'action.hover' : 'transparent',
        border: '2px dashed',
        borderColor: isDragOver ? 'primary.main' : 'divider',
        borderRadius: 1,
        p: 3,
        mb: 2,
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        aria-label={t('files.dropZoneLabel')}
        onChange={(e) => { void uploadFiles(e.target.files); e.target.value = ''; }}
      />
      {uploading ? <CircularProgress size={24} /> : <AddIcon color="action" />}
      <Typography color="text.secondary">{t('files.dropZoneLabel')}</Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
