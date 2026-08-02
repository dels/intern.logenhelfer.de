import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { DistrictList, Lodge, LodgeInput, LodgeList } from '../../api/types';

export function useLodges(page: number, pageSize: number, sort = 'name') {
  return useQuery({
    queryKey: ['lodges', page, pageSize, sort],
    queryFn: () => apiFetch<LodgeList>(`/api/v1/lodges?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useLodge(slug: string) {
  return useQuery({
    queryKey: ['lodges', slug],
    queryFn: () => apiFetch<Lodge>(`/api/v1/lodges/${slug}`),
  });
}

export function useCreateLodge() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: LodgeInput) => apiFetch<Lodge>('/api/v1/lodges', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodges'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateLodge(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: LodgeInput) => apiFetch<Lodge>(`/api/v1/lodges/${slug}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodges'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteLodge() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (slug: string) => apiFetch<void>(`/api/v1/lodges/${slug}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodges'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

// Shared with frontend/src/features/officers - Officer's lodge_slug field
// on create needs this same district-free lodge list only indirectly (via
// route params), but LodgeForm's own district picker needs the full list.
export function useDistricts() {
  return useQuery({
    queryKey: ['districts'],
    queryFn: () => apiFetch<DistrictList>('/api/v1/districts'),
  });
}
