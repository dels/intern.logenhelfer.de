import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { Officer, OfficerInput, OfficerList, RoleList } from '../../api/types';

export function useOfficers(lodgeSlug: string) {
  return useQuery({
    queryKey: ['officers', lodgeSlug],
    queryFn: () => apiFetch<OfficerList>(`/api/v1/officers?lodge_slug=${encodeURIComponent(lodgeSlug)}`),
  });
}

export function useOfficer(uuid: string) {
  return useQuery({
    queryKey: ['officers', 'detail', uuid],
    queryFn: () => apiFetch<Officer>(`/api/v1/officers/${uuid}`),
  });
}

export function useCreateOfficer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: OfficerInput) => apiFetch<Officer>('/api/v1/officers', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (officer) => {
      queryClient.invalidateQueries({ queryKey: ['officers', officer.lodge_slug] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateOfficer(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: OfficerInput) => apiFetch<Officer>(`/api/v1/officers/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (officer) => {
      queryClient.invalidateQueries({ queryKey: ['officers', officer.lodge_slug] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteOfficer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ uuid }: { uuid: string; lodgeSlug: string }) => apiFetch<void>(`/api/v1/officers/${uuid}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      // removeQueries, not invalidateQueries - see the matching comment on
      // useDeleteDirectory (app/src/features/directories/api.ts). Same race:
      // deleting an officer navigates back to the lodge page, which mounts a
      // fresh useOfficers(lodgeSlug) observer that would otherwise render
      // stale cached data (the just-deleted officer's row, with its own
      // "Löschen" button) before the background refetch settles.
      queryClient.removeQueries({ queryKey: ['officers', variables.lodgeSlug] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

// scope=positions excludes degree/administrational roles - see this
// plan's Global Constraints for why this differs from the full role list
// Category/Directory's role multi-select uses.
export function usePositionRoles() {
  return useQuery({
    queryKey: ['roles', 'positions'],
    queryFn: () => apiFetch<RoleList>('/api/v1/roles?scope=positions'),
  });
}
