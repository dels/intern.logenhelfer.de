import { Outlet } from 'react-router';
import { Box, Toolbar } from '@mui/material';
import TopNav from './TopNav';

export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: 'calc(100dvh - var(--demo-banner-height, 0px))', mt: 'var(--demo-banner-height, 0px)', display: 'flex', flexDirection: 'column' }}>
      <TopNav variant="public" />
      <Toolbar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
