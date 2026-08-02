import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../notifications/useToast';
import type { Me } from '../../api/types';

interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export function useUpdatePassword() {
  const { setUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdatePasswordInput) =>
      apiFetch<Me>('/api/v1/me/password', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (me) => {
      setUser(me.user);
      toast.success(t('common.toast.updated'));
    },
  });
}
