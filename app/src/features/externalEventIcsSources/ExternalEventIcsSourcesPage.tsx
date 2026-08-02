import { useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Snackbar, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import {
  useCreateExternalEventIcsSource, useDeleteExternalEventIcsSource, useExternalEventIcsSources, useSyncExternalEventIcsSource,
  useUpdateExternalEventIcsSource,
} from './api';
import { apiErrorMessage } from '../../api/client';
import type { ExternalEventIcsSource } from '../../api/types';

type SyncFeedback = { uuid: string; severity: 'success' | 'error'; message: string };

export default function ExternalEventIcsSourcesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'name';
  const { data, isLoading } = useExternalEventIcsSources(paginationModel.page, paginationModel.pageSize, sortParam);
  const { mutate: create, isPending: creating, error: createError } = useCreateExternalEventIcsSource();
  const { mutate: remove } = useDeleteExternalEventIcsSource();
  const { mutate: sync } = useSyncExternalEventIcsSource();
  const { mutate: update, isPending: updating } = useUpdateExternalEventIcsSource();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [syncingUuid, setSyncingUuid] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editError, setEditError] = useState<unknown>(null);

  const rows = data?.rows ?? [];
  const canAdd = name.trim().length > 0 && url.trim().length > 0;
  const canSaveEdit = editName.trim().length > 0 && editUrl.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    create({ name: name.trim(), url: url.trim() }, { onSuccess: () => { setName(''); setUrl(''); } });
  };

  const handleSync = (uuid: string) => {
    setSyncingUuid(uuid);
    sync(uuid, {
      onSuccess: (result) => {
        // useSyncExternalEventIcsSource doesn't invalidate any cache on its own - a sync can
        // create/update/remove both the source's own data and external events, so invalidate
        // both here rather than leaving stale data behind in another open tab/view.
        queryClient.invalidateQueries({ queryKey: ['external-event-ics-sources'] });
        queryClient.invalidateQueries({ queryKey: ['external-events'] });
        setSyncingUuid(null);
        setSyncFeedback({
          uuid,
          severity: 'success',
          message: t('externalEventIcsSources.syncResult', {
            created: result.created,
            updated: result.updated,
            removed: result.removed,
          }),
        });
      },
      onError: (err) => {
        setSyncingUuid(null);
        setSyncFeedback({ uuid, severity: 'error', message: apiErrorMessage(err) ?? t('externalEventIcsSources.syncError') });
      },
    });
  };

  const handleStartEdit = (source: ExternalEventIcsSource) => {
    setEditingUuid(source.uuid);
    setEditName(source.name);
    setEditUrl(source.url);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingUuid(null);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editingUuid || !canSaveEdit) return;
    setEditError(null);
    update(
      { uuid: editingUuid, input: { name: editName.trim(), url: editUrl.trim() } },
      {
        onSuccess: () => setEditingUuid(null),
        onError: (err) => setEditError(err),
      },
    );
  };

  const columns: GridColDef<ExternalEventIcsSource>[] = [
    { field: 'name', headerName: t('externalEventIcsSources.name'), flex: 1 },
    { field: 'url', headerName: t('externalEventIcsSources.url'), flex: 2 },
    {
      field: 'actions', headerName: '', width: 130, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('externalEventIcsSources.syncNow')}>
            <IconButton
              size="small"
              aria-label={t('externalEventIcsSources.syncNow')}
              onClick={() => handleSync(params.row.uuid)}
              disabled={syncingUuid === params.row.uuid}
            >
              {syncingUuid === params.row.uuid ? <CircularProgress size={18} /> : <SyncIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('externalEventIcsSources.edit')}>
            <IconButton size="small" aria-label={t('externalEventIcsSources.edit')} onClick={() => handleStartEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('externalEventIcsSources.delete')}>
            <IconButton size="small" aria-label={t('externalEventIcsSources.delete')} onClick={() => remove(params.row.uuid)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('externalEventIcsSources.title')}</Typography>

      <Stack spacing={1} sx={{ mb: 3, maxWidth: 640 }}>
        {createError && <Alert severity="error">{apiErrorMessage(createError)}</Alert>}
        <Stack direction="row" spacing={1}>
          <TextField label={t('externalEventIcsSources.name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label={t('externalEventIcsSources.url')} value={url} onChange={(e) => setUrl(e.target.value)} fullWidth />
          <Button variant="contained" disabled={creating || !canAdd} onClick={handleAdd} sx={{ flexShrink: 0 }}>
            {t('externalEventIcsSources.add')}
          </Button>
        </Stack>
      </Stack>

      {!isLoading && rows.length === 0 ? (
        <Typography color="text.secondary">{t('externalEventIcsSources.empty')}</Typography>
      ) : (
        <DataTable<ExternalEventIcsSource>
          columns={columns}
          rows={rows}
          rowCount={data?.row_count ?? 0}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          getRowId={(row) => row.uuid}
        />
      )}

      <Dialog open={editingUuid !== null} onClose={handleCancelEdit} fullWidth maxWidth="sm">
        <DialogTitle>{t('externalEventIcsSources.edit')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editError !== null && <Alert severity="error">{apiErrorMessage(editError) ?? t('externalEventIcsSources.editError')}</Alert>}
            <TextField
              label={t('externalEventIcsSources.name')}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('externalEventIcsSources.url')}
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={updating} onClick={handleCancelEdit}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={updating || !canSaveEdit} onClick={handleSaveEdit}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={syncFeedback !== null}
        autoHideDuration={5000}
        onClose={() => setSyncFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {syncFeedback ? (
          <Alert severity={syncFeedback.severity} onClose={() => setSyncFeedback(null)} sx={{ width: '100%' }}>
            {syncFeedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
