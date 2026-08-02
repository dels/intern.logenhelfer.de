import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../notifications/useToast';
import type { Announcement, AnnouncementInput, AnnouncementList, Me } from '../../api/types';

export function useAnnouncements(page: number, pageSize: number, sort = '-created_at') {
  return useQuery({
    queryKey: ['announcements', page, pageSize, sort],
    queryFn: () => apiFetch<AnnouncementList>(`/api/v1/announcements?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useAnnouncement(uuid: string) {
  return useQuery({
    queryKey: ['announcements', uuid],
    queryFn: () => apiFetch<Announcement>(`/api/v1/announcements/${uuid}`),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => apiFetch<Announcement>('/api/v1/announcements', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateAnnouncement(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => apiFetch<Announcement>(`/api/v1/announcements/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/announcements/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

// Self-service only - acts on current_user, never an admin-supplied target
// user. Idempotent (unlike the legacy toggle-only endpoint this replaces) -
// see this plan's Global Constraints. Updates the AuthProvider's cached user
// directly from the response rather than refetching /api/v1/me.
export function useUpdateAnnouncementSubscription() {
  const { setUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (subscribed: boolean) =>
      apiFetch<Me>('/api/v1/me/announcement_subscription', { method: 'PATCH', body: JSON.stringify({ subscribed }) }),
    onSuccess: (me) => {
      setUser(me.user);
      toast.success(t('common.toast.updated'));
    },
  });
}

// Self-service only - acts on current_user. Idempotent (no "un-accept" -
// matches the legacy statics_controller#index gate this replaces).
export function useAcceptGdpr() {
  const { setUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => apiFetch<Me>('/api/v1/me/gdpr_acceptance', { method: 'PATCH' }),
    onSuccess: (me) => {
      setUser(me.user);
      toast.success(t('common.toast.updated'));
    },
  });
}
