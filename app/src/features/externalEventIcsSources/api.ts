import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type {
  ExternalEventIcsSource, ExternalEventIcsSourceInput, ExternalEventIcsSourceList, ExternalEventIcsSourceUpdate,
} from '../../api/types';

export function useExternalEventIcsSources(page: number, pageSize: number, sort = 'name') {
  return useQuery({
    queryKey: ['external-event-ics-sources', page, pageSize, sort],
    queryFn: () => apiFetch<ExternalEventIcsSourceList>(`/api/v1/external_event_ics_sources?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useCreateExternalEventIcsSource() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ExternalEventIcsSourceInput) =>
      apiFetch<ExternalEventIcsSource>('/api/v1/external_event_ics_sources', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-event-ics-sources'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateExternalEventIcsSource() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: ExternalEventIcsSourceUpdate }) =>
      apiFetch<ExternalEventIcsSource>(`/api/v1/external_event_ics_sources/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-event-ics-sources'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteExternalEventIcsSource() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/external_event_ics_sources/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-event-ics-sources'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useSyncExternalEventIcsSource() {
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<{ created: number; updated: number; removed: number }>(`/api/v1/external_event_ics_sources/${uuid}/sync`, { method: 'POST' }),
  });
}
