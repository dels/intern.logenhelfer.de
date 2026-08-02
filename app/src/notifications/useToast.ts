import { createContext, useContext } from 'react';

export type ToastSeverity = 'success' | 'error';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const noopToastApi: ToastApi = { success: () => {}, error: () => {} };

export const ToastContext = createContext<ToastApi>(noopToastApi);

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
