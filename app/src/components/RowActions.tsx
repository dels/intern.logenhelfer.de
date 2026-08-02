import { useState, type MouseEvent } from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import CheckIcon from '@mui/icons-material/CheckRounded';

export interface RowActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  editLabel: string;
  deleteLabel: string;
  confirmLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RowActions({
  canEdit, canDelete, deleting, editLabel, deleteLabel, confirmLabel, onEdit, onDelete,
}: RowActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (!canEdit && !canDelete) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <Stack direction="row" spacing={0.5} onClick={stop}>
      {canEdit && (
        <Tooltip title={editLabel}>
          <IconButton size="small" onClick={onEdit} aria-label={editLabel}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        confirming ? (
          <Tooltip title={confirmLabel}>
            <IconButton size="small" color="error" disabled={deleting} aria-label={confirmLabel}
              onClick={() => { onDelete(); setConfirming(false); }}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={deleteLabel}>
            <IconButton size="small" color="error" aria-label={deleteLabel} onClick={() => setConfirming(true)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      )}
    </Stack>
  );
}
