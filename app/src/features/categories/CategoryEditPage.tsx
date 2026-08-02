import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CategoryForm from './CategoryForm';
import { useCategory, useUpdateCategory } from './api';
import { apiErrorMessage } from '../../api/client';
import type { CategoryInput } from '../../api/types';

export default function CategoryEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('CategoryEditPage requires a :slug route param');
  const { data: category, isLoading } = useCategory(slug);
  const { mutate, isPending, error } = useUpdateCategory(slug);

  if (isLoading || !category) return null;

  const defaultValues: CategoryInput = {
    name: category.name,
    description: category.description,
    role_ids: category.role_ids,
  };

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('categories.edit')}</Typography>
      <CategoryForm
        defaultValues={defaultValues}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/categories/${slug}`) })}
      />
    </>
  );
}
