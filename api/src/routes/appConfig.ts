import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { appConfig, DEFAULT_IMPRESSUM_HTML, DEFAULT_DATENSCHUTZ_HTML } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { MULTIPART_FILE_SIZE_LIMIT_BYTES } from '../middleware/contractValidation.js';

/**
 * Port of rails-app/app/controllers/api/v1/app_configs_controller.rb.
 *
 * Since app_config *is* this resource, this file has its own independent
 * read/write/cache-coercion logic, ported directly from
 * rails-app/app/models/app_config.rb + the controller's
 * KNOWN_KEYS/cast_for_write/current_values, against the same
 * `app_config_adapters` table Rails uses (see prisma/schema.prisma) - it
 * does not go through the shared `../lib/appConfig.js` `AppConfigService`
 * singleton for its own reads/writes. That singleton is still imported here
 * for one purpose: after this handler writes a key directly to the DB, it
 * must also call the singleton's `dirty(key)` to invalidate that key's
 * in-process cache entry - otherwise statistics.ts/me.ts/mail.ts (which
 * *do* read through the singleton) would keep serving a stale cached value
 * for up to 5 minutes after an admin saves a change here.
 *
 * Both actions are gated on `ability.can?(:manage, AppConfig)`, which only
 * `application_admin_abilities` grants (ability.rb L140-151) - reachable
 * solely via the Admin role's `admin_abilities` chain, or directly via the
 * ApplicationAdmin role.
 */

type ConfigType = 'boolean' | 'string' | 'integer' | 'text';

/**
 * Port of AppConfigsController::KNOWN_KEYS. `AppConfig[key]` (called by
 * `readRaw` below) is not a plain column read - `AppConfig::Adapter#value`
 * (rails-app/app/models/app_config/adapter.rb) magically dispatches to a
 * `getter_<key>` method when one is defined by key name, before the
 * controller's own boolean cast ever runs. Three of these keys
 * (`default_workingplan_timespan`/`public_workingplan_html_timespan`/
 * `public_workingplan_ics_timespan`) share `getter_default_workingplan_timespan`,
 * which parses "6m"/"12w"/"180"-style raw values into a plain integer day
 * count - see `parseTimespanDays` below, which ports that getter. `archive`/
 * `show_admins` similarly have a `getter_bool` override, but its output
 * (`@value == '1'`) is redundant with this controller's own
 * `ActiveModel::Type::Boolean` cast (idempotent on an already-boolean input),
 * so `castBoolean` alone reproduces the observable result without a separate
 * port of `getter_bool`.
 */
const KNOWN_KEYS: Record<string, ConfigType> = {
  public_wp_available_to_anon_users: 'boolean',
  working_plan_as_start_page: 'boolean',
  archive: 'boolean',
  show_admins: 'boolean',
  users_can_view_statistics: 'boolean',
  show_seeker_names_to_brothers: 'boolean',
  notify_technical_contact_on_unknown_password_reset: 'boolean',
  notify_user_on_login_activity: 'boolean',
  domain: 'string',
  organisation: 'string',
  lodge: 'string',
  lodge_short: 'string',
  language: 'string',
  default_workingplan_timespan: 'integer',
  default_event_location: 'string',
  default_event_duration_minutes: 'integer',
  user_change_notification_email: 'string',
  default_from_email: 'string',
  technical_contact_email: 'string',
  mvst_email: 'string',
  zip: 'string',
  location: 'string',
  street: 'string',
  content_responsible_name: 'string',
  technical_responsible_name: 'string',
  max_db_mem_size: 'string',
  max_upload_file_size: 'string',
  workingplan_footer: 'text',
  impressum: 'text',
  datenschutz: 'text',
  help: 'text',
  robots_txt: 'text',
  public_workingplan_html_timespan: 'integer',
  public_workingplan_ics_timespan: 'integer',
  public_wp_footer_show_secretary: 'boolean',
  public_wp_footer_show_worshipful_master: 'boolean',
  internal_wp_footer_show_secretary: 'boolean',
  internal_wp_footer_show_worshipful_master: 'boolean',
  mfa_mode: 'string',
  mfa_enforce_for_officers: 'boolean',
  mfa_grace_period_days: 'integer',
  mfa_trusted_device_days: 'integer',
  birthday_calendar_available: 'boolean',
  birthday_calendar_consent_mode: 'string',
};

