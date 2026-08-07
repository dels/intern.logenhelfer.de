import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Centrally-configurable, per-IP rate limiter factory backing
 * `Rack::Attack`'s throttles (rails-app/config/initializers/rack_attack.rb).
 * `name` picks up overrides from the shared root `.env` via
 * `RATE_LIMIT_<NAME>_MAX` / `RATE_LIMIT_<NAME>_WINDOW_MS` (e.g. `name:
 * 'LOGIN'` reads `RATE_LIMIT_LOGIN_MAX` / `RATE_LIMIT_LOGIN_WINDOW_MS`),
 * falling back to `defaultMaxRequests`/`defaultWindowMs` when unset.
 *
 * Response shape on 429 matches this API's `{error, detail?}` convention
 * (see api/src/lib/errors.ts) rather than express-rate-limit's default
 * plain-text body, so callers get a consistent JSON contract everywhere.
 */

function envOverride(name: string, suffix: 'MAX' | 'WINDOW_MS'): number | undefined {
  const raw = process.env[`RATE_LIMIT_${name}_${suffix}`];
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function rateLimitedResponse(_req: Request, res: Response): void {
  res.status(429).json({ error: 'too_many_requests' });
}

/**
 * Builds an Express rate-limiting middleware. Effectively disabled in
 * `NODE_ENV=test` (an extremely high limit rather than `skip: true`, so the
 * middleware's shape/behavior stays identical across environments) -
 * mirrors Rack::Attack's own `!Rails.env.test?` exemption on the login
 * throttle: the e2e suite and this port's own test/spec runs log in
 * repeatedly, from one IP, within the same window, across many
 * examples/specs - without the exemption that would deterministically trip
 * the throttle and produce flaky failures unrelated to any real bug, not
 * protect anything (production never runs with NODE_ENV=test).
 */
export function createRateLimiter(name: string, defaultMaxRequests: number, defaultWindowMs: number): RateLimitRequestHandler {
  const isTest = process.env.NODE_ENV === 'test';

  const limit = isTest ? Number.MAX_SAFE_INTEGER : (envOverride(name, 'MAX') ?? defaultMaxRequests);
  const windowMs = isTest ? defaultWindowMs : (envOverride(name, 'WINDOW_MS') ?? defaultWindowMs);

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitedResponse,
  });
}

/**
 * Port of rack_attack.rb's `Rack::Attack.throttle('api/session', limit: 10,
 * period: 60)` - throttles POST /api/v1/session to 10 requests per 60s per
 * IP. Env overrides: `RATE_LIMIT_LOGIN_MAX` / `RATE_LIMIT_LOGIN_WINDOW_MS`.
 */
export const loginRateLimiter: RateLimitRequestHandler = createRateLimiter('LOGIN', 10, 60_000);

/**
 * Throttles both password-reset endpoints (`POST /api/v1/password/forgot`
 * and `/reset`) to 5 requests per 60s per IP. Env overrides:
 * `RATE_LIMIT_PASSWORD_RESET_MAX` / `RATE_LIMIT_PASSWORD_RESET_WINDOW_MS`.
 *
 * ponytail: per-IP only - a distributed attacker enumerating many emails
 * from different source IPs isn't slowed by this at all. For `/forgot`
 * specifically, the real backstop against email-bombing the technical
 * contact is the `notify_technical_contact_on_unknown_password_reset`
 * AppConfig toggle, not this limiter.
 */
export const passwordResetRateLimiter: RateLimitRequestHandler = createRateLimiter('PASSWORD_RESET', 5, 60_000);

/**
 * Throttles the public status endpoint (`GET /api/v1/public/status/:token`)
 * to 60 requests per 60s per IP. Env overrides: `RATE_LIMIT_STATUS_MAX` /
 * `RATE_LIMIT_STATUS_WINDOW_MS`.
 */
export const statusRateLimiter: RateLimitRequestHandler = createRateLimiter('STATUS', 60, 60_000);
