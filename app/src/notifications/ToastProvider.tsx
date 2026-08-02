import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { ToastContext, type ToastApi, type ToastSeverity } from './useToast';

interface Toast {
  message: string;
  severity: ToastSeverity;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  // Stable across renders: `ToastProvider` sits above `RouterProvider` in
  // App.tsx, so every consumer of useToast() anywhere in the routed app
  // re-renders whenever this context value's identity changes. Without
  // useMemo, firing a toast (setToast) recreates `api` and forces every
  // mounted page's mutation hooks to re-render too, even though `success`/
  // `error` never change behavior.
  const api = useMemo<ToastApi>(() => ({
    success: (message) => setToast({ message, severity: 'success' }),
    error: (message) => setToast({ message, severity: 'error' }),
  }), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={(_event, reason) => {
          if (reason === 'clickaway') return;
          setToast(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}