/**
 * Port of AppConfig's fallback `case key ... end` block (app_config.rb) -
 * the value returned for a key when no `app_config_adapters` row exists yet
 * for the current environment. Keys not listed here (e.g. `organisation`,
 * `default_workingplan_timespan`) have no compiled-in default and read back
 * as `null` until first written, exactly like the Ruby source (its `case`
 * falls through to a `Rails.logger.warn` with no assigned record).
 */
const DEFAULT_RAW_VALUES: Partial<Record<string, string | boolean>> = {
  public_wp_available_to_anon_users: true,
  public_workingplan_html_timespan: '6m',
  public_workingplan_ics_timespan: '12m',
  working_plan_as_start_page: false,
  lodge: 'Logenhelfer',
  lodge_short: 'lgnhlfr',
  language: 'de',
  show_admins: true,
  users_can_view_statistics: true,
  // Security-sensitive default: closed by default (see this repo's CLAUDE.md
  // "Sensitive config defaults must default to the more private option") -
  // gates visibility into a live vetting pipeline for members who otherwise
  // have zero Seeker access, so it must be opted into, not opted out of.
  show_seeker_names_to_brothers: false,
  notify_technical_contact_on_unknown_password_reset: true,
  notify_user_on_login_activity: false,
  max_db_mem_size: String(1024 * 1024 * 100),
  // Net-new key, no Rails precedent - deliberately hardcoded independent of
  // the MAX_UPLOAD_FILE_SIZE_MB ceiling env var (contractValidation.ts) so
  // raising the ceiling never silently raises this enforced default too.
  max_upload_file_size: String(20 * 1024 * 1024),
  archive: '0',
  default_from_email: 'website@logenhelfer.de',
  technical_contact_email: 'technik@logenhelfer.de',
  robots_txt: 'User-Agent: *\nDisallow: /',
  impressum: DEFAULT_IMPRESSUM_HTML,
  datenschutz: DEFAULT_DATENSCHUTZ_HTML,
  domain: 'logenhelfer.de',
  default_event_duration_minutes: '60',
  mfa_mode: 'optional',
  mfa_enforce_for_officers: false,
  mfa_grace_period_days: '14',
  mfa_trusted_device_days: '30',
  birthday_calendar_available: false,
  birthday_calendar_consent_mode: 'individual',
  public_wp_footer_show_secretary: false,
  public_wp_footer_show_worshipful_master: false,
  internal_wp_footer_show_secretary: false,
  internal_wp_footer_show_worshipful_master: false,
};

// Port of ActiveModel::Type::Boolean::FALSE_VALUES.
const FALSE_VALUES = new Set<unknown>([false, 0, '0', 'f', 'F', 'false', 'FALSE', 'off', 'OFF']);

/**
 * Port of ActiveModel::Type::Boolean#cast (via Type::Value#cast's nil
 * short-circuit): nil/undefined stay nil, "" casts to nil, everything else
 * is `true` unless it's one of Rails' recognized "false-ish" tokens.
 */
function castBoolean(raw: unknown): boolean | null {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  return !FALSE_VALUES.has(raw);
}

/**
 * Port of Ruby's String#to_i / Numeric#to_i as used by
 * AppConfigsController#cast_for_write's `:integer` branch - parses a
 * leading run of digits (with an optional sign) and truncates the rest,
 * falling back to 0 for anything with no leading numeric run (matching
 * "abc".to_i == 0).
 */
function rubyToI(value: unknown): number {
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  const match = /^\s*[-+]?\d+/.exec(String(value));
  return match ? Number.parseInt(match[0], 10) : 0;
}

/** Keys whose `AppConfig::Adapter` getter is (aliased to) `getter_default_workingplan_timespan`. */
const TIMESPAN_KEYS = new Set(['default_workingplan_timespan', 'public_workingplan_html_timespan', 'public_workingplan_ics_timespan']);

/** The only two resource bundles that exist under app/src/i18n/ — any other value would silently fall back to i18next's fallbackLng ('de') on the frontend, so reject it here instead of storing a value nothing can ever honor. */
const LANGUAGE_VALUES = new Set(['de', 'en']);

const MFA_MODE_VALUES = new Set(['optional', 'mandatory']);

const BIRTHDAY_CALENDAR_CONSENT_MODE_VALUES = new Set(['individual', 'blanket']);

/**
 * Port of `AppConfig::Adapter#getter_default_workingplan_timespan` - parses
 * a raw stored/default value like "6m" (months), "12w" (weeks), or a bare
 * "180"/"180d" (days) into a plain integer day count, falling back to 120
 * (Ruby's `4 * 30`) when nothing matches. Ruby's `case/when` regex tests are
 * unanchored-at-start and evaluated in this exact order, stopping at the
 * first match - ported 1:1 below.
 */
