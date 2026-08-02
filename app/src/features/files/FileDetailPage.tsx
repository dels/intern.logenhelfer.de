import { useState, type ReactNode } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import { useTranslation } from 'react-i18next';
import { useFile, useDeleteFile, downloadFile } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { formatBytes } from '../../utils/formatBytes';
import { formatDate } from '../../utils/formatDate';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';
import { EmailLink } from '../../components/ContactLinks';
import VisibleToRoles from '../../components/VisibleToRoles';

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Typography>{value}</Typography>
    </Box>
  );
}

export default function FileDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('FileDetailPage requires a :uuid route param');
  const { data: file, isLoading } = useFile(uuid);
  const { mutate: deleteFile, isPending: deleting, error: deleteError } = useDeleteFile();
  const [confirming, setConfirming] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  useSetBreadcrumb(file ? [
    { label: t('nav.categories'), to: '/categories' },
    { label: file.category_name ?? '', to: `/categories/${file.category_slug}` },
    { label: file.directory_name ?? '', to: `/categories/${file.category_slug}/directories/${file.directory_slug}` },
    { label: file.filename ?? '' },
  ] : null);

  if (isLoading || !file) return null;

  async function handleDownload() {
    if (!file) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadFile(file.uuid, file.filename);
    } catch (err) {
      setDownloadError(apiErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  }

  const canUpdate = abilities.attached_file?.includes('update');
  const canDestroy = abilities.attached_file?.includes('destroy');

  return (
    <Box>
      <Link to={`/categories/${file.category_slug}/directories/${file.directory_slug}`}>{file.directory_name}</Link>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
        <Typography
          variant="h2"
          title={file.filename}
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
        >
          {file.filename}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            disabled={isDownloading}
            onClick={() => void handleDownload()}
          >
            {t('files.download')}
          </Button>
          {canUpdate && (
            <Button startIcon={<EditIcon />} onClick={() => navigate(`/categories/${file.category_slug}/directories/${file.directory_slug}/files/${uuid}/edit`)}>
              {t('files.edit')}
            </Button>
          )}
          {canDestroy && (
            confirming ? (
              <Button color="error" variant="contained" disabled={deleting}
                onClick={() => deleteFile({ uuid, directorySlug: file.directory_slug ?? '' }, { onSuccess: () => navigate(`/categories/${file.category_slug}/directories/${file.directory_slug}`) })}>
                {t('files.deleteConfirm')}
              </Button>
            ) : (
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                {t('files.delete')}
              </Button>
            )
          )}
        </Stack>
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      {downloadError && <Alert severity="error" sx={{ mb: 2 }}>{downloadError}</Alert>}
      <VisibleToRoles roleIds={file.role_ids ?? []} />
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2 }}>
          <MetaItem label={t('files.size')} value={formatBytes(file.content_length)} />
          <MetaItem label={t('files.filetype')} value={file.content_type ?? ''} />
          <MetaItem label={t('files.uploadedBy')} value={file.uploader_email ? <EmailLink email={file.uploader_email} /> : ''} />
          <MetaItem label={t('files.uploadedAt')} value={formatDate(file.created_at, i18n.language, { dateStyle: 'medium', timeStyle: 'short' })} />
        </Box>
      </Paper>
    </Box>
  );
}
