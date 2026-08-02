import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { HealthStatus } from './types';

export function useDemoMode(): boolean {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthStatus>('/api/v1/health'),
    retry: false,
  });
  return data?.demo ?? false;
}
