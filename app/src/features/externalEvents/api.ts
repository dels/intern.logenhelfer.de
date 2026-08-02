import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { ExternalEvent, ExternalEventInput, ExternalEventList, ExternalEventParticipant, ExternalEventWithParticipants } from '../../api/types';

export interface ExternalEventDefaults {
  location: string | null;
  duration_minutes: number;
}

export function useExternalEventDefaults() {
  return useQuery({
    queryKey: ['external-events', 'defaults'],
    queryFn: () => apiFetch<ExternalEventDefaults>('/api/v1/external_events/defaults'),
  });
}

export function useExternalEvents(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['external-events', page, pageSize],
    queryFn: () => apiFetch<ExternalEventList>(`/api/v1/external_events?page=${page}&per_page=${pageSize}`),
  });
}

export function useExternalEvent(uuid: string) {
  return useQuery({
    queryKey: ['external-events', uuid],
    queryFn: () => apiFetch<ExternalEventWithParticipants>(`/api/v1/external_events/${uuid}`),
  });
}

export function useCreateExternalEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ExternalEventInput) => apiFetch<ExternalEvent>('/api/v1/external_events', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateExternalEvent(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ExternalEventInput) => apiFetch<ExternalEvent>(`/api/v1/external_events/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteExternalEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/external_events/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useRegisterExternalEventParticipant(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: { user_uuid?: string; festive_board?: boolean }) =>
      apiFetch<ExternalEventParticipant>(`/api/v1/external_events/${uuid}/participants`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events', uuid] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useRemoveExternalEventParticipant(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (userUuid: string) => apiFetch<void>(`/api/v1/external_events/${uuid}/participants/${userUuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events', uuid] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useConfirmExternalEventParticipant(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (userUuid: string) => apiFetch<ExternalEventParticipant>(`/api/v1/external_events/${uuid}/participants/${userUuid}/confirm`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events', uuid] });
      toast.success(t('common.toast.updated'));
    },
  });
}
