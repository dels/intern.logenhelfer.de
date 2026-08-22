/**
 * `users.mobile` is a derived, address-backed column: it always reflects the
 * "best" mobile number found among a user's own (non-Seeker) addresses,
 * computed by `computeUserMobile` below. This module owns that priority
 * logic so both the one-time migration backfill (SQL, see
 * `api/prisma/migrations/*_add_users_mobile/migration.sql`) and the ongoing
 * write-time sync (`syncUserMobile`, wired into `applyAddresses` in
 * `api/src/routes/members.ts`) agree on exactly the same rule.
 */

import { Prisma } from '../generated/prisma/client.js';

/** Same `Prisma.TransactionClient` alias `members.ts` keeps under its own
 *  local name `PrismaTx` - duplicated rather than imported for the same
 *  file-boundary reason as `isPresent` above (`lib/` never imports from
 *  `routes/`). */
type PrismaTx = Prisma.TransactionClient;

/** Port of Ruby's `#present?` (see the identical helper in
 *  `api/src/routes/members.ts`, which predates this module and is not
 *  imported from here on purpose - `lib/` modules never import from
 *  `routes/`, and `members.ts` is expected to import `syncUserMobile` from
 *  this module, which would make the reverse import circular). Keep both
 *  definitions in sync if this predicate's semantics ever change. */
export function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

/** Only the fields `computeUserMobile` needs from an `addresses` row -
 *  matches the `addresses` Prisma model's column types for `type_of_address`,
 *  `mobile`, `deleted`, and `id`. */
export interface MobileCandidateAddress {
  type_of_address: number | null;
  mobile: string | null;
  deleted: boolean | null;
  id: number;
}

const ADDRESS_TYPE_PRIVATE = 0;
const ADDRESS_TYPE_BUSINESS = 1;

function byIdAscending(a: MobileCandidateAddress, b: MobileCandidateAddress): number {
  return a.id - b.id;
}

/**
 * Priority: first non-blank mobile among `type_of_address === 0` (private)
 * addresses (lowest id first), else `type_of_address === 1` (business),
 * else any other non-deleted address with a non-blank mobile, else `null`.
 *
 * - Deleted addresses (`deleted === true`) are never considered; `deleted`
 *   is a nullable column, so `null`/`undefined` are treated as NOT deleted
 *   (mirrors the migration backfill's `COALESCE(deleted, false) = false`).
 * - A blank-string mobile (`''`, whitespace-only) is treated as absent, via
 *   `isPresent`.
 * - Caller is responsible for only passing `User`-typed addresses (Seeker
 *   addresses are out of scope for this feature).
 */
export function computeUserMobile(addresses: MobileCandidateAddress[]): string | null {
  const candidates = addresses.filter((address) => address.deleted !== true && isPresent(address.mobile));

  const private_ = candidates.filter((address) => address.type_of_address === ADDRESS_TYPE_PRIVATE).sort(byIdAscending);
  if (private_.length > 0) return private_[0]!.mobile;

  const business = candidates.filter((address) => address.type_of_address === ADDRESS_TYPE_BUSINESS).sort(byIdAscending);
  if (business.length > 0) return business[0]!.mobile;

  const other = candidates.slice().sort(byIdAscending);
  if (other.length > 0) return other[0]!.mobile;

  return null;
}

/**
 * Re-derives `users.mobile` for `userId` from that user's current `User`-
 * typed addresses and writes the result, inside the caller's transaction.
 * Wired into `applyAddresses` (`api/src/routes/members.ts`) - called once,
 * right after that function's address create/update/(hard-)delete loop -
 * so every address write for a user keeps `users.mobile` in sync
 * automatically, exactly mirroring the migration backfill's priority.
 *
 * Exported (not called from anywhere else in this plan) in case a future
 * task needs the same recompute-and-write outside `applyAddresses`.
 *
 * ponytail: users.mobile is address-derived and gets overwritten on every
 * address save - a direct edit to the base mobile field survives until the
 * next address write touches this user, then loses. Accepted trade-off, not
 * a bug.
 */
export async function syncUserMobile(tx: PrismaTx, userId: number): Promise<void> {
  const addresses = await tx.addresses.findMany({
    where: { addressable_id: userId, addressable_type: 'User' },
    select: { id: true, type_of_address: true, mobile: true, deleted: true },
  });
  await tx.users.update({ where: { id: userId }, data: { mobile: computeUserMobile(addresses) } });
}
