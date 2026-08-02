import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, CircularProgress, Link, List, ListItem, ListItemButton, ListItemText, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import { useDirectory, useDeleteDirectory } from './api';
import { useFiles, useDeleteFile, downloadFile } from '../files/api';
import FileInfoDialog from '../files/FileInfoDialog';
import FileDropZone from '../files/FileDropZone';
import VisibleToRoles from '../../components/VisibleToRoles';
import { formatBytes } from '../../utils/formatBytes';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';

export default function DirectoryDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('DirectoryDetailPage requires a :slug route param');
  const { data: directory, isLoading } = useDirectory(slug);
  const { mutate: deleteDirectory, isPending: deleting, error: deleteError } = useDeleteDirectory();
  const [confirming, setConfirming] = useState(false);
  useSetBreadcrumb(directory ? [
    { label: t('nav.categories'), to: '/categories' },
    { label: directory.category_name ?? '', to: `/categories/${directory.category_slug}` },
    { label: directory.name ?? '' },
  ] : null);

  if (isLoading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  if (!directory) return null;

  const canUpdate = abilities.directory?.includes('update');
  const canDestroy = abilities.directory?.includes('destroy');

  return (
    <Box>
      <Link component="button" onClick={() => navigate(`/categories/${directory.category_slug}`)} sx={{ mb: 1, display: 'block' }}>
        {directory.category_name}
      </Link>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{directory.name}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/categories/${directory.category_slug}/directories/${slug}/edit`)}>
                {t('directories.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteDirectory({ slug, categorySlug: directory.category_slug ?? '' }, { onSuccess: () => navigate(`/categories/${directory.category_slug}`) })}>
                  {t('directories.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('directories.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <VisibleToRoles roleIds={directory.role_ids ?? []} />
      {directory.description && <Typography color="text.secondary">{directory.description}</Typography>}
      <FilesSection
        categorySlug={directory.category_slug ?? ''}
        directorySlug={slug}
        roleIds={directory.role_ids ?? []}
        canUpload={abilities.attached_file?.includes('create') ?? false}
        canEdit={abilities.attached_file?.includes('update') ?? false}
        canDelete={abilities.attached_file?.includes('destroy') ?? false}
      />
    </Box>
  );
}

function FilesSection({ categorySlug, directorySlug, roleIds, canUpload, canEdit, canDelete }: { categorySlug: string; directorySlug: string; roleIds: number[]; canUpload: boolean; canEdit: boolean; canDelete: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: files, isLoading } = useFiles(directorySlug);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [infoUuid, setInfoUuid] = useState<string | null>(null);
  const { mutate: deleteFile, isPending: deletingFile, error: deleteFileError } = useDeleteFile();
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);

  async function handleDownload(uuid: string, filename: string) {
    setDownloadingUuid(uuid);
    setDownloadError(null);
    try {
      await downloadFile(uuid, filename);
    } catch (err) {
      setDownloadError(apiErrorMessage(err));
    } finally {
      setDownloadingUuid(null);
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>{t('files.filesHeading')}</Typography>
      {canUpload && <FileDropZone directorySlug={directorySlug} roleIds={roleIds} />}
      {isLoading && <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}><CircularProgress size={28} /></Box>}
      {!isLoading && files?.rows.length === 0 && <Typography color="text.secondary" sx={{ mt: 2 }}>{t('files.noFiles')}</Typography>}
      {downloadError && <Alert severity="error" sx={{ mt: 2 }}>{downloadError}</Alert>}
      {deleteFileError && <Alert severity="error" sx={{ mt: 2 }}>{apiErrorMessage(deleteFileError)}</Alert>}
      <List>
        {(files?.rows ?? []).map((file) => (
          <ListItem
            key={file.uuid}
            disablePadding
            secondaryAction={
              <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title={t('files.info')}>
                  <IconButton edge="end" aria-label={t('files.info')} onClick={() => setInfoUuid(file.uuid)}>
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
                {canEdit && (
                  <Tooltip title={t('files.edit')}>
                    <IconButton
                      edge="end"
                      aria-label={t('files.edit')}
                      onClick={() => navigate(`/categories/${categorySlug}/directories/${directorySlug}/files/${file.uuid}/edit`)}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton
                  edge="end"
                  aria-label={t('files.download')}
                  disabled={downloadingUuid === file.uuid}
                  onClick={() => void handleDownload(file.uuid, file.filename)}
                >
                  {downloadingUuid === file.uuid ? <CircularProgress size={20} /> : <DownloadIcon />}
                </IconButton>
                {canDelete && (
                  confirmDeleteUuid === file.uuid ? (
                    <Tooltip title={t('files.deleteConfirm')}>
                      <IconButton
                        edge="end"
                        color="error"
                        aria-label={t('files.deleteConfirm')}
                        disabled={deletingFile}
                        onClick={() => deleteFile({ uuid: file.uuid, directorySlug }, { onSuccess: () => setConfirmDeleteUuid(null) })}
                      >
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t('files.delete')}>
                      <IconButton edge="end" aria-label={t('files.delete')} onClick={() => setConfirmDeleteUuid(file.uuid)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  )
                )}
              </Stack>
            }
          >
            <ListItemButton
              disabled={downloadingUuid === file.uuid}
              onClick={() => void handleDownload(file.uuid, file.filename)}
            >
              <ListItemText primary={file.filename} secondary={formatBytes(file.content_length)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {infoUuid && <FileInfoDialog uuid={infoUuid} open onClose={() => setInfoUuid(null)} />}
    </Box>
  );
}
