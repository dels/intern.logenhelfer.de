import { useNavigate } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CategoryForm from './CategoryForm';
import { useCreateCategory } from './api';
import { apiErrorMessage } from '../../api/client';
import type { CategoryInput } from '../../api/types';

const emptyCategory: CategoryInput = { name: '', description: '', role_ids: [] };

export default function CategoryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateCategory();

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('categories.create')}</Typography>
      <CategoryForm
        defaultValues={emptyCategory}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: (category) => navigate(`/categories/${category.slug}`) })}
      />
    </>
  );
}
