import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { UserStatsList, DownloadList, FileStatsList, UserFileStatsList, MemStats } from '../../api/types';

export function useUserStats(page: number, pageSize: number, sort = '-current_sign_in_at') {
  return useQuery({
    queryKey: ['statistics', 'user_stats', page, pageSize, sort],
    queryFn: () => apiFetch<UserStatsList>(`/api/v1/statistics/user_stats?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useDownloads(page: number, pageSize: number, sort = '-created_at') {
  return useQuery({
    queryKey: ['statistics', 'downloads', page, pageSize, sort],
    queryFn: () => apiFetch<DownloadList>(`/api/v1/statistics/downloads?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useFileStats(page: number, pageSize: number, sort = '-count') {
  return useQuery({
    queryKey: ['statistics', 'file_stats', page, pageSize, sort],
    queryFn: () => apiFetch<FileStatsList>(`/api/v1/statistics/file_stats?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useUserFileStats(page: number, pageSize: number, sort = '-count') {
  return useQuery({
    queryKey: ['statistics', 'user_file_stats', page, pageSize, sort],
    queryFn: () => apiFetch<UserFileStatsList>(`/api/v1/statistics/user_file_stats?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useMemStats() {
  return useQuery({
    queryKey: ['statistics', 'mem_stats'],
    queryFn: () => apiFetch<MemStats>('/api/v1/statistics/mem_stats'),
  });
}