function parseTimespanDays(raw: string): number {
  let match = /(\d+)m$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 30;
  }
  match = /(\d+)w$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 7;
  }
  match = /(\d+)d?$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10);
  }
  return 4 * 30;
}

/**
 * Port of `AppConfig::Adapter#getter_max_db_mem_size` - parses a raw value
 * with a "K"/"M"/"G" (case-insensitive, unanchored) suffix into a byte
 * count; anything else (e.g. the compiled default "104857600", a plain
 * digit string with no unit) passes through unchanged.
 */
function parseMaxDbMemSize(raw: string): string | number {
  let match = /(\d+)K/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024;
  }
  match = /(\d+)M/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024;
  }
  match = /(\d+)G/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024 * 1024;
  }
  return raw;
}

/**
 * Port of AppConfigsController#cast_for_write. Returns the value that gets
 * stringified (Ruby's `value.to_s`, done here directly since our storage
 * column is a plain string) and stored in `app_config_adapters`.
 */
function castForWrite(type: ConfigType, value: unknown): string {
  if (type === 'boolean') {
    return String(castBoolean(value));
  }
  if (type === 'integer') {
    return String(rubyToI(value));
  }
  // Ruby's `nil.to_s` is `""`, not the string "nil" - JS's `String(null)`/
  // `String(undefined)` return "null"/"undefined" instead, which would
  // otherwise permanently stringify an unset field (e.g. a config form
  // round-tripping every known key, including ones with no value yet) into
  // a literal 4-character "null" stored in app_config_adapters.
  return value === null || value === undefined ? '' : String(value);
}

function envKeyPrefix(): string {
  return process.env.NODE_ENV ?? 'development';
}

/**
 * Port of `AppConfig[key]` (app_config.rb) as seen through
 * `AppConfig::Adapter#value`'s getter-override dispatch: resolves a stored
 * row, else the compiled-in default, else null (mirroring "no record at all
 * -> `nil`, getter never invoked" for keys with no compiled default, e.g.
 * `default_workingplan_timespan`) - then, if a value was found, applies
 * whichever `getter_*` override that key's Adapter instance would dispatch
 * to (see the KNOWN_KEYS doc comment above for which keys need one ported
 * here vs. which are already reproduced by the boolean cast alone).
 */
async function readRaw(key: string): Promise<string | boolean | number | null> {
  const row = await prisma.app_config_adapters.findFirst({ where: { key: `${envKeyPrefix()}_${key}` } });
  const raw = row?.value !== undefined && row?.value !== null ? row.value : (DEFAULT_RAW_VALUES[key] ?? null);
  if (raw === null) {
    return null;
  }
  if (TIMESPAN_KEYS.has(key)) {
    return parseTimespanDays(String(raw));
  }
  // max_upload_file_size reuses max_db_mem_size's parser - same K/M/G-
  // suffix-or-passthrough behavior, no separate Rails-port justification
  // needed since this key is net-new.
  if (key === 'max_db_mem_size' || key === 'max_upload_file_size') {
    return parseMaxDbMemSize(String(raw));
  }
  if (KNOWN_KEYS[key] === 'integer') {
    return rubyToI(raw);
  }
  return raw;
}

async function writeRaw(key: string, value: string): Promise<void> {
  const fullKey = `${envKeyPrefix()}_${key}`;
  const existing = await prisma.app_config_adapters.findFirst({ where: { key: fullKey } });
  if (existing) {
    await prisma.app_config_adapters.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.app_config_adapters.create({ data: { key: fullKey, value } });
  }
}

/**
 * Port of AppConfigsController#current_values. The controller itself only
 * casts `:boolean`-typed keys explicitly (`ActiveModel::Type::Boolean.cast`)
 * - the `:integer`-typed timespan keys read back as real integers anyway
 * because `readRaw`'s `AppConfig::Adapter#value` port already parsed them
 * (see TIMESPAN_KEYS above), matching openapi/openapi.yaml's
 * `AppConfigValues` schema (`type: integer` for all three).
 */
async function currentValues(): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    Object.entries(KNOWN_KEYS).map(async ([key, type]) => {
      const raw = await readRaw(key);
      const value = type === 'boolean' ? castBoolean(raw) : raw;
      return [key, value] as const;
    }),
  );
  return Object.fromEntries(entries);
}

