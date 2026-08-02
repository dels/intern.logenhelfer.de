import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './notifications/ToastProvider';
import { router } from './routes';
import SiteMetaSync from './features/public-landing/SiteMetaSync';
import DemoBanner from './components/DemoBanner';
import ServerStatusBanner from './components/ServerStatusBanner';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SiteMetaSync />
        <DemoBanner />
        <ServerStatusBanner />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
