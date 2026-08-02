function parseTtlSeconds(envVar: string | undefined, fallback: number): number {
  if (!envVar) return fallback;
  const parsed = Number(envVar);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Access token TTL in seconds. Default 900 (15 min). */
export const JWT_ACCESS_TTL_SECONDS = parseTtlSeconds(process.env.JWT_ACCESS_TTL, 900);

/** Refresh token TTL in seconds. Default 604800 (7 days). */
export const JWT_REFRESH_TTL_SECONDS = parseTtlSeconds(process.env.JWT_REFRESH_TTL, 604800);

/** Password reset token TTL in seconds. Default 3600 (60 min). */
export const RESET_PASSWORD_TOKEN_TTL_SECONDS = parseTtlSeconds(process.env.RESET_PASSWORD_TOKEN_TTL, 3600);
