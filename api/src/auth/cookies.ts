import type { CookieOptions, Response } from 'express';

import { JWT_REFRESH_TTL_SECONDS } from './tokenConfig.js';

// Port of the cookie contract in
// rails-app/app/controllers/api/v1/sessions_controller.rb
// (COOKIE_NAME / COOKIE_PATH / set_refresh_cookie).
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const COOKIE_PATH = '/api/v1/session';
// Shares JWT_REFRESH_TTL_SECONDS with refreshToken.ts's own TTL_MS so the
// cookie's maxAge and the token's actual DB expiry can never drift apart.
const TTL_MS = JWT_REFRESH_TTL_SECONDS * 1000;

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Rails also flips `secure` on for the `prod` environment; this port only
    // has NODE_ENV=production/development/test, so it gates on production
    // per the task spec rather than trying to reconstruct that extra env.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: COOKIE_PATH,
  };
}

export function setRefreshTokenCookie(res: Response, rawToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, {
    ...baseCookieOptions(),
    maxAge: TTL_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, baseCookieOptions());
}
