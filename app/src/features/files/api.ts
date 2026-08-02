import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch, downloadFile as downloadFileRequest } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { AttachedFile, AttachedFileList } from '../../api/types';

export function useFiles(directorySlug: string) {
  return useQuery({
    queryKey: ['files', directorySlug],
    queryFn: () => apiFetch<AttachedFileList>(`/api/v1/attached_files?directory_slug=${encodeURIComponent(directorySlug)}`),
  });
}

export function useFile(uuid: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['files', 'detail', uuid],
    queryFn: () => apiFetch<AttachedFile>(`/api/v1/attached_files/${uuid}`),
    enabled: options?.enabled ?? true,
  });
}

interface UploadFileInput {
  file: File;
  directorySlug: string;
  roleIds: number[];
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ file, directorySlug, roleIds }: UploadFileInput) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory_slug', directorySlug);
      roleIds.forEach((id) => formData.append('role_ids[]', String(id)));
      return apiFetch<AttachedFile>('/api/v1/attached_files', { method: 'POST', body: formData });
    },
    onSuccess: (attachedFile) => {
      queryClient.invalidateQueries({ queryKey: ['files', attachedFile.directory_slug] });
      toast.success(t('common.toast.created'));
    },
  });
}

interface UpdateFileInput {
  filename: string;
  role_ids: number[];
}

export function useUpdateFile(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateFileInput) => apiFetch<AttachedFile>(`/api/v1/attached_files/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (attachedFile) => {
      queryClient.invalidateQueries({ queryKey: ['files', attachedFile.directory_slug] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ uuid }: { uuid: string; directorySlug: string }) => apiFetch<void>(`/api/v1/attached_files/${uuid}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', variables.directorySlug] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function downloadFile(uuid: string, filename: string) {
  return downloadFileRequest(`/api/v1/attached_files/${uuid}/download`, filename);
}
