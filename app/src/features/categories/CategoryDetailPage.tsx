import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useCategory, useDeleteCategory } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { useDirectories, useDeleteDirectory } from '../directories/api';
import RowActions from '../../components/RowActions';
import VisibleToRoles from '../../components/VisibleToRoles';
import { useSetBreadcrumb } from '../../layouts/BreadcrumbContext';

export default function CategoryDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('CategoryDetailPage requires a :slug route param');
  const { data: category, isLoading } = useCategory(slug);
  const { mutate: deleteCategory, isPending: deleting, error: deleteError } = useDeleteCategory();
  const [confirming, setConfirming] = useState(false);
  const { data: directories } = useDirectories(slug);
  const { mutate: deleteDirectory, isPending: deletingDirectory } = useDeleteDirectory();
  useSetBreadcrumb(category ? [
    { label: t('nav.categories'), to: '/categories' },
    { label: category.name ?? '' },
  ] : null);

  if (isLoading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  if (!category) return null;

  // Class-level abilities.category is correct here (not per-instance, like
  // Members) - Category's manage ability has no block condition, so this
  // boolean is the same for every category instance given a fixed caller.
  const canUpdate = abilities.category?.includes('update');
  const canDestroy = abilities.category?.includes('destroy');
  const canCreateDirectory = abilities.directory?.includes('create');
  const canUpdateDirectory = abilities.directory?.includes('update') ?? false;
  const canDestroyDirectory = abilities.directory?.includes('destroy') ?? false;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{category.name}</Typography>
        {(canUpdate || canDestroy) && (
          <Stack direction="row" spacing={1}>
            {canUpdate && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/categories/${slug}/edit`)}>
                {t('categories.edit')}
              </Button>
            )}
            {canDestroy && (
              confirming ? (
                <Button color="error" variant="contained" disabled={deleting}
                  onClick={() => deleteCategory(slug, { onSuccess: () => navigate('/categories') })}>
                  {t('categories.deleteConfirm')}
                </Button>
              ) : (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirming(true)}>
                  {t('categories.delete')}
                </Button>
              )
            )}
          </Stack>
        )}
      </Stack>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(deleteError)}</Alert>}
      <VisibleToRoles roleIds={category.role_ids ?? []} />
      {category.description && <Typography color="text.secondary">{category.description}</Typography>}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
        <Typography variant="h2">{t('categories.directories')}</Typography>
        {canCreateDirectory && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => navigate(`/categories/${slug}/directories/new`)}>
            {t('directories.create')}
          </Button>
        )}
      </Stack>
      <List>
        {(directories?.rows ?? []).map((d) => (
          <ListItem key={d.slug} onClick={() => navigate(`/categories/${slug}/directories/${d.slug}`)} sx={{ cursor: 'pointer' }}
            secondaryAction={
              <RowActions
                canEdit={canUpdateDirectory} canDelete={canDestroyDirectory} deleting={deletingDirectory}
                editLabel={t('directories.edit')} deleteLabel={t('directories.delete')} confirmLabel={t('directories.deleteConfirm')}
                onEdit={() => navigate(`/categories/${slug}/directories/${d.slug}/edit`)}
                onDelete={() => deleteDirectory({ slug: d.slug, categorySlug: slug })}
              />
            }>
            <ListItemText primary={d.name} secondary={d.description} />
          </ListItem>
        ))}
        {directories?.rows.length === 0 && <Typography color="text.secondary">—</Typography>}
      </List>
    </Box>
  );
}
