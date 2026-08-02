import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DirectoryForm from './DirectoryForm';
import { useDirectory, useUpdateDirectory } from './api';
import { apiErrorMessage } from '../../api/client';
import type { DirectoryInput } from '../../api/types';

export default function DirectoryEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorySlug, slug } = useParams<{ categorySlug: string; slug: string }>();
  if (!categorySlug || !slug) throw new Error('DirectoryEditPage requires :categorySlug and :slug route params');
  const { data: directory, isLoading } = useDirectory(slug);
  const { mutate, isPending, error } = useUpdateDirectory(slug);

  if (isLoading || !directory) return null;

  const defaultValues: DirectoryInput = {
    name: directory.name,
    description: directory.description,
    role_ids: directory.role_ids,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('directories.edit')}</Typography>
      <DirectoryForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/categories/${categorySlug}/directories/${slug}`) })}
      />
    </>
  );
}
