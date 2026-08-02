/**
 * Slug generation + uniqueness-dedup helper mirroring FriendlyId 5's default
 * slugging behavior, used (per-model, each `friendly_id :name[, use: :slugged]`)
 * by Category, Directory, Lodge, and District - see rails-app/app/models/{category,
 * directory,lodge,district}.rb.
 *
 * FriendlyId's default `Slug` normalizer (`FriendlyId::Slugged#normalize_friendly_id`,
 * which delegates to Babosa's `to_slug` transliterate/normalize chain) does:
 * transliterate diacritics to their ASCII base letter, downcase, replace any
 * run of non `[a-z0-9]` characters with a single `-`, then trim leading/
 * trailing `-`. `should_generate_new_friendly_id?`'s default only fires when
 * the slug column is still blank, i.e. this only runs once, at create - it
 * does not re-slug on every update.
 *
 * On collision, FriendlyId's `Candidates` finder (`FriendlyId::Candidates`,
 * historically via `finders.rb`'s sequential lookup) appends its default
 * `sequence_separator` ("-") plus an incrementing counter starting at 2:
 * `foo`, `foo-2`, `foo-3`, ... - it does not reuse gaps from deleted rows,
 * it just walks upward from 2 until an unused slug is found.
 */

const FALLBACK_SLUG = 'n-a';

/**
 * Port of FriendlyId/Babosa's default normalization: NFKD-decompose to pull
 * diacritics apart from their base letter, strip the diacritic marks,
 * downcase, collapse any run of non `[a-z0-9]` characters to a single `-`,
 * and trim leading/trailing `-`.
 */
export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || FALLBACK_SLUG;
}

/**
 * Generates a slug for `input` and resolves it to a value for which
 * `checkExists` returns false, appending FriendlyId's default `-2`, `-3`, ...
 * suffix on collision. `checkExists` should check uniqueness scoped exactly
 * the way the underlying FriendlyId model does (i.e. usually unscoped by
 * `deleted`, since FriendlyId's slug uniqueness index has no notion of soft
 * deletion) - the caller decides the scope, this helper only drives the
 * candidate sequence.
 */
export async function generateUniqueSlug(input: string, checkExists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(input);

  let candidate = base;
  let suffix = 1;
  // Sequential by nature: each candidate depends on the previous check's
  // result, so this cannot be parallelized.
  // eslint-disable-next-line no-await-in-loop
  while (await checkExists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
