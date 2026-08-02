import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { PublicWorkingplan } from '../../api/types';

export function usePublicWorkingplan() {
  return useQuery({
    queryKey: ['public-workingplan'],
    queryFn: () => apiFetch<PublicWorkingplan>('/api/v1/public/workingplan'),
  });
}
