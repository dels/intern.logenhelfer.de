import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { PublicImpressum } from '../../api/types';

export function useImpressum() {
  return useQuery({
    queryKey: ['public-impressum'],
    queryFn: () => apiFetch<PublicImpressum>('/api/v1/public/impressum'),
  });
}
