import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert, Box, Button, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, Pagination, Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ShieldIcon from '@mui/icons-material/Shield';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import MembersNavTabs from './MembersNavTabs';
import MemberAccordionList from './MemberAccordionList';
import { useMembers, useDeleteMember, downloadMembersCsv, downloadMembersVcf, downloadMembersListPdf, RecordExportFailedError } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import type { MemberSummary } from '../../api/types';
import { PhoneLink, EmailLink } from '../../components/ContactLinks';

export default function MembersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'lastname', sort: 'asc' }]);
  const { mutate: deleteMember, isPending: deleting } = useDeleteMember();
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [pdfError, setPdfError] = useState(false);
  // Distinct from pdfError (which drives the password-too-short helperText):
  // this covers the case where the PDF DID download successfully but the
  // record_export audit-log call afterwards failed - a silent gap in the
  // compliance trail otherwise, since the button's onClick is fire-and-forget.
  const [pdfRecordError, setPdfRecordError] = useState(false);

  const handleGeneratePdf = async () => {
    if (pdfPassword.length < 5) {
      setPdfError(true);
      return;
    }
    setPdfError(false);
    setPdfRecordError(false);
    try {
      await downloadMembersListPdf(pdfPassword);
      setPdfDialogOpen(false);
      setPdfPassword('');
    } catch (err) {
      if (err instanceof RecordExportFailedError) {
        // Download already happened - keep the dialog open and surface the
        // logging failure instead of silently doing nothing.
        setPdfRecordError(true);
        return;
      }
      throw err;
    }
  };

  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'lastname';
  const { data, isLoading, isError, error } = useMembers(paginationModel.page, paginationModel.pageSize, sortParam, search);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const pageCount = Math.ceil((data?.row_count ?? 0) / paginationModel.pageSize);

  const columns: GridColDef<MemberSummary>[] = [
    { field: 'matriculation_number', headerName: t('members.matriculationNumber'), width: 140 },
    { field: 'lastname', headerName: t('members.name'), flex: 1, valueGetter: (_v, row) => `${row.firstname} ${row.lastname}` },
    {
      field: 'mfa_enabled', headerName: t('members.mfaColumnHeader'), width: 72, sortable: false, filterable: false, disableColumnMenu: true,
      // Same gate as MemberAccordionList.tsx's mobile badge and this table's
      // own actions column: per-row can_edit, not a class-level ability.
      renderCell: (params) => (params.row.can_edit ? (
        <Tooltip title={params.row.mfa_enabled ? t('members.mfaEnabled') : t('members.mfaDisabled')}>
          {params.row.mfa_enabled ? <ShieldIcon fontSize="small" color="success" /> : <ShieldOutlinedIcon fontSize="small" color="disabled" />}
        </Tooltip>
      ) : null),
    },
    { field: 'mobile', headerName: t('members.mobile'), flex: 1, renderCell: (params) => (params.value ? <PhoneLink phone={params.value} /> : null) },
    { field: 'email', headerName: t('members.email'), flex: 1, renderCell: (params) => (params.value ? <EmailLink email={params.value} /> : null) },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      // Per-instance (row.can_edit/can_destroy), not class-level abilities -
      // member permissions differ per row (self-service vs admin tiers),
      // matching MemberDetailPage's own gating.
      renderCell: (params) => (
        <RowActions
          canEdit={params.row.can_edit} canDelete={params.row.can_destroy} deleting={deleting}
          editLabel={t('members.edit')} deleteLabel={t('members.delete')} confirmLabel={t('members.deleteConfirm')}
          onEdit={() => navigate(`/members/${params.row.uuid ?? ''}/edit`)}
          onDelete={() => deleteMember(params.row.uuid ?? '')}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">{t('nav.users')}</Typography>
        {abilities.user?.includes('create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/members/new')}>
            {t('members.create')}
          </Button>
        )}
      </Box>
      <MembersNavTabs />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button size="small" onClick={() => void downloadMembersCsv()}>{t('members.exportCsv')}</Button>
        <Button size="small" onClick={() => void downloadMembersVcf()}>{t('members.exportVcf')}</Button>
        <Button size="small" onClick={() => setPdfDialogOpen(true)}>{t('members.exportPdf')}</Button>
      </Box>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('members.loadError')}
          {apiErrorMessage(error) ? ` (${apiErrorMessage(error)})` : ''}
        </Alert>
      )}
      <TextField
        label={t('members.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
      />
      {isDesktop ? (
        <DataTable<MemberSummary>
          columns={columns}
          rows={data?.rows ?? []}
          rowCount={data?.row_count ?? 0}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          getRowId={(row) => row.uuid ?? ''}
          onRowClick={(row) => navigate(`/members/${row.uuid ?? ''}`)}
        />
      ) : (
        <>
          <MemberAccordionList members={data?.rows ?? []} />
          {pageCount > 1 && (
            <Pagination
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
              count={pageCount}
              page={paginationModel.page + 1}
              onChange={(_e, page) => setPaginationModel((m) => ({ ...m, page: page - 1 }))}
            />
          )}
        </>
      )}
      <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)}>
        <DialogTitle>{t('members.exportPdfPasswordPrompt')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('members.exportPdfPasswordLabel')}
            type="password"
            value={pdfPassword}
            onChange={(e) => setPdfPassword(e.target.value)}
            error={pdfError}
            helperText={pdfError ? t('members.exportPdfPasswordTooShort') : undefined}
          />
          {pdfRecordError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {t('members.exportRecordFailed')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleGeneratePdf()}>{t('members.exportPdfGenerate')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
