import { randomUUID } from 'node:crypto';

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { prisma } from '../../src/db.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const announcementsRouter = (await import('../../src/routes/announcements.js')).default;

// Port of rails-app/spec/requests/api/v1/announcements_spec.rb (8 examples),
// plus a small number of net-new tests covering behavior the Rails spec
// doesn't exercise directly (GET :show, 422 validation, the 404-before-403
// lookup ordering, pagination edge cases) and net-new security tests (see
// the bottom describe block).

const app = express();
app.use(express.json());
app.use('/api/v1/announcements', announcementsRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

/** Mirrors the spec's `Role.find_or_create_by!(name: ...) { |r| r.display_name = ... }`. */
async function createRole(name: string): Promise<{ id: number; name: string | null }> {
  roleCounter += 1;
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  return prisma.roles.create({
    data: { name, display_name: name, created_at: now, updated_at: now },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({
    data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now },
  });
}

async function makeMember(): Promise<users> {
  const apprenticeRole = await createRole('EnteredApprentice');
  const user = await createUser();
  await assignRole(user.id, apprenticeRole.id);
  return user;
}

async function makeWorshipfulMaster(): Promise<users> {
  const worshipfulMasterRole = await createRole('WorshipfulMaster');
  const user = await createUser();
  await assignRole(user.id, worshipfulMasterRole.id);
  return user;
}

async function makeNetDelegate(): Promise<users> {
  const netDelegateRole = await createRole('NetDelegate');
  const user = await createUser();
  await assignRole(user.id, netDelegateRole.id);
  return user;
}

async function createAnnouncement(overrides: Partial<{ title: string; message_body: string; created_by_id: number; deleted: boolean }> = {}) {
  const now = new Date();
  return prisma.announcements.create({
    data: {
      uuid: randomUUID(),
      title: overrides.title ?? 'Willkommen',
      message_body: overrides.message_body ?? 'Hallo zusammen',
      created_by_id: overrides.created_by_id,
      deleted: overrides.deleted ?? false,
      created_at: now,
      updated_at: now,
    },
  });
}

describe('Announcements API', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    vi.mocked(sendMail).mockClear();
  });

  describe('GET /api/v1/announcements', () => {
    it('is forbidden without a degree role', async () => {
      const noRoleUser = await createUser();

      const res = await request(app).get('/api/v1/announcements').set(authHeaders(noRoleUser));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('lists all announcements for a plain member', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      await createAnnouncement({ title: 'Willkommen', created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app).get('/api/v1/announcements').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.row_count).toBe(1);
      const titles = res.body.rows.map((a: { title: string }) => a.title);
      expect(titles).toContain('Willkommen');
    });

    it('is forbidden without authentication', async () => {
      const res = await request(app).get('/api/v1/announcements');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });

    it('defaults to sorting by created_at descending (newest first)', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const older = await createAnnouncement({ title: 'Älter', created_by_id: worshipfulMaster.id });
      await new Promise((resolve) => setTimeout(resolve, 5));
      const newer = await createAnnouncement({ title: 'Neuer', created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app).get('/api/v1/announcements').set(authHeaders(member));
      const uuids = (res.body.rows as Array<{ uuid: string }>).map((r) => r.uuid);
      expect(uuids.indexOf(newer.uuid!)).toBeLessThan(uuids.indexOf(older.uuid!));
    });

    it('sorts by title ascending/descending via ?sort=', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      await createAnnouncement({ title: 'Zeta', created_by_id: worshipfulMaster.id });
      await createAnnouncement({ title: 'Alpha', created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const asc = await request(app).get('/api/v1/announcements?sort=title').set(authHeaders(member));
      expect((asc.body.rows as Array<{ title: string }>).map((r) => r.title)).toEqual(['Alpha', 'Zeta']);

      const desc = await request(app).get('/api/v1/announcements?sort=-title').set(authHeaders(member));
      expect((desc.body.rows as Array<{ title: string }>).map((r) => r.title)).toEqual(['Zeta', 'Alpha']);
    });

    it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
      const member = await makeMember();
      const res = await request(app).get('/api/v1/announcements?sort=deleted;DROP TABLE users;--').set(authHeaders(member));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/announcements', () => {
    it('is forbidden for a plain member', async () => {
      const member = await makeMember();

      const res = await request(app)
        .post('/api/v1/announcements')
        .send({ title: 'Neu', message_body: 'Text' })
        .set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('creates an announcement for a WorshipfulMaster, setting created_by from current_user', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .post('/api/v1/announcements')
        .send({ title: 'Neue Ankündigung', message_body: 'Wichtiger Hinweis' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Neue Ankündigung');
      expect(res.body.message_body).toBe('Wichtiger Hinweis');
      const created = await prisma.announcements.findFirstOrThrow({ where: { title: 'Neue Ankündigung' } });
      expect(created.created_by_id).toBe(worshipfulMaster.id);
    });

    // Port of Announcement#notify_subscribers_new_announcement - every
    // AnnouncementSubscription holder gets emailed when a new announcement
    // is created (rails-app/app/models/announcement.rb's after_create hook).
    it('emails every announcement subscriber, but not a non-subscriber', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const subscriber = await createUser({ email: 'subscriber@example.test', firstname: 'Anna' });
      const nonSubscriber = await createUser({ email: 'not-subscribed@example.test' });
      const now = new Date();
      await prisma.announcement_subscriptions.create({ data: { user_id: subscriber.id, created_at: now, updated_at: now } });

      const res = await request(app)
        .post('/api/v1/announcements')
        .send({ title: 'Wichtige Nachricht', message_body: 'Text' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(201);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'subscriber@example.test',
          subject: expect.stringContaining('Neue Meldung'),
          text: expect.stringContaining('Wichtige Nachricht'),
        }),
      );
      expect(sendMail).not.toHaveBeenCalledWith(expect.objectContaining({ to: nonSubscriber.email }));
    });

    it('emails an English subject/body when language is configured to "en"', async () => {
      await appConfig.set('language', 'en');
      const worshipfulMaster = await makeWorshipfulMaster();
      const subscriber = await createUser({ email: 'subscriber@example.test', firstname: 'Anna' });
      const now = new Date();
      await prisma.announcement_subscriptions.create({ data: { user_id: subscriber.id, created_at: now, updated_at: now } });

      const res = await request(app)
        .post('/api/v1/announcements')
        .send({ title: 'Wichtige Nachricht', message_body: 'Text' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(201);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'subscriber@example.test',
          subject: expect.stringContaining('New announcement published'),
          text: expect.stringContaining('Wichtige Nachricht'),
        }),
      );
    });

    // Net-new: the Rails spec doesn't exercise the 422 branch, but the
    // controller/openapi contract both define it - covering it here. The
    // expected detail is German: rails-app/config/application.rb sets
    // `config.i18n.default_locale = :de`, and config/locales/de.yml
    // translates Announcement#title/#message_body and the presence-blank
    // message, so `errors.full_messages.join(', ')` is German, not English.
    it('returns 422 with the validation detail when title and message_body are blank', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).post('/api/v1/announcements').send({}).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        error: 'unprocessable',
        detail: 'Überschrift muss ausgefüllt werden, Nachricht muss ausgefüllt werden',
      });
    });
  });

  describe('GET /api/v1/announcements/:uuid', () => {
    // Net-new: not in the Rails spec, but the controller/openapi both define
    // the :show action - covering it here.
    it('shows an announcement for a plain member', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app).get(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.uuid).toBe(announcement.uuid);
      expect(res.body.message_body).toBe('Hallo zusammen');
    });

    it('is forbidden without a degree role', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const noRoleUser = await createUser();

      const res = await request(app).get(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(noRoleUser));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('returns 404 for an unknown uuid', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/announcements/does-not-exist').set(authHeaders(member));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'not_found' });
    });
  });

  describe('PATCH /api/v1/announcements/:uuid', () => {
    it('is forbidden for a plain member', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app)
        .patch(`/api/v1/announcements/${announcement.uuid}`)
        .send({ title: 'Aktualisiert' })
        .set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('updates the announcement and sets updated_by from current_user', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });

      const res = await request(app)
        .patch(`/api/v1/announcements/${announcement.uuid}`)
        .send({ title: 'Aktualisiert' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Aktualisiert');
      const reloaded = await prisma.announcements.findUniqueOrThrow({ where: { id: announcement.id } });
      expect(reloaded.title).toBe('Aktualisiert');
      expect(reloaded.updated_by_id).toBe(worshipfulMaster.id);
      // Partial update: message_body wasn't sent, so it's untouched.
      expect(reloaded.message_body).toBe('Hallo zusammen');
    });

    // Net-new: proves the 404-before-403 ordering that mirrors
    // `set_announcement`'s before_action running ahead of the ability check
    // in the Rails controller - an unknown uuid 404s even for a role that
    // would also fail the ability check on an existing record.
    it('returns 404 (not 403) for an unknown uuid, even for a plain member', async () => {
      const member = await makeMember();

      const res = await request(app)
        .patch('/api/v1/announcements/does-not-exist')
        .send({ title: 'Aktualisiert' })
        .set(authHeaders(member));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'not_found' });
    });

    it('returns 422 when the update would leave title blank', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });

      const res = await request(app)
        .patch(`/api/v1/announcements/${announcement.uuid}`)
        .send({ title: '' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ error: 'unprocessable', detail: 'Überschrift muss ausgefüllt werden' });
    });
  });

  describe('DELETE /api/v1/announcements/:uuid', () => {
    it('is forbidden for a plain member', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app).delete(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('soft-deletes the announcement', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });

      const res = await request(app).delete(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(204);
      const reloaded = await prisma.announcements.findUniqueOrThrow({ where: { id: announcement.id } });
      expect(reloaded.deleted).toBe(true);
    });

    // Net-new: a soft-deleted announcement is invisible via both :show and
    // :index, matching Announcement's `default_scope { where(deleted: false) }`.
    it('is no longer visible via show or index after a soft-delete', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      await request(app).delete(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(worshipfulMaster));

      const showRes = await request(app).get(`/api/v1/announcements/${announcement.uuid}`).set(authHeaders(worshipfulMaster));
      const indexRes = await request(app).get('/api/v1/announcements').set(authHeaders(worshipfulMaster));

      expect(showRes.status).toBe(404);
      expect(indexRes.body.row_count).toBe(0);
    });
  });

  describe('pagination edge cases', () => {
    it('clamps per_page to 100 and treats a non-numeric page as 0', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const member = await makeMember();

      const res = await request(app)
        .get('/api/v1/announcements')
        .query({ page: 'not-a-number', per_page: '99999' })
        .set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.row_count).toBe(1);
      expect(res.body.rows.length).toBe(1);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a NetDelegate (broad admin abilities elsewhere) still gets 403 updating an Announcement', async () => {
      // NetDelegate holds file_admin/user_admin/Statistic abilities
      // (ability.rb's net_delegate_abilities) but never calls
      // announcement_admin_abilities - so a technically-valid, broadly-
      // privileged token must still be forbidden here.
      const worshipfulMaster = await makeWorshipfulMaster();
      const announcement = await createAnnouncement({ created_by_id: worshipfulMaster.id });
      const netDelegate = await makeNetDelegate();

      const res = await request(app)
        .patch(`/api/v1/announcements/${announcement.uuid}`)
        .send({ title: 'Hijacked' })
        .set(authHeaders(netDelegate));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
      const reloaded = await prisma.announcements.findUniqueOrThrow({ where: { id: announcement.id } });
      expect(reloaded.title).not.toBe('Hijacked');
    });
  });
});
