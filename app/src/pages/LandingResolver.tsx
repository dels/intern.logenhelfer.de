import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import { useLandingConfig } from '../features/public-landing/api';

function Spinner() {
  return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}><CircularProgress /></Box>;
}

export default function LandingResolver() {
  const { status } = useAuth();
  const { data, isLoading } = useLandingConfig();

  if (status === 'loading') return <Spinner />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  if (isLoading) return <Spinner />;
  return <Navigate to={data?.calendar_as_landing_page ? '/calendar' : '/login'} replace />;
}
