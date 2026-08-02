import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { PublicLandingConfig } from '../../api/types';

export function useLandingConfig() {
  return useQuery({
    queryKey: ['public-landing-config'],
    queryFn: () => apiFetch<PublicLandingConfig>('/api/v1/public/landing'),
  });
}
