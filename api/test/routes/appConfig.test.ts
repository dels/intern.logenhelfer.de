import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { appConfig } from '../../src/lib/appConfig.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { MULTIPART_FILE_SIZE_LIMIT_BYTES } from '../../src/middleware/contractValidation.js';
import appConfigRouter from '../../src/routes/appConfig.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/app_configs_spec.rb (7 examples),
// plus a small number of net-new security tests (see the bottom describe
// block). This resource has no search/filter/sort query param, so no
// SQL-injection-attempt test applies here (nothing touches the DB via a
// caller-controlled query param).

const app = express();
app.use(express.json());
app.use('/api/v1/app_config', appConfigRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(name: string, displayName = name): Promise<{ id: number; name: string | null }> {
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  return prisma.roles.create({
    data: { name, display_name: displayName, created_at: now, updated_at: now },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({
    data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now },
  });
}

describe('App Config API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  /** Port of the Rails spec's `application_admin` - ApplicationAdmin role, gates `manage AppConfig`. */
  async function makeApplicationAdmin(): Promise<users> {
    const role = await createRole('ApplicationAdmin', 'Kann Anwendung konfigurieren');
    const user = await createUser();
    await assignRole(user.id, role.id);
    return user;
  }

  /** Port of the Rails spec's `member` - EnteredApprentice, i.e. no admin tier at all. */
  async function makeMember(): Promise<users> {
    const role = await createRole('EnteredApprentice', 'Lehrling');
    const user = await createUser();
    await assignRole(user.id, role.id);
    return user;
  }

  /** Holds a real admin-ish role (UserAdmin -> can manage UserRole) but NOT AppConfig. */
  async function makeUserAdminOnly(): Promise<users> {
    const role = await createRole('UserAdmin', 'Mitgliederverwaltung');
    const user = await createUser();
    await assignRole(user.id, role.id);
    return user;
  }

  // Mirrors the route's own `envKeyPrefix()` (api/src/routes/appConfig.ts)
  // rather than hardcoding "test_" - matches the pattern already established
  // by public.test.ts's `setAppConfig` helper, and stays correct regardless
  // of what NODE_ENV vitest happens to run under.
  function envKeyPrefix(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  async function setConfigValue(key: string, value: string): Promise<void> {
    const fullKey = `${envKeyPrefix()}_${key}`;
    await prisma.app_config_adapters.upsert({
      where: { key: fullKey },
      update: { value },
      create: { key: fullKey, value },
    });
  }

  async function getConfigValue(key: string): Promise<string | null> {
    const row = await prisma.app_config_adapters.findFirst({ where: { key: `${envKeyPrefix()}_${key}` } });
    return row?.value ?? null;
  }

  describe('GET /api/v1/app_config', () => {
    it('returns known settings for an application admin', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).get('/api/v1/app_config').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('domain');
      expect([true, false]).toContain(res.body.public_wp_available_to_anon_users);
    });

    it('includes max_upload_file_size, defaulting to 20MB in bytes', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).get('/api/v1/app_config').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('max_upload_file_size');
      expect(res.body.max_upload_file_size).toBe(String(20 * 1024 * 1024));
    });

    it('defaults language to "de" for an application admin', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).get('/api/v1/app_config').set(authHeaders(admin));

      expect(res.body.language).toBe('de');
    });

    it('is forbidden for a member without the admin tier', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/app_config').set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/app_config');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/app_config', () => {
    it('updates only the submitted keys, leaving others unchanged', async () => {
      await setConfigValue('domain', 'before.example.org');
      await setConfigValue('organisation', 'Keep Me');
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ domain: 'after.example.org' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('after.example.org');
      expect(res.body.organisation).toBe('Keep Me');
    });

    it('writes and reads back a boolean key correctly', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ public_wp_available_to_anon_users: false })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.public_wp_available_to_anon_users).toBe(false);
    });

    it('writes and reads back the users_can_view_statistics key, defaulting to true before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.users_can_view_statistics).toBe(true);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ users_can_view_statistics: false })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.users_can_view_statistics).toBe(false);
    });

    it('writes and reads back the show_seeker_names_to_brothers key, defaulting to false before any write', async () => {
      // Regression: this route keeps its own independent KNOWN_KEYS (see the
      // file's top doc comment - it deliberately doesn't go through
      // lib/appConfig.ts's AppConfigService for reads/writes), so a key added
      // only to lib/appConfig.ts's KNOWN_KEYS/openapi.yaml/frontend fields.ts
      // still 422s here as "unknown key(s)" until this route's own duplicate
      // list is updated too.
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.show_seeker_names_to_brothers).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ show_seeker_names_to_brothers: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.show_seeker_names_to_brothers).toBe(true);
    });

    it('writes and reads back the notify_user_on_login_activity key, defaulting to false before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.notify_user_on_login_activity).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ notify_user_on_login_activity: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.notify_user_on_login_activity).toBe(true);
    });

    it('writes and reads back the public_wp_footer_show_secretary key, defaulting to false before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.public_wp_footer_show_secretary).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ public_wp_footer_show_secretary: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.public_wp_footer_show_secretary).toBe(true);
    });

    it('writes and reads back the public_wp_footer_show_worshipful_master key, defaulting to false before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.public_wp_footer_show_worshipful_master).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ public_wp_footer_show_worshipful_master: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.public_wp_footer_show_worshipful_master).toBe(true);
    });

    it('writes and reads back the internal_wp_footer_show_secretary key, defaulting to false before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.internal_wp_footer_show_secretary).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ internal_wp_footer_show_secretary: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.internal_wp_footer_show_secretary).toBe(true);
    });

    it('writes and reads back the internal_wp_footer_show_worshipful_master key, defaulting to false before any write', async () => {
      const admin = await makeApplicationAdmin();

      const beforeRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(beforeRes.body.internal_wp_footer_show_worshipful_master).toBe(false);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ internal_wp_footer_show_worshipful_master: true })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.internal_wp_footer_show_worshipful_master).toBe(true);
    });

    it('stores an unset string field as empty, not the literal string "null"', async () => {
      // Regression: castForWrite's `String(value)` fallback stringified JS
      // null/undefined into "null"/"undefined" (unlike Ruby's `nil.to_s ==
      // ""`) - a config form that round-trips every known key (fetch, edit
      // one field, submit all of them back) would permanently corrupt any
      // other still-unset string/text key the first time it was saved. This
      // is exactly what broke the public impressum page: 'impressum' (or a
      // token it substitutes, like 'lodge') round-tripped through a null
      // value and rendered as the literal text "null" instead of its real
      // content.
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ domain: 'after.example.org', default_event_location: null })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      // Ruby's `nil.to_s` is `""` (not the string "nil") - matching that,
      // not a stored DB null, is what this fix reproduces.
      expect(res.body.default_event_location).toBe('');
    });

    it('persists and reads back the help text field', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ help: '<p>So funktioniert die App</p>' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.help).toBe('<p>So funktioniert die App</p>');
    });

    it('rejects an unknown key', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).patch('/api/v1/app_config').send({ not_a_real_key: 'x' }).set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
    });

    it('writes and reads back a valid language', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ language: 'en' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.language).toBe('en');
    });

    it('rejects an unsupported language value', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ language: 'fr' })
        .set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
    });

    describe('birthday_calendar_consent_mode validation', () => {
      it('writes and reads back a valid value', async () => {
        const admin = await makeApplicationAdmin();

        const res = await request(app)
          .patch('/api/v1/app_config')
          .send({ birthday_calendar_consent_mode: 'blanket' })
          .set(authHeaders(admin));

        expect(res.status).toBe(200);
        expect(res.body.birthday_calendar_consent_mode).toBe('blanket');
      });

      it('rejects an unsupported value', async () => {
        const admin = await makeApplicationAdmin();

        const res = await request(app)
          .patch('/api/v1/app_config')
          .send({ birthday_calendar_consent_mode: 'nonsense' })
          .set(authHeaders(admin));

        expect(res.status).toBe(422);
        expect(res.body.error).toBe('unprocessable');
      });
    });

    it('is forbidden for a member without the admin tier', async () => {
      const member = await makeMember();

      const res = await request(app).patch('/api/v1/app_config').send({ domain: 'x' }).set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('allows updating max_db_mem_size when DEMO_MODE is unset', async () => {
      const admin = await makeApplicationAdmin();
      delete process.env.DEMO_MODE;

      const res = await request(app).patch('/api/v1/app_config').set(authHeaders(admin)).send({ max_db_mem_size: '52428800' });

      expect(res.status).toBe(200);
      expect(await getConfigValue('max_db_mem_size')).toBe('52428800');
    });

    it('rejects updating max_db_mem_size when DEMO_MODE=true, leaving the stored value unchanged', async () => {
      const admin = await makeApplicationAdmin();
      await setConfigValue('max_db_mem_size', '104857600');
      process.env.DEMO_MODE = 'true';

      try {
        const res = await request(app).patch('/api/v1/app_config').set(authHeaders(admin)).send({ max_db_mem_size: '1' });

        expect(res.status).toBe(422);
        expect(await getConfigValue('max_db_mem_size')).toBe('104857600');
      } finally {
        delete process.env.DEMO_MODE;
      }
    });

    it('accepts a max_upload_file_size value within the ceiling', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .set(authHeaders(admin))
        .send({ max_upload_file_size: String(5 * 1024 * 1024) });

      expect(res.status).toBe(200);
      expect(await getConfigValue('max_upload_file_size')).toBe(String(5 * 1024 * 1024));
    });

    it('rejects a max_upload_file_size value above the configured ceiling', async () => {
      const admin = await makeApplicationAdmin();
      await setConfigValue('max_upload_file_size', String(5 * 1024 * 1024));

      const res = await request(app)
        .patch('/api/v1/app_config')
        .set(authHeaders(admin))
        .send({ max_upload_file_size: String(MULTIPART_FILE_SIZE_LIMIT_BYTES + 1) });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
      // Message must be readable in MB (what the settings UI shows) and name
      // the .env.<env> var an admin needs to raise - not just raw byte counts.
      expect(res.body.detail).toContain('MAX_UPLOAD_FILE_SIZE_MB');
      expect(res.body.detail).toContain(`${(MULTIPART_FILE_SIZE_LIMIT_BYTES + 1) / (1024 * 1024)} MB`);
      expect(res.body.detail).toContain(`${MULTIPART_FILE_SIZE_LIMIT_BYTES / (1024 * 1024)} MB`);
      // Rejected write must not have clobbered the previously stored value.
      expect(await getConfigValue('max_upload_file_size')).toBe(String(5 * 1024 * 1024));
    });

    it('rejects a non-numeric max_upload_file_size value', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).patch('/api/v1/app_config').set(authHeaders(admin)).send({ max_upload_file_size: 'not-a-number' });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
    });

    it('does not apply a demo-mode lock to max_upload_file_size (unlike max_db_mem_size)', async () => {
      const admin = await makeApplicationAdmin();
      process.env.DEMO_MODE = 'true';

      try {
        const res = await request(app)
          .patch('/api/v1/app_config')
          .set(authHeaders(admin))
          .send({ max_upload_file_size: String(1024 * 1024) });

        expect(res.status).toBe(200);
        expect(await getConfigValue('max_upload_file_size')).toBe(String(1024 * 1024));
      } finally {
        delete process.env.DEMO_MODE;
      }
    });

    it('invalidates the shared AppConfigService singleton cache for a key it just wrote, so statistics.ts/me.ts/mail.ts (all consumers of that singleton) see the fresh value immediately rather than a stale cached one', async () => {
      // Regression for a real production bug: this route writes directly to
      // `app_config_adapters` via its own readRaw/writeRaw logic, bypassing
      // the shared `appConfig` (AppConfigService) singleton entirely - it
      // never called `appConfig.dirty(key)`/`appConfig.set(key, ...)`. Other
      // consumers (statistics.ts, me.ts's `users_can_view_statistics` gate,
      // mail.ts's `default_from_email`) read through that singleton, whose
      // `get()` serves a cached value for up to 5 minutes
      // (NODE_ENV!=='development'). An admin toggling a setting via this
      // PATCH endpoint would not be reflected for those other consumers
      // until the cache happened to expire on its own.
      const admin = await makeApplicationAdmin();

      // Prime the shared singleton's cache with the pre-write value - this
      // is what a concurrent request from a plain member (e.g. GET
      // /api/v1/me computing the statistics-visibility ability) would have
      // done moments earlier in the real running app.
      const before = await appConfig.get('users_can_view_statistics');
      expect(before).toBe(true);

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ users_can_view_statistics: false })
        .set(authHeaders(admin));
      expect(res.status).toBe(200);
      expect(res.body.users_can_view_statistics).toBe(false);

      // No `appConfig.dirty()` call here - if the route's PATCH handler
      // didn't invalidate the singleton's cache itself, this would still
      // return the stale cached `true` for up to 5 minutes.
      const after = await appConfig.get('users_can_view_statistics');
      expect(after).toBe(false);
    });
  });

  // Net-new tests for AppConfig::Adapter's getter-override behavior (not in
  // the Rails spec, but real behavior of rails-app/app/models/app_config/adapter.rb
  // that this port must reproduce - see api/src/routes/appConfig.ts's
  // KNOWN_KEYS/parseTimespanDays/parseMaxDbMemSize doc comments).
  describe('AppConfig::Adapter getter overrides', () => {
    it('parses the compiled-in "6m"/"12m" timespan defaults into integer day counts before any write', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app).get('/api/v1/app_config').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.public_workingplan_html_timespan).toBe(180);
      expect(res.body.public_workingplan_ics_timespan).toBe(360);
      // No compiled default exists for this one - stays null until written.
      expect(res.body.default_workingplan_timespan).toBeNull();
    });

    it('parses "Nw"/"Nd" shorthand and bare digit strings into integer day counts on write+read', async () => {
      const admin = await makeApplicationAdmin();

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ default_workingplan_timespan: '180' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.default_workingplan_timespan).toBe(180);
    });

    it('parses a "K"/"M"/"G"-suffixed max_db_mem_size into a byte count, but leaves a bare digit string unchanged', async () => {
      const admin = await makeApplicationAdmin();

      const defaultRes = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(defaultRes.body.max_db_mem_size).toBe(String(1024 * 1024 * 100));

      const res = await request(app)
        .patch('/api/v1/app_config')
        .send({ max_db_mem_size: '50M' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.max_db_mem_size).toBe(50 * 1024 * 1024);
    });

    it('default_event_duration_minutes defaults to 60 and can be written as an integer', async () => {
      const admin = await makeApplicationAdmin();

      const before = await request(app).get('/api/v1/app_config').set(authHeaders(admin));
      expect(before.body.default_event_duration_minutes).toBe(60);

      const after = await request(app)
        .patch('/api/v1/app_config')
        .send({ default_event_duration_minutes: '90' })
        .set(authHeaders(admin));
      expect(after.status).toBe(200);
      expect(after.body.default_event_duration_minutes).toBe(90);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a role that cannot manage AppConfig gets 403, even one that manages UserRole', async () => {
      // UserAdmin can manage UserRole (passes other resources' gates
      // entirely, see roles.ts) but does NOT hold `can('manage',
      // 'AppConfig')` - only application_admin_abilities (reachable via
      // Admin or the standalone ApplicationAdmin role) grants that.
      const userAdminOnly = await makeUserAdminOnly();
      await setConfigValue('domain', 'untouched.example.org');

      const getRes = await request(app).get('/api/v1/app_config').set(authHeaders(userAdminOnly));
      expect(getRes.status).toBe(403);
      expect(getRes.body).toEqual({ error: 'forbidden' });

      const patchRes = await request(app)
        .patch('/api/v1/app_config')
        .send({ domain: 'boundary-breach.example.org' })
        .set(authHeaders(userAdminOnly));
      expect(patchRes.status).toBe(403);
      expect(patchRes.body).toEqual({ error: 'forbidden' });

      expect(await getConfigValue('domain')).toBe('untouched.example.org');
    });

    it('is forbidden without authentication', async () => {
      const res = await request(app).patch('/api/v1/app_config').send({ domain: 'x' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });
});
