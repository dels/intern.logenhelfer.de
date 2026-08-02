import { useNavigate, useParams } from 'react-router';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileForm from './FileForm';
import { useFile, useUpdateFile } from './api';
import { apiErrorMessage } from '../../api/client';

export default function FileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) throw new Error('FileEditPage requires a :uuid route param');
  const { data: file, isLoading } = useFile(uuid);
  const { mutate, isPending, error } = useUpdateFile(uuid);

  if (isLoading || !file) return null;

  return (
    <>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('files.edit')}</Typography>
      <FileForm
        defaultValues={{ filename: file.filename, role_ids: file.role_ids }}
        submitting={isPending}
        submitError={apiErrorMessage(error)}
        onSubmit={(values) => mutate(values, { onSuccess: () => navigate(`/categories/${file.category_slug}/directories/${file.directory_slug}`) })}
      />
    </>
  );
}