const router = Router();

router.use(authenticateApiUser);

// GET /api/v1/app_config
router.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AppConfig')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    res.status(200).json(await currentValues());
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/app_config
router.patch('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AppConfig')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Port of `params.except(:controller, :action).to_unsafe_h` under
    // `wrap_parameters false` - the whole flat JSON body is the param set
    // (Express has no controller/action pseudo-params to strip).
    const body = (req.body ?? {}) as Record<string, unknown>;
    const submittedKeys = Object.keys(body);
    // Object.hasOwn (not `key in KNOWN_KEYS`) so a body containing an
    // inherited-property-shaped key (e.g. "constructor", "toString") is
    // correctly flagged unknown instead of resolving via the prototype
    // chain - matching Ruby's `Hash#keys - Hash#keys` (plain array
    // difference, no prototype semantics to worry about).
    const unknown = submittedKeys.filter((key) => !Object.hasOwn(KNOWN_KEYS, key));
    if (unknown.length > 0) {
      throw ApiError.unprocessable(`unknown key(s): ${unknown.join(', ')}`);
    }

    if (process.env.DEMO_MODE === 'true' && Object.hasOwn(body, 'max_db_mem_size')) {
      throw ApiError.unprocessable('max_db_mem_size is not editable in this environment');
    }

    // Deliberately NOT locked in DEMO_MODE, unlike max_db_mem_size above -
    // an admin-editable upload-size cap isn't as sensitive as the DB memory
    // ceiling in the demo environment, so no demo-mode guard is added here.
    if (Object.hasOwn(body, 'max_upload_file_size')) {
      const submitted = Number(body.max_upload_file_size);
      if (!Number.isFinite(submitted) || submitted <= 0) {
        throw ApiError.unprocessable(`invalid max_upload_file_size: ${String(body.max_upload_file_size)}`);
      }
      if (submitted > MULTIPART_FILE_SIZE_LIMIT_BYTES) {
        const submittedMb = submitted / (1024 * 1024);
        const ceilingMb = MULTIPART_FILE_SIZE_LIMIT_BYTES / (1024 * 1024);
        throw ApiError.unprocessable(
          `max_upload_file_size (${submittedMb} MB) exceeds the ${ceilingMb} MB ceiling configured for this `
          + `environment. Raise MAX_UPLOAD_FILE_SIZE_MB in this environment's .env.<env> file and redeploy before `
          + `saving a larger value here.`,
        );
      }
    }

    if (Object.hasOwn(body, 'language') && !LANGUAGE_VALUES.has(body.language as string)) {
      throw ApiError.unprocessable(`invalid language: ${String(body.language)}`);
    }

    if (Object.hasOwn(body, 'mfa_mode') && !MFA_MODE_VALUES.has(body.mfa_mode as string)) {
      throw ApiError.unprocessable(`invalid mfa_mode: ${String(body.mfa_mode)}`);
    }

    if (Object.hasOwn(body, 'birthday_calendar_consent_mode') && !BIRTHDAY_CALENDAR_CONSENT_MODE_VALUES.has(body.birthday_calendar_consent_mode as string)) {
      throw ApiError.unprocessable(`invalid birthday_calendar_consent_mode: ${String(body.birthday_calendar_consent_mode)}`);
    }

    if (Object.hasOwn(body, 'mfa_mode')) {
      const currentMode = await readRaw('mfa_mode');
      const nextMode = body.mfa_mode as string;
      if (nextMode === 'mandatory' && currentMode !== 'mandatory') {
        await appConfig.set('mfa_grace_period_started_at', new Date().toISOString());
      } else if (nextMode === 'optional' && currentMode === 'mandatory') {
        await appConfig.set('mfa_grace_period_started_at', '');
      }
    }

    for (const key of submittedKeys) {
      // Safe: every `key` here already passed the `Object.hasOwn` filter
      // above, so it is guaranteed to be a real KNOWN_KEYS entry.
      const type = KNOWN_KEYS[key] as ConfigType;
      await writeRaw(key, castForWrite(type, body[key]));
      // Invalidate the shared AppConfigService singleton's cache entry for
      // this key (only this key - other keys not part of this request must
      // keep serving their own cached value undisturbed) so any consumer
      // reading through that singleton (statistics.ts, me.ts, mail.ts, ...)
      // sees this write immediately instead of a stale cached value.
      appConfig.dirty(key);
    }

    res.status(200).json(await currentValues());
  } catch (err) {
    next(err);
  }
});

export default router;
