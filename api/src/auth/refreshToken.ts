import { createHash, randomBytes, randomUUID } from 'node:crypto';

import type { refresh_tokens, users } from '../generated/prisma/client.js';

import { prisma } from '../db.js';
import { JWT_REFRESH_TTL_SECONDS } from './tokenConfig.js';

// Port of rails-app/app/models/refresh_token.rb - keep TTL in sync with that
// file if it ever changes. TTL is configurable via JWT_REFRESH_TTL (see
// tokenConfig.ts); this file and cookies.ts both derive from that single
// source so the two never drift apart.
const TTL_MS = JWT_REFRESH_TTL_SECONDS * 1000;

/** Port of RefreshToken::Invalid - unknown, revoked, or expired token. */
export class RefreshTokenInvalidError extends Error {
  constructor(message = 'invalid refresh token') {
    super(message);
    this.name = 'RefreshTokenInvalidError';
  }
}

/** Port of RefreshToken::Reuse - an already-consumed token was replayed. */
export class RefreshTokenReuseError extends Error {
  constructor(message = 'refresh token reuse detected') {
    super(message);
    this.name = 'RefreshTokenReuseError';
  }
}

export interface IssuedRefreshToken {
  rawToken: string;
  record: refresh_tokens;
}

export interface RotatedRefreshToken {
  rawToken: string;
  user: users;
}

function digest(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Port of RefreshToken.issue_for - mints a new raw token (never persisted in
 * plaintext) and its hashed DB record. Starts a new family unless one is
 * passed in (rotation reuses the family so reuse-detection can revoke the
 * whole lineage at once).
 */
export async function issueRefreshToken(userId: number, familyId: string = randomUUID()): Promise<IssuedRefreshToken> {
  const rawToken = randomBytes(32).toString('hex');
  const now = new Date();

  const record = await prisma.refresh_tokens.create({
    data: {
      // refresh_tokens.user_id is BigInt in the DB (see schema.prisma comment
      // on why no Prisma relation is modeled: users.id is int4, this is int8).
      user_id: BigInt(userId),
      token_digest: digest(rawToken),
      family_id: familyId,
      expires_at: new Date(now.getTime() + TTL_MS),
      created_at: now,
      updated_at: now,
    },
  });

  return { rawToken, record };
}

/**
 * Port of RefreshToken.rotate! - validates the presented raw token, detects
 * replay of an already-consumed token (revoking the entire family and
 * throwing Reuse), and otherwise consumes it and issues the next token in
 * the same family.
 *
 * Check order matters and mirrors Rails exactly: reuse is detected (and the
 * family revoked) *before* the revoked/expired check runs.
 *
 * The consume step is a single conditional `updateMany` rather than a
 * separate read-then-write, so it's race-safe: Postgres re-checks
 * `consumed_at: null` against the committed row at write time, not just
 * against what this call happened to read earlier, so two requests racing
 * the same raw token can never both win. Without this, a plain
 * findUnique-then-update let both racers observe `consumed_at === null` and
 * both successfully rotate - defeating reuse-detection for exactly the case
 * it exists to catch: a stolen token raced against the legitimate client's
 * own refresh.
 *
 * Residual ordering window (accepted): the race's winner still runs
 * `issueRefreshToken` for the *next* token after the loser's
 * `revokeFamily` call below may already have committed - if the winner's
 * insert lands after that revoke, the freshly-issued next token is not
 * itself revoked (though the original, raced-over token always is). This
 * is a narrower gap than the bug being fixed (both racers silently
 * succeeding, with neither one revoked) and isn't closed here; closing it
 * fully would need the winner's issuance and the loser's revoke to be
 * ordered against each other (e.g. via a single transaction spanning both
 * call sites), which no test currently exercises.
 */
export async function rotateRefreshToken(rawToken: string): Promise<RotatedRefreshToken> {
  const record = await prisma.refresh_tokens.findUnique({ where: { token_digest: digest(rawToken) } });
  if (!record) {
    throw new RefreshTokenInvalidError();
  }

  const now = new Date();
  const { count } = await prisma.refresh_tokens.updateMany({
    where: { id: record.id, consumed_at: null, revoked_at: null, expires_at: { gt: now } },
    data: { consumed_at: now, updated_at: now },
  });

  if (count === 0) {
    // Lost the race, or was already consumed/revoked/expired before this
    // call even started - re-fetch rather than trusting the now-stale
    // `record` snapshot from above, since a race loser's own snapshot still
    // shows consumed_at === null (it read the row before either write
    // landed) and would otherwise be misclassified as "invalid" instead of
    // "reuse".
    const current = await prisma.refresh_tokens.findUnique({ where: { id: record.id } });
    if (current?.consumed_at !== null && current?.consumed_at !== undefined) {
      await revokeFamily(record.family_id);
      throw new RefreshTokenReuseError();
    }
    throw new RefreshTokenInvalidError();
  }

  const userId = Number(record.user_id);
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new RefreshTokenInvalidError();
  }

  const { rawToken: nextRawToken } = await issueRefreshToken(userId, record.family_id);

  return { rawToken: nextRawToken, user };
}

/** Port of RefreshToken.revoke_family! (family-id form, used by logout). */
export async function revokeFamily(familyId: string): Promise<void> {
  await prisma.refresh_tokens.updateMany({
    where: { family_id: familyId },
    data: { revoked_at: new Date() },
  });
}

/**
 * Revokes every non-revoked refresh token belonging to a user, across every
 * family - not just one family by id (revokeFamily's scope). Security fix:
 * neither a password change nor a member soft-delete used to revoke
 * outstanding refresh tokens at all, so a stolen cookie survived a password
 * change meant to lock the attacker out, and an offboarded/expelled member's
 * cookie kept working for up to 30 more days. Call this from both of those
 * write paths (me.ts's password-change handler, members.ts's soft-delete
 * handler) after the write succeeds.
 *
 * `refresh_tokens.user_id` is BigInt in the DB (see issueRefreshToken's
 * comment on why no Prisma relation is modeled onto `users.id`, which is
 * int4) - `userId` must be wrapped in BigInt(...) here or the where clause
 * silently matches zero rows instead of throwing.
 */
export async function revokeAllFamiliesForUser(userId: number): Promise<void> {
  await prisma.refresh_tokens.updateMany({
    where: { user_id: BigInt(userId), revoked_at: null },
    data: { revoked_at: new Date() },
  });
}
