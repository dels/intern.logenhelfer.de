import { randomUUID } from 'node:crypto';

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import statisticsRouter from '../../src/routes/statistics.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';

// Port of rails-app/spec/requests/api/v1/statistics_spec.rb (8 examples),
// plus a small number of net-new security tests (see the bottom describe
// block).

const app = express();
app.use(express.json());
app.use('/api/v1/statistics', statisticsRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

/** Mirrors the Rails factory's `date_of_birth { 50.year.ago }` default - see
 * User's `validates_presence_of :date_of_birth`; every user created for
 * these specs needs one so `user_stats`'s avg_age computation has real data
 * to work with. */
function fiftyYearsAgo(): Date {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 50);
  return d;
}

let matriculationCounter = 0;

/**
 * Mirrors the Rails spec's FactoryBot `:user` defaults (firstname "Appr",
 * lastname "Entice", a generated matriculation_number, a generated uuid) -
 * `UserStatsRow`/`UserFileStatsRow` in openapi.yaml mark all four as
 * required and non-nullable, and `createUser`'s own bare defaults leave them
 * null, so every user created for these specs needs them set explicitly both
 * to satisfy the contract and to make the row-identity assertions below
 * actually test something instead of `null === null`.
 */
function memberDefaults(): { date_of_birth: Date; uuid: string; firstname: string; lastname: string; matriculation_number: number } {
  matriculationCounter += 1;
  return {
    date_of_birth: fiftyYearsAgo(),
    uuid: randomUUID(),
    firstname: 'Appr',
    lastname: 'Entice',
    matriculation_number: matriculationCounter,
  };
}

