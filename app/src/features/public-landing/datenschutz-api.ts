import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { PublicDatenschutz } from '../../api/types';

export function useDatenschutz() {
  return useQuery({
    queryKey: ['public-datenschutz'],
    queryFn: () => apiFetch<PublicDatenschutz>('/api/v1/public/datenschutz'),
  });
}
