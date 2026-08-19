import { Box, CircularProgress } from '@mui/material';
import DOMPurify from 'dompurify';
import { useDatenschutz } from '../features/public-landing/datenschutz-api';

export default function DatenschutzPage() {
  const { data, isLoading } = useDatenschutz();

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // The API returns admin-authored HTML (AppConfig[:datenschutz], editable
  // only via the authenticated Configuration page). It's rendered on an
  // unauthenticated public page, so it's sanitized here as defense in
  // depth against a compromised admin account persisting XSS.
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data?.html ?? '') }} />
  );
}