async function createRole(name: string, displayName: string): Promise<{ id: number }> {
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

describe('Statistics API', () => {
  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide - resetDb() truncates
    // app_config_adapters but doesn't itself invalidate that in-memory
    // cache, so every known key is explicitly dirtied to force a fresh
    // (post-truncate, default) read. Same pattern as members.test.ts.
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
  });

  async function makePlainMember(): Promise<users> {
    const apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
    const user = await createUser(memberDefaults());
    await assignRole(user.id, apprenticeRole.id);
    return user;
  }

  async function makeAdmin(): Promise<users> {
    const adminRole = await createRole('Admin', 'Administrator');
    const user = await createUser(memberDefaults());
    await assignRole(user.id, adminRole.id);
    return user;
  }

  async function makeNetDelegate(): Promise<users> {
    const netDelegateRole = await createRole('NetDelegate', 'Net-Delegierter');
    const user = await createUser(memberDefaults());
    await assignRole(user.id, netDelegateRole.id);
    return user;
  }

  async function makeMemberOfCouncil(): Promise<users> {
    const memberOfCouncilRole = await createRole('MemberOfCouncil', 'Ratsmitglied');
    const user = await createUser(memberDefaults());
    await assignRole(user.id, memberOfCouncilRole.id);
    return user;
  }

  describe('GET /api/v1/statistics/user_stats', () => {
    it('forbids a plain member (not granted user_stats)', async () => {
      const plainMember = await makePlainMember();

      const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(plainMember));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('returns avg_age and a paginated login-activity table for an admin', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      await prisma.users.update({
        where: { id: plainMember.id },
        data: { current_sign_in_at: new Date(Date.now() - 24 * 60 * 60 * 1000), sign_in_count: 3 },
      });

      const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(Number.isInteger(res.body.avg_age)).toBe(true);
      expect(res.body.rows.map((r: { uuid: string }) => r.uuid)).toContain(plainMember.uuid);
    });

    it('exposes current_sign_in_ip to an Admin caller', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      await prisma.users.update({
        where: { id: plainMember.id },
        data: { current_sign_in_at: new Date(), sign_in_count: 3, current_sign_in_ip: '203.0.113.5' },
      });

      const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(admin));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
      expect(row.current_sign_in_ip).toBe('203.0.113.5');
    });

    it('exposes current_sign_in_ip to a NetDelegate caller', async () => {
      const plainMember = await makePlainMember();
      const netDelegate = await makeNetDelegate();
      await prisma.users.update({
        where: { id: plainMember.id },
        data: { current_sign_in_at: new Date(), sign_in_count: 3, current_sign_in_ip: '203.0.113.5' },
      });

      const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(netDelegate));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
      expect(row.current_sign_in_ip).toBe('203.0.113.5');
    });

    it('nulls out current_sign_in_ip for a MemberOfCouncil caller while keeping other fields intact', async () => {
      const plainMember = await makePlainMember();
      const memberOfCouncil = await makeMemberOfCouncil();
      await prisma.users.update({
        where: { id: plainMember.id },
        data: { current_sign_in_at: new Date(), sign_in_count: 3, current_sign_in_ip: '203.0.113.5' },
      });

      const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(memberOfCouncil));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
      expect(row.current_sign_in_ip).toBeNull();
      expect(row.uuid).toBe(plainMember.uuid);
      expect(row.matriculation_number).toBe(plainMember.matriculation_number);
      expect(row.lastname).toBe(plainMember.lastname);
      expect(row.firstname).toBe(plainMember.firstname);
      expect(row.sign_in_count).toBe(3);
      expect(row.current_sign_in_at).toBeTruthy();
    });

    it('sorts by current_sign_in_ip for an Admin caller (should-allow)', async () => {
      const admin = await makeAdmin();
      const recentHighIp = await makePlainMember();
      const olderLowIp = await makePlainMember();
      await prisma.users.update({
        where: { id: recentHighIp.id },
        data: { current_sign_in_at: new Date(Date.now() - 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '9.9.9.9' },
      });
      await prisma.users.update({
        where: { id: olderLowIp.id },
        data: { current_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '1.1.1.1' },
      });

      const res = await request(app).get('/api/v1/statistics/user_stats').query({ sort: 'current_sign_in_ip' }).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      // Ascending by IP string: '1.1.1.1' sorts before '9.9.9.9', the
      // opposite of the default current_sign_in_at-desc order below.
      expect(uuids.indexOf(olderLowIp.uuid)).toBeLessThan(uuids.indexOf(recentHighIp.uuid));
    });

    it('ignores a current_sign_in_ip sort request from a MemberOfCouncil caller instead of leaking IP ordering via row order (should-deny)', async () => {
      // Regression guard: user_stats paginates/sorts directly in Prisma's
      // orderBy against the real column, before the response masks
      // current_sign_in_ip to null for non-privileged callers - unlike
      // downloads' remote_ip (nulled *before* sorting), naively honoring
      // sort=current_sign_in_ip here would leak the IP ordering as a side
      // channel even though the field itself comes back null.
      const memberOfCouncil = await makeMemberOfCouncil();
      const recentHighIp = await makePlainMember();
      const olderLowIp = await makePlainMember();
      await prisma.users.update({
        where: { id: recentHighIp.id },
        data: { current_sign_in_at: new Date(Date.now() - 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '9.9.9.9' },
      });
      await prisma.users.update({
        where: { id: olderLowIp.id },
        data: { current_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '1.1.1.1' },
      });

      const res = await request(app)
        .get('/api/v1/statistics/user_stats')
        .query({ sort: 'current_sign_in_ip' })
        .set(authHeaders(memberOfCouncil));

      expect(res.status).toBe(200);
      const rows = res.body.rows as { uuid: string; current_sign_in_ip: string | null }[];
      rows.forEach((r) => expect(r.current_sign_in_ip).toBeNull());
      const uuids = rows.map((r) => r.uuid);
      // Falls back to the default (current_sign_in_at desc): the more
      // recent sign-in first - the reverse of what an honored
      // sort=current_sign_in_ip ascending request would have produced.
      expect(uuids.indexOf(recentHighIp.uuid)).toBeLessThan(uuids.indexOf(olderLowIp.uuid));
    });

    describe('demo mode', () => {
      beforeEach(() => {
        delete process.env.DEMO_MODE;
      });
      afterEach(() => {
        delete process.env.DEMO_MODE;
      });

      it('nulls out current_sign_in_ip for an Admin caller when DEMO_MODE is set (should-deny)', async () => {
        process.env.DEMO_MODE = 'true';
        const plainMember = await makePlainMember();
        const admin = await makeAdmin();
        await prisma.users.update({
          where: { id: plainMember.id },
          data: { current_sign_in_at: new Date(), sign_in_count: 3, current_sign_in_ip: '203.0.113.5' },
        });

        const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(admin));

        expect(res.status).toBe(200);
        const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
        expect(row.current_sign_in_ip).toBeNull();
      });

      it('still exposes current_sign_in_ip to an Admin caller once DEMO_MODE is unset (should-allow)', async () => {
        const plainMember = await makePlainMember();
        const admin = await makeAdmin();
        await prisma.users.update({
          where: { id: plainMember.id },
          data: { current_sign_in_at: new Date(), sign_in_count: 3, current_sign_in_ip: '203.0.113.5' },
        });

        const res = await request(app).get('/api/v1/statistics/user_stats').set(authHeaders(admin));

        expect(res.status).toBe(200);
        const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
        expect(row.current_sign_in_ip).toBe('203.0.113.5');
      });

      it('ignores a current_sign_in_ip sort request from an Admin caller in demo mode instead of leaking IP ordering via row order (should-deny)', async () => {
        process.env.DEMO_MODE = 'true';
        const admin = await makeAdmin();
        const recentHighIp = await makePlainMember();
        const olderLowIp = await makePlainMember();
        await prisma.users.update({
          where: { id: recentHighIp.id },
          data: { current_sign_in_at: new Date(Date.now() - 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '9.9.9.9' },
        });
        await prisma.users.update({
          where: { id: olderLowIp.id },
          data: { current_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000), sign_in_count: 1, current_sign_in_ip: '1.1.1.1' },
        });

        const res = await request(app)
          .get('/api/v1/statistics/user_stats')
          .query({ sort: 'current_sign_in_ip' })
          .set(authHeaders(admin));

        expect(res.status).toBe(200);
        const rows = res.body.rows as { uuid: string; current_sign_in_ip: string | null }[];
        rows.forEach((r) => expect(r.current_sign_in_ip).toBeNull());
        const uuids = rows.map((r) => r.uuid);
        // Falls back to the default (current_sign_in_at desc), not the
        // ascending-by-IP order an honored sort would have produced.
        expect(uuids.indexOf(recentHighIp.uuid)).toBeLessThan(uuids.indexOf(olderLowIp.uuid));
      });
    });
  });

  describe('GET /api/v1/statistics/downloads', () => {
    it('allows a plain member (granted by default_user_abilities)', async () => {
      const plainMember = await makePlainMember();

      const res = await request(app).get('/api/v1/statistics/downloads').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.rows).toEqual([]);
      expect(res.body.row_count).toBe(0);
    });

    it('lists a real FileDownload row', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      const now = new Date();
      const download = await prisma.file_downloads.create({
        data: {
          user_id: plainMember.id,
          filename: 'satzung.pdf',
          remote_ip: '127.0.0.1',
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const res = await request(app).get('/api/v1/statistics/downloads').set(authHeaders(admin));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { id: number }) => r.id === download.id);
      expect(row.filename).toBe('satzung.pdf');
      expect(row.user_fullname).toBe([plainMember.firstname, plainMember.lastname].filter(Boolean).join(' '));
    });

    it('exposes remote_ip to an Admin caller', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      const now = new Date();
      const download = await prisma.file_downloads.create({
        data: { user_id: plainMember.id, filename: 'satzung.pdf', remote_ip: '198.51.100.7', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app).get('/api/v1/statistics/downloads').set(authHeaders(admin));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { id: number }) => r.id === download.id);
      expect(row.remote_ip).toBe('198.51.100.7');
    });

    it('exposes remote_ip to a NetDelegate caller', async () => {
      const plainMember = await makePlainMember();
      const netDelegate = await makeNetDelegate();
      const now = new Date();
      const download = await prisma.file_downloads.create({
        data: { user_id: plainMember.id, filename: 'satzung.pdf', remote_ip: '198.51.100.7', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app).get('/api/v1/statistics/downloads').set(authHeaders(netDelegate));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { id: number }) => r.id === download.id);
      expect(row.remote_ip).toBe('198.51.100.7');
    });

    it('nulls out remote_ip for a plain member caller while keeping other fields intact', async () => {
      const plainMember = await makePlainMember();
      const now = new Date();
      const download = await prisma.file_downloads.create({
        data: { user_id: plainMember.id, filename: 'satzung.pdf', remote_ip: '198.51.100.7', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app).get('/api/v1/statistics/downloads').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { id: number }) => r.id === download.id);
      expect(row.remote_ip).toBeNull();
      expect(row.filename).toBe('satzung.pdf');
      expect(row.user_fullname).toBe([plainMember.firstname, plainMember.lastname].filter(Boolean).join(' '));
      expect(row.created_at).toBeTruthy();
    });
  });

  describe('GET /api/v1/statistics/file_stats', () => {
    it('groups downloads by filename with a count, most-downloaded first', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      const now = new Date();
      await prisma.file_downloads.createMany({
        data: [
          { user_id: plainMember.id, filename: 'a.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
          { user_id: plainMember.id, filename: 'b.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
          { user_id: plainMember.id, filename: 'b.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
        ],
      });

      const res = await request(app).get('/api/v1/statistics/file_stats').set(authHeaders(admin));

      expect(res.status).toBe(200);
      const bRow = res.body.rows.find((r: { filename: string }) => r.filename === 'b.pdf');
      expect(bRow.count).toBe(2);
      expect(bRow.row_id).toBeTruthy();
    });
  });

  describe('GET /api/v1/statistics/user_file_stats', () => {
    it('forbids a plain member (not granted user_file_stats)', async () => {
      const plainMember = await makePlainMember();

      const res = await request(app).get('/api/v1/statistics/user_file_stats').set(authHeaders(plainMember));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('groups downloads by user with a count', async () => {
      const plainMember = await makePlainMember();
      const admin = await makeAdmin();
      const now = new Date();
      await prisma.file_downloads.createMany({
        data: [
          { user_id: plainMember.id, filename: 'a.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
          { user_id: plainMember.id, filename: 'b.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
        ],
      });

      const res = await request(app).get('/api/v1/statistics/user_file_stats').set(authHeaders(admin));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { uuid: string }) => r.uuid === plainMember.uuid);
      expect(row.count).toBe(2);
    });
  });

  describe('GET /api/v1/statistics/mem_stats', () => {
    it('allows a plain member and returns counts + storage figures', async () => {
      const plainMember = await makePlainMember();

      const res = await request(app).get('/api/v1/statistics/mem_stats').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(Number.isInteger(res.body.user_count)).toBe(true);
      expect(Number.isInteger(res.body.event_count)).toBe(true);
      expect(Number.isInteger(res.body.memory_used_bytes)).toBe(true);
    });
  });

  describe('users_can_view_statistics AppConfig gate', () => {
    it('forbids a plain member from downloads/file_stats/mem_stats when the flag is disabled', async () => {
      await appConfig.set('users_can_view_statistics', false);
      const plainMember = await makePlainMember();

      const paths = ['downloads', 'file_stats', 'mem_stats'];
      for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop -- sequential is simplest here, each call is independent.
        const res = await request(app).get(`/api/v1/statistics/${path}`).set(authHeaders(plainMember));
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
      }
    });

    it('allows a plain member on downloads/file_stats/mem_stats when the flag is explicitly enabled', async () => {
      await appConfig.set('users_can_view_statistics', true);
      const plainMember = await makePlainMember();

      const paths = ['downloads', 'file_stats', 'mem_stats'];
      for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop -- sequential is simplest here, each call is independent.
        const res = await request(app).get(`/api/v1/statistics/${path}`).set(authHeaders(plainMember));
        expect(res.status).toBe(200);
      }
    });

    it('does not block a MemberOfCouncil caller even when the flag is disabled (elevated statistic access bypasses the gate)', async () => {
      await appConfig.set('users_can_view_statistics', false);
      const memberOfCouncil = await makeMemberOfCouncil();

      const res = await request(app).get('/api/v1/statistics/file_stats').set(authHeaders(memberOfCouncil));
      expect(res.status).toBe(200);
    });

    it('does not block an Admin caller even when the flag is disabled', async () => {
      await appConfig.set('users_can_view_statistics', false);
      const admin = await makeAdmin();

      const res = await request(app).get('/api/v1/statistics/mem_stats').set(authHeaders(admin));
      expect(res.status).toBe(200);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('is forbidden without authentication on every sub-report', async () => {
      const paths = ['user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'];
      for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop -- sequential is simplest here, each call is independent.
        const res = await request(app).get(`/api/v1/statistics/${path}`);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'unauthorized' });
      }
    });

    it('authz boundary: a technically-valid token for a completely role-less user gets 403 on every sub-report, including the ones granted by default_user_abilities', async () => {
      // A user holding no role at all never reaches defaultUserAbilities (it
      // is only invoked via EnteredApprentice/FellowCraft/MasterMason's role
      // dispatch), so unlike the plain_member fixture above (which the Rails
      // spec only asserts is forbidden from user_stats/user_file_stats) this
      // user must be forbidden from ALL FIVE sub-reports, including
      // downloads/file_stats/mem_stats.
      const roleless = await createUser(memberDefaults());
      const paths = ['user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'];

      for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop -- sequential is simplest here, each call is independent.
        const res = await request(app).get(`/api/v1/statistics/${path}`).set(authHeaders(roleless));
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
      }
    });

    it('is not vulnerable to SQL-metacharacter injection via the page/per_page query params', async () => {
      const admin = await makeAdmin();
      const now = new Date();
      await prisma.file_downloads.create({
        data: { user_id: admin.id, filename: 'safe.pdf', remote_ip: '127.0.0.1', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .get('/api/v1/statistics/downloads')
        .query({ page: "0'; DROP TABLE file_downloads; --", per_page: "25'; DROP TABLE users; --" })
        .set(authHeaders(admin));

      // Unparseable page/per_page values fall back to their defaults (0/25)
      // rather than erroring or being interpolated into SQL - proving the
      // params are never used to build a raw query string.
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);
      const stillThere = await prisma.file_downloads.findFirst({ where: { filename: 'safe.pdf' } });
      expect(stillThere).not.toBeNull();
      const usersTableIntact = await prisma.users.findUnique({ where: { id: admin.id } });
      expect(usersTableIntact).not.toBeNull();
    });
  });
});
