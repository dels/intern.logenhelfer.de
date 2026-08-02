import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { Seeker, SeekerInput, SeekerList, SeekerNameList } from '../../api/types';

export type SeekerFilter = 'active' | 'accepted' | 'inactive' | 'declined';

export function useSeekers(page: number, pageSize: number, sort: string, filter: SeekerFilter, enabled = true) {
  return useQuery({
    queryKey: ['seekers', page, pageSize, sort, filter],
    queryFn: () =>
      apiFetch<SeekerList>(
        `/api/v1/seekers?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}&filter=${filter}`,
      ),
    enabled,
  });
}

/** GET /api/v1/seekers/names - names-only, active seekers, gated by show_seeker_names_to_brothers. */
export function useSeekerNames(enabled = true) {
  return useQuery({
    queryKey: ['seekers', 'names'],
    queryFn: () => apiFetch<SeekerNameList>('/api/v1/seekers/names'),
    enabled,
  });
}

export function useSeeker(uuid: string) {
  return useQuery({
    queryKey: ['seekers', uuid],
    queryFn: () => apiFetch<Seeker>(`/api/v1/seekers/${uuid}`),
  });
}

export function useCreateSeeker() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: SeekerInput) => apiFetch<Seeker>('/api/v1/seekers', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seekers'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateSeeker(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: SeekerInput) => apiFetch<Seeker>(`/api/v1/seekers/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seekers'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteSeeker() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/seekers/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seekers'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}
