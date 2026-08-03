import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage, apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type {
  AppConfigValues, DistrictInput, DistrictSummary,
  AcademicTitleList, AcademicTitleInput, AcademicTitleSummary, RoleSummary,
} from '../../api/types';

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiFetch<AppConfigValues>('/api/v1/app_config'),
  });
}

export function useUpdateAppConfig() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (values: Partial<AppConfigValues>) =>
      apiFetch<AppConfigValues>('/api/v1/app_config', { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-config'] });
      toast.success(t('common.toast.updated'));
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? t('common.toast.error')),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<{ content_type: string; updated_at: string }>('/api/v1/logo', { method: 'POST', body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-landing-config'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useResetLogo() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/v1/logo', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-landing-config'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useCreateDistrict() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: DistrictInput) => apiFetch<DistrictSummary>('/api/v1/districts', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateDistrict(id: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: DistrictInput) => apiFetch<DistrictSummary>(`/api/v1/districts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteDistrict() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/v1/districts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useAcademicTitles() {
  return useQuery({
    queryKey: ['academic-titles'],
    queryFn: () => apiFetch<AcademicTitleList>('/api/v1/academic_titles'),
  });
}

export function useCreateAcademicTitle() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: AcademicTitleInput) => apiFetch<AcademicTitleSummary>('/api/v1/academic_titles', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-titles'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateAcademicTitle(id: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: AcademicTitleInput) => apiFetch<AcademicTitleSummary>(`/api/v1/academic_titles/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-titles'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteAcademicTitle() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/v1/academic_titles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-titles'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useUpdateRoleEmail(id: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (email: string) => apiFetch<RoleSummary>(`/api/v1/roles/${id}`, { method: 'PATCH', body: JSON.stringify({ email }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('common.toast.updated'));
    },
  });
}
