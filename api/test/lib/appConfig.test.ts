import { beforeEach, describe, expect, it } from 'vitest';

import { AppConfigService, KNOWN_KEYS, appConfig, getConfigString, getBoolean, getTimespanDays } from '../../src/lib/appConfig.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';

// Port of rails-app/app/models/app_config.rb (the `AppConfig` module) +
// rails-app/app/models/app_config/adapter.rb's getter/setter dispatch +
// the boolean-cast layer api_v1/app_configs_controller.rb applies on top -
// see api/src/lib/appConfig.ts's header comment. Each test constructs its
// own `AppConfigService` instance (rather than importing the shared
// `appConfig` singleton) so a warm in-process cache from one test can never
// leak into the next - the default TTL (5 minutes outside NODE_ENV=development)
// would otherwise easily outlive an entire test file's run.
function envKeyPrefix(): string {
  return process.env.NODE_ENV ?? 'development';
}

describe('AppConfigService', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('defaults (no app_config_adapters row yet)', () => {
    it('returns the compiled-in default for a key that has one', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('domain')).toBe('logenhelfer.de');
      expect(await svc.get('lodge')).toBe('Logenhelfer');
      expect(await svc.get('lodge_short')).toBe('lgnhlfr');
      expect(await svc.get('technical_contact_email')).toBe('technik@logenhelfer.de');
      expect(await svc.get('default_from_email')).toBe('website@logenhelfer.de');
      expect(await svc.get('robots_txt')).toBe('User-Agent: *\nDisallow: /');
    });

    it('defaults language to "de"', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('language')).toBe('de');
    });

    it('returns null for a known key with no compiled-in default', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('organisation')).toBeNull();
      expect(await svc.get('default_workingplan_timespan')).toBeNull();
    });

    it('returns null for an entirely unknown key', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('not_a_real_key')).toBeNull();
    });

    it('casts boolean defaults to real booleans (not the raw stored/default representation)', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('public_wp_available_to_anon_users')).toBe(true);
      expect(await svc.get('working_plan_as_start_page')).toBe(false);
      expect(await svc.get('show_admins')).toBe(true);
      // Compiled default is the string "0" - must cast to false, not stay "0"/truthy.
      expect(await svc.get('archive')).toBe(false);
    });

    it('defaults users_can_view_statistics to true (existing installs keep current behavior until an admin opts to restrict it)', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('users_can_view_statistics')).toBe(true);
    });

    it('parses the compiled-in "6m"/"12m" timespan defaults into integer day counts', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('public_workingplan_html_timespan')).toBe(180);
      expect(await svc.get('public_workingplan_ics_timespan')).toBe(360);
    });

    it('leaves the compiled-in max_db_mem_size default (no unit suffix) as a numeric-looking string', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('max_db_mem_size')).toBe(String(1024 * 1024 * 100));
    });

    it('leaves the compiled-in max_upload_file_size default (no unit suffix) as a numeric-looking string', async () => {
      const svc = new AppConfigService();
      expect(await svc.get('max_upload_file_size')).toBe(String(20 * 1024 * 1024));
    });

    it('never throws for any KNOWN_KEYS entry, even with no row written yet', async () => {
      const svc = new AppConfigService();
      for (const key of Object.keys(KNOWN_KEYS)) {
        // eslint-disable-next-line no-await-in-loop -- simple sequential sanity sweep, not perf-sensitive.
        await expect(svc.get(key)).resolves.not.toThrow();
      }
    });
  });

  describe('set/get round trips', () => {
    it('writes and reads back a string key', async () => {
      const svc = new AppConfigService();
      await svc.set('domain', 'after.example.org');
      expect(await svc.get('domain')).toBe('after.example.org');
    });

    it('writes and reads back a non-default language', async () => {
      const svc = new AppConfigService();
      await svc.set('language', 'en');
      expect(await svc.get('language')).toBe('en');
    });

    it('writes and reads back the users_can_view_statistics key', async () => {
      const svc = new AppConfigService();
      await svc.set('users_can_view_statistics', false);
      expect(await svc.get('users_can_view_statistics')).toBe(false);
    });

    it("writes and reads back a boolean key using Rails' false-token set", async () => {
      const svc = new AppConfigService();

      await svc.set('public_wp_available_to_anon_users', false);
      expect(await svc.get('public_wp_available_to_anon_users')).toBe(false);

      await svc.set('public_wp_available_to_anon_users', '0');
      expect(await svc.get('public_wp_available_to_anon_users')).toBe(false);

      await svc.set('public_wp_available_to_anon_users', true);
      expect(await svc.get('public_wp_available_to_anon_users')).toBe(true);
    });

    it('writes and reads back an integer key via Ruby-style #to_i coercion', async () => {
      const svc = new AppConfigService();
      await svc.set('default_workingplan_timespan', '180');
      expect(await svc.get('default_workingplan_timespan')).toBe(180);
    });

    it(
      "truncates a non-digit suffix via Ruby-style #to_i at write time for the integer-typed timespan keys - " +
        "AppConfigsController#cast_for_write's `:integer` branch is `value.to_i`, so \"12w\".to_i == 12 is what actually " +
        'gets stored, not the shorthand string; the m/w regex branches in parseTimespanDays only ever fire for the two ' +
        'hardcoded string defaults ("6m"/"12m"), never for a value written through this endpoint',
      async () => {
        const svc = new AppConfigService();

        await svc.set('default_workingplan_timespan', '12w');
        expect(await svc.get('default_workingplan_timespan')).toBe(12);

        await svc.set('public_workingplan_html_timespan', '30');
        expect(await svc.get('public_workingplan_html_timespan')).toBe(30);
      },
    );

    it('parses a "K"/"M"/"G"-suffixed max_db_mem_size into a byte count (this key is :string-typed, so the suffix survives the write)', async () => {
      const svc = new AppConfigService();
      await svc.set('max_db_mem_size', '50M');
      expect(await svc.get('max_db_mem_size')).toBe(50 * 1024 * 1024);
    });

    it('parses a "M"-suffixed max_upload_file_size into a byte count on write+read (shares max_db_mem_size\'s parser)', async () => {
      const svc = new AppConfigService();
      await svc.set('max_upload_file_size', '10M');
      expect(await svc.get('max_upload_file_size')).toBe(10 * 1024 * 1024);
    });

    it('round-trips a bare digit-string max_upload_file_size unchanged', async () => {
      const svc = new AppConfigService();
      await svc.set('max_upload_file_size', String(5 * 1024 * 1024));
      expect(await svc.get('max_upload_file_size')).toBe(String(5 * 1024 * 1024));
    });

    it('leaves other keys untouched by a write to one key', async () => {
      const svc = new AppConfigService();
      await svc.set('domain', 'before.example.org');
      await svc.set('organisation', 'Keep Me');

      await svc.set('domain', 'after.example.org');

      expect(await svc.get('domain')).toBe('after.example.org');
      expect(await svc.get('organisation')).toBe('Keep Me');
    });

    it('throws when writing an unknown key', async () => {
      const svc = new AppConfigService();
      await expect(svc.set('not_a_real_key', 'x')).rejects.toThrow();
    });

    it('persists writes across service instances (backed by the DB, not just the in-process cache)', async () => {
      const writer = new AppConfigService();
      await writer.set('domain', 'persisted.example.org');

      const reader = new AppConfigService();
      expect(await reader.get('domain')).toBe('persisted.example.org');
    });

    it('updates the existing row rather than creating a duplicate on a second write to the same key', async () => {
      const svc = new AppConfigService();
      await svc.set('domain', 'first.example.org');
      await svc.set('domain', 'second.example.org');

      const rows = await prisma.app_config_adapters.findMany({ where: { key: `${envKeyPrefix()}_domain` } });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.value).toBe('second.example.org');
    });
  });

  describe('caching', () => {
    it('serves a repeated get() from cache within the TTL without re-querying the DB', async () => {
      let now = 0;
      const svc = new AppConfigService({ ttlMs: 1000, now: () => now });

      await svc.set('domain', 'cached.example.org');
      expect(await svc.get('domain')).toBe('cached.example.org');

      // Mutate the DB directly, bypassing the service entirely - a cached
      // get() within the TTL window should still see the pre-mutation value.
      await prisma.app_config_adapters.update({
        where: { key: `${envKeyPrefix()}_domain` },
        data: { value: 'mutated-behind-the-cache.example.org' },
      });

      now += 500; // still within the 1000ms TTL
      expect(await svc.get('domain')).toBe('cached.example.org');
    });

    it('refetches once the TTL has elapsed', async () => {
      let now = 0;
      const svc = new AppConfigService({ ttlMs: 1000, now: () => now });

      await svc.set('domain', 'cached.example.org');
      expect(await svc.get('domain')).toBe('cached.example.org');

      await prisma.app_config_adapters.update({
        where: { key: `${envKeyPrefix()}_domain` },
        data: { value: 'refreshed.example.org' },
      });

      now += 1500; // past the TTL
      expect(await svc.get('domain')).toBe('refreshed.example.org');
    });

    it("invalidates the cache immediately on set(), even within the TTL window (Ruby's `dirty!`)", async () => {
      let now = 0;
      const svc = new AppConfigService({ ttlMs: 60_000, now: () => now });

      await svc.set('domain', 'first.example.org');
      expect(await svc.get('domain')).toBe('first.example.org');

      now += 10; // well within the 60s TTL
      await svc.set('domain', 'second.example.org');
      expect(await svc.get('domain')).toBe('second.example.org');
    });

    it('defaults to a 1-second TTL under NODE_ENV=development and 5 minutes otherwise, matching `Rails.env.development? ? 1.second : 5.minutes`', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'development';
        expect(new AppConfigService().ttlMs).toBe(1_000);

        process.env.NODE_ENV = 'test';
        expect(new AppConfigService().ttlMs).toBe(5 * 60_000);

        process.env.NODE_ENV = 'production';
        expect(new AppConfigService().ttlMs).toBe(5 * 60_000);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('default_event_duration_minutes', () => {
    it('defaults to 60 when no row exists', async () => {
      const service = new AppConfigService({ now: () => 0 });
      await expect(service.get('default_event_duration_minutes')).resolves.toBe(60);
    });

    it('reads back an admin-written value as a number', async () => {
      const service = new AppConfigService({ now: () => 0 });
      await service.set('default_event_duration_minutes', '90');
      await expect(service.get('default_event_duration_minutes')).resolves.toBe(90);
    });
  });

  describe('wrapper functions (getConfigString, getBoolean, getTimespanDays)', () => {
    describe('getConfigString', () => {
      it('returns null when the config value is null (unconfigured key with no default)', async () => {
        // organisation has no compiled-in default
        const result = await getConfigString('organisation');
        expect(result).toBeNull();
      });

      it('returns String(value) when the config value is set to a string', async () => {
        // Use the shared appConfig instance and dirty the cache to ensure fresh reads
        await appConfig.set('organisation', 'Test Organization');
        const result = await getConfigString('organisation');
        expect(result).toBe('Test Organization');
      });

      it('coerces non-string values to their string representation', async () => {
        // Set a numeric key and read it back via getConfigString
        await appConfig.set('default_event_duration_minutes', '90');
        const result = await getConfigString('default_event_duration_minutes');
        expect(result).toBe('90');
      });
    });

    describe('getBoolean', () => {
      it('returns false when the config value is null (unconfigured key with no default)', async () => {
        // organisation is a string key with no default - dirty it to ensure it's null
        appConfig.dirty('organisation');
        const result = await getBoolean('organisation');
        expect(result).toBe(false);
      });

      it('returns false when the config value is falsy', async () => {
        await appConfig.set('public_wp_available_to_anon_users', false);
        const result = await getBoolean('public_wp_available_to_anon_users');
        expect(result).toBe(false);
      });

      it('returns true when the config value is truthy', async () => {
        await appConfig.set('public_wp_available_to_anon_users', true);
        const result = await getBoolean('public_wp_available_to_anon_users');
        expect(result).toBe(true);
      });
    });

    describe('getTimespanDays', () => {
      it('returns the numeric value when the stored value is a number', async () => {
        await appConfig.set('default_workingplan_timespan', '180');
        const result = await getTimespanDays('default_workingplan_timespan');
        expect(result).toBe(180);
      });

      it('returns the parsed default (4*30=120) fallback when the value is not a number (currently unreachable in practice since all timespan keys have compiled-in defaults)', async () => {
        // All timespan keys have compiled-in defaults that are parsed to numbers,
        // so this branch is "currently unreachable" as the function comment states.
        // We test the fallback by verifying the function returns 120 when appConfig.get
        // returns null. We call with an unknown key that has no default - unknown keys
        // return null from appConfig.get, and getTimespanDays converts that to 120.
        const result = await getTimespanDays('nonexistent_timespan_key');
        expect(result).toBe(120); // Falls back to 4 * 30
      });
    });
  });
});
