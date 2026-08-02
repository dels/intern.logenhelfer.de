import { Box } from '@mui/material';
import { useLandingConfig } from '../features/public-landing/api';

export interface BijouLogoProps {
  defaultSrc: string;
  width: number;
  height: number;
}

/**
 * Shared "lodge emblem" renderer used everywhere the app shows the Bijou
 * (top nav, login/forgot-password/reset-password pages): renders the
 * admin-uploaded custom logo when one is configured, falling back to
 * whichever bundled default asset the caller passes in - TopNav uses the
 * small bijou.png, the auth pages use the larger bijou-large.png, so the
 * default is a prop rather than baked into this component.
 */
export default function BijouLogo({ defaultSrc, width, height }: BijouLogoProps) {
  const { data } = useLandingConfig();
  const src = data?.logo_version ? `/api/v1/public/logo?v=${data.logo_version}` : defaultSrc;
  return <Box component="img" role="img" src={src} alt="" sx={{ width, height, objectFit: 'contain' }} />;
}
