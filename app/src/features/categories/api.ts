import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { Category, CategoryInput, CategoryList, RoleList } from '../../api/types';

export function useCategories(page: number, pageSize: number, sort = 'name') {
  return useQuery({
    queryKey: ['categories', page, pageSize, sort],
    queryFn: () => apiFetch<CategoryList>(`/api/v1/categories?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: () => apiFetch<Category>(`/api/v1/categories/${slug}`),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: CategoryInput) => apiFetch<Category>('/api/v1/categories', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateCategory(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: CategoryInput) => apiFetch<Category>(`/api/v1/categories/${slug}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (slug: string) => apiFetch<void>(`/api/v1/categories/${slug}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

// Shared with frontend/src/features/directories - both forms need the
// full role list for their multi-select. Small, unpaginated (see Global
// Constraints), so a plain useQuery with no page params is enough.
//
// `scope` is optional so every existing caller (Category/Directory/
// AttachedFile forms wanting ALL roles) is unaffected - query key and URL
// both fall back to the exact previous behavior when omitted.
export function useRoles(scope?: 'positions' | 'administrational') {
  return useQuery({
    queryKey: ['roles', scope ?? 'all'],
    queryFn: () => apiFetch<RoleList>(`/api/v1/roles${scope ? `?scope=${scope}` : ''}`),
  });
}
