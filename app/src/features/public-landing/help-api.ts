import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { PublicHelp } from '../../api/types';

export function useHelp() {
  return useQuery({
    queryKey: ['public-help'],
    queryFn: () => apiFetch<PublicHelp>('/api/v1/public/help'),
  });
}
