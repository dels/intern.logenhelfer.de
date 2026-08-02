import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { Directory, DirectoryInput, DirectoryList } from '../../api/types';

export function useDirectories(categorySlug: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['directories', categorySlug],
    queryFn: () => apiFetch<DirectoryList>(`/api/v1/directories?category_slug=${encodeURIComponent(categorySlug)}`),
    enabled: options?.enabled ?? true,
  });
}

export function useDirectory(slug: string) {
  return useQuery({
    queryKey: ['directories', 'detail', slug],
    queryFn: () => apiFetch<Directory>(`/api/v1/directories/${slug}`),
  });
}

export function useCreateDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: DirectoryInput) => apiFetch<Directory>('/api/v1/directories', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (directory) => {
      queryClient.invalidateQueries({ queryKey: ['directories', directory.category_slug] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateDirectory(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: DirectoryInput) => apiFetch<Directory>(`/api/v1/directories/${slug}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (directory) => {
      queryClient.invalidateQueries({ queryKey: ['directories', directory.category_slug] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ slug }: { slug: string; categorySlug: string }) => apiFetch<void>(`/api/v1/directories/${slug}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      // removeQueries, not invalidateQueries: deleting from this directory's
      // own detail page immediately navigates back to the category page,
      // which mounts a fresh useDirectories(categorySlug) observer. React
      // Query renders a newly-mounted query's existing CACHED data first and
      // refetches in the background - invalidate alone would still show the
      // just-deleted directory's row (with its own "Löschen" button) for
      // that brief window, which can collide with the category page's own
      // "Löschen" button (both share the same accessible name) and either
      // throw a strict-mode violation or silently delete the wrong target.
      // Removing the cache entry outright forces a clean loading state
      // instead of a stale-then-corrected flash.
      queryClient.removeQueries({ queryKey: ['directories', variables.categorySlug] });
      toast.success(t('common.toast.deleted'));
    },
  });
}
