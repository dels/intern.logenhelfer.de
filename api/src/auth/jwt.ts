import jwt from 'jsonwebtoken';

import { JWT_ACCESS_TTL_SECONDS as TTL_SECONDS } from './tokenConfig.js';

// Port of rails-app/app/lib/access_token.rb - keep TTL/algorithm in sync with
// that file if it ever changes.
const ALGORITHM = 'HS256';

/**
 * Mirrors AccessToken::Invalid - Rails collapses both "garbage token" and
 * "expired token" into this single error class, and callers (the auth
 * middleware) only ever need to distinguish "valid" from "not valid".
 */
export class AccessTokenInvalidError extends Error {
  constructor(message = 'invalid access token') {
    super(message);
    this.name = 'AccessTokenInvalidError';
  }
}

export interface AccessTokenPayload {
  sub: number;
  iat: number;
  exp: number;
  /**
   * Impersonator's user id, set only when this token was issued via the
   * impersonate route (members.ts's `POST /:uuid/impersonate`). Mirrors the
   * OAuth "actor" claim convention: `sub` is who the token acts as, `act` is
   * who is really driving it. Absent entirely on a normal login/refresh
   * token - see issueAccessToken's second parameter.
   */
  act?: number;
  /** Set only on a token issued by issueMfaPendingToken - see that function's doc comment. */
  mfa_pending?: true;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET is not set');
  }
  return value;
}

/**
 * Port of AccessToken.issue - HS256 JWT, sub = user id, ~15 minute TTL.
 * `impersonatorId`, when passed, sets the `act` claim (see
 * AccessTokenPayload's doc comment) - omitted entirely (not just `undefined`
 * in the object, actually absent from the signed payload) when not passed,
 * so a plain login token is byte-for-byte the same shape it always was.
 */
export function issueAccessToken(userId: number, impersonatorId?: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    iat: nowSeconds,
    exp: nowSeconds + TTL_SECONDS,
    ...(impersonatorId !== undefined ? { act: impersonatorId } : {}),
  };

  // Payload already carries iat/exp explicitly (matching the Rails payload
  // shape), so no expiresIn/notBefore options are passed here - jsonwebtoken
  // would otherwise conflict with the manually-set exp claim.
  return jwt.sign(payload, secret(), { algorithm: ALGORITHM });
}

const MFA_PENDING_TTL_SECONDS = 15 * 60;

/**
 * Issued after password verification succeeds but before an MFA challenge is
 * completed (see session.ts). Claim-scoped like the `act` impersonation
 * claim: authenticateApiUser (middleware.ts) rejects any token carrying
 * mfa_pending, so this token is useless anywhere except the
 * /api/v1/mfa/challenge/* routes (which verify it themselves, not via
 * authenticateApiUser - see mfaChallenge.ts).
 */
export function issueMfaPendingToken(userId: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    iat: nowSeconds,
    exp: nowSeconds + MFA_PENDING_TTL_SECONDS,
    mfa_pending: true,
  };
  return jwt.sign(payload, secret(), { algorithm: ALGORITHM });
}

/**
 * Port of AccessToken.decode - throws AccessTokenInvalidError on any decode
 * failure (malformed signature, bad algorithm, or expiry), same as Rails
 * rescuing JWT::DecodeError (of which ExpiredSignature is a subclass).
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown;
  try {
    // Pin the algorithm allowlist to prevent alg-confusion attacks (e.g. a
    // token forged with alg: none or a mismatched algorithm).
    decoded = jwt.verify(token, secret(), { algorithms: [ALGORITHM] });
  } catch {
    throw new AccessTokenInvalidError();
  }

  if (typeof decoded !== 'object' || decoded === null || typeof (decoded as { sub?: unknown }).sub !== 'number') {
    throw new AccessTokenInvalidError();
  }

  return decoded as AccessTokenPayload;
}
