import { useNavigate, useParams } from 'react-router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DirectoryForm from './DirectoryForm';
import { useCreateDirectory } from './api';
import { useCategory } from '../categories/api';
import { apiErrorMessage } from '../../api/client';
import type { DirectoryInput } from '../../api/types';

export default function DirectoryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  if (!categorySlug) throw new Error('DirectoryCreatePage requires a :categorySlug route param');
  const { mutate, isPending, error } = useCreateDirectory();
  const { data: category, isLoading } = useCategory(categorySlug);

  if (isLoading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  const emptyDirectory: DirectoryInput = { name: '', description: '', category_slug: categorySlug, role_ids: category?.role_ids ?? [] };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('directories.create')}</Typography>
      <DirectoryForm
        defaultValues={emptyDirectory}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (directory) => navigate(`/categories/${categorySlug}/directories/${directory.slug}`) })}
      />
    </>
  );
}
