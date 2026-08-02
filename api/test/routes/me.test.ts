import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { RefreshTokenInvalidError, issueRefreshToken, rotateRefreshToken } from '../../src/auth/refreshToken.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import meRouter from '../../src/routes/me.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';

// Port of rails-app/spec/requests/api/v1/me_spec.rb (17 examples), plus a
// small number of net-new security tests (see the bottom describe block).
// This resource has no search/filter/sort query param, so no
// SQL-injection-attempt test applies here (nothing touches the DB via a
// caller-controlled query param) - see the appConfig/statistics ports'
// identical note.

const app = express();
app.use(express.json());
app.use('/api/v1', meRouter);
app.use(apiErrorHandler);

// Matches rails-app/spec/factories.rb's `factory :user` default password.
const PASSWORD = 'foobar123';

// Low bcrypt cost - see session.test.ts's identical constant/rationale.
const TEST_BCRYPT_COST = 4;

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

/** An access token carrying an `act` claim, i.e. as if issued by the impersonate route. */
function impersonatingAuthHeaders(user: users, impersonatorId: number): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id, impersonatorId)}` };
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

/** A user with a real password hash (`foobar123`), matching the Rails `member` let. */
async function createLoginableUser(overrides: Record<string, unknown> = {}): Promise<users> {
  return createUser({
    firstname: 'Appr',
    lastname: 'Entice',
    encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST),
    ...overrides,
  });
}

/** Port of the Rails spec's `member` let: a user holding the EnteredApprentice degree role. */
async function createMember(): Promise<users> {
  const apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
  const user = await createLoginableUser();
  await assignRole(user.id, apprenticeRole.id);
  return user;
}

describe('Me API', () => {
  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide - see statistics.test.ts's
    // identical note (same pattern as members.test.ts/public.test.ts).
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
  });

  describe('GET /api/v1/me', () => {
    it('returns the user and an ability map', async () => {
      const user = await createUser({ uuid: randomUUID() });
      // Rails spec's `let!(:member)` (an EnteredApprentice) exists alongside
      // `user` in every example via `let!` - reproduced here even though
      // this particular example doesn't reference it directly, since its
      // mere existence is what the original spec set up.
      await createMember();

      const res = await request(app).get('/api/v1/me').set(authHeaders(user));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
      // uuid was added on top of the Rails port so the frontend can address
      // the current user via the existing self-service
      // `/api/v1/members/:uuid` endpoints (see account editing task).
      expect(res.body.user.uuid).toBe(user.uuid);
      expect(typeof res.body.abilities).toBe('object');
      expect(res.body.abilities).toHaveProperty('event');
      expect(res.body.abilities.event.every((a: string) => ['read', 'create', 'update', 'destroy'].includes(a))).toBe(true);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });

    it('includes an app_config ability key for an application admin', async () => {
      const applicationAdminRole = await createRole('ApplicationAdmin', 'Kann Anwendung konfigurieren');
      const applicationAdmin = await createUser({ email: `me-app-config-admin-${Date.now()}@example.org` });
      await assignRole(applicationAdmin.id, applicationAdminRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(applicationAdmin));

      expect(res.status).toBe(200);
      expect(res.body.abilities).toHaveProperty('app_config');
      expect(res.body.abilities.app_config).toContain('update');
    });

    it('exposes external_event_participant.destroy for a working-plan admin (Secretary), but not for a plain member', async () => {
      // Regression coverage for the Task 11 review finding: the confirm/
      // remove-on-behalf-of routes in externalEvents.ts gate on
      // `can('manage', 'ExternalEventParticipant')`, granted only by
      // workingPlanAdminAbilities (reachable via Secretary/WorshipfulMaster/
      // WorkingPlanAdmin/Admin) - NOT by applicationAdminAbilities alone.
      // `destroy` is asserted (rather than `update`) because
      // defaultUserAbilities grants every degree-holding member
      // `['show', 'create', 'edit', 'update']` on their OWN
      // ExternalEventParticipant (conditioned on `user_id`) - and this map's
      // bare-subject-type probe (see abilitiesMap's AbilityProbe) matches
      // literal actions regardless of instance conditions, so `update` would
      // read `true` for every plain member too. `destroy` is never granted by
      // that self-scoped rule, so it's the one CRUD action that actually
      // discriminates "holds the admin bundle" from "can manage my own
      // registration".
      const secretaryRole = await createRole('Secretary', 'Schriftführer');
      const secretary = await createUser({ email: `me-secretary-${Date.now()}@example.org` });
      await assignRole(secretary.id, secretaryRole.id);

      const secretaryRes = await request(app).get('/api/v1/me').set(authHeaders(secretary));

      expect(secretaryRes.status).toBe(200);
      expect(secretaryRes.body.abilities).toHaveProperty('external_event_participant');
      expect(secretaryRes.body.abilities.external_event_participant).toContain('destroy');

      const plainMember = await createMember();
      const memberRes = await request(app).get('/api/v1/me').set(authHeaders(plainMember));

      expect(memberRes.status).toBe(200);
      expect(memberRes.body.abilities.external_event_participant).not.toContain('destroy');
    });

    it('includes subscribed_to_announcements, false by default', async () => {
      const member = await createMember();

      const res = await request(app).get('/api/v1/me').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.user.subscribed_to_announcements).toBe(false);
    });

    it('includes gdpr_accepted, false by default', async () => {
      const member = await createMember();

      const res = await request(app).get('/api/v1/me').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.user.gdpr_accepted).toBe(false);
    });

    it('sets mfa_setup_required when mandatory MFA is past its grace period with nothing enrolled', async () => {
      const user = await createLoginableUser();
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_mode', value: 'mandatory' } });
      await prisma.app_config_adapters.create({
        data: { key: 'test_mfa_grace_period_started_at', value: new Date(Date.now() - 30 * 86_400_000).toISOString() },
      });
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_grace_period_days', value: '14' } });
      appConfig.dirty('mfa_mode');
      appConfig.dirty('mfa_grace_period_started_at');
      appConfig.dirty('mfa_grace_period_days');

      const res = await request(app).get('/api/v1/me').set(authHeaders(user));
      expect(res.status).toBe(200);
      expect(res.body.mfa_setup_required).toBe(true);
    });

    it('does not set mfa_setup_required for optional mode', async () => {
      const user = await createLoginableUser();
      const res = await request(app).get('/api/v1/me').set(authHeaders(user));
      expect(res.status).toBe(200);
      expect(res.body.mfa_setup_required).toBe(false);
    });
  });

  describe('GET /api/v1/me — Statistic ability exposure', () => {
    it('exposes index/downloads/file_stats/mem_stats (but not user_stats/user_file_stats) for a plain member', async () => {
      const apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
      const plainMember = await createUser({ email: `plain-member-${Date.now()}@example.org` });
      await assignRole(plainMember.id, apprenticeRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.abilities.statistic.sort()).toEqual(['downloads', 'file_stats', 'index', 'mem_stats'].sort());
    });

    it('exposes all six Statistic actions for an admin (via the :manage grant)', async () => {
      const adminRole = await createRole('Admin', 'Administrator');
      const admin = await createUser({ email: `admin-${Date.now()}@example.org` });
      await assignRole(admin.id, adminRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.abilities.statistic.sort()).toEqual(
        ['index', 'user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'].sort(),
      );
    });

    it('hides index/downloads/file_stats/mem_stats for a plain member when users_can_view_statistics is disabled', async () => {
      await appConfig.set('users_can_view_statistics', false);
      const apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
      const plainMember = await createUser({ email: `plain-member-gated-${Date.now()}@example.org` });
      await assignRole(plainMember.id, apprenticeRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.abilities.statistic).toEqual([]);
    });

    it('does not hide any Statistic actions for an admin even when users_can_view_statistics is disabled (elevated access bypasses the gate)', async () => {
      await appConfig.set('users_can_view_statistics', false);
      const adminRole = await createRole('Admin', 'Administrator');
      const admin = await createUser({ email: `admin-gated-${Date.now()}@example.org` });
      await assignRole(admin.id, adminRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.abilities.statistic.sort()).toEqual(
        ['index', 'user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'].sort(),
      );
    });
  });

  describe('GET /api/v1/me — Seeker names_list ability exposure', () => {
    it('does not expose names_list for a plain member when show_seeker_names_to_brothers is disabled (the default)', async () => {
      const plainMember = await createMember();

      const res = await request(app).get('/api/v1/me').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.abilities.seeker ?? []).not.toContain('names_list');
    });

    it('exposes names_list for a plain member once show_seeker_names_to_brothers is enabled', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      const plainMember = await createMember();

      const res = await request(app).get('/api/v1/me').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.abilities.seeker).toContain('names_list');
    });

    it('does not expose names_list for a Worshipful Master even when the flag is enabled - they already have full Seeker read access', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      const wmRole = await createRole('WorshipfulMaster', 'Meister vom Stuhl');
      const wm = await createUser({ email: `me-wm-${Date.now()}@example.org` });
      await assignRole(wm.id, wmRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(wm));

      expect(res.status).toBe(200);
      expect(res.body.abilities.seeker).toContain('read');
      expect(res.body.abilities.seeker).not.toContain('names_list');
    });

    it('does not expose names_list for a council member even when the flag is enabled - same reasoning as the Worshipful Master case', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      const councilRole = await createRole('MemberOfCouncil', 'Ratsmitglied');
      const councilMember = await createUser({ email: `me-council-${Date.now()}@example.org` });
      await assignRole(councilMember.id, councilRole.id);

      const res = await request(app).get('/api/v1/me').set(authHeaders(councilMember));

      expect(res.status).toBe(200);
      expect(res.body.abilities.seeker).not.toContain('names_list');
    });
  });

  describe('PATCH /api/v1/me/announcement_subscription', () => {
    it('is forbidden for a user without a degree role', async () => {
      const noRoleUser = await createUser();

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(authHeaders(noRoleUser))
        .send({ subscribed: true });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('subscribes the current user when subscribed=true', async () => {
      const member = await createMember();

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(authHeaders(member))
        .send({ subscribed: true });

      expect(res.status).toBe(200);
      expect(res.body.user.subscribed_to_announcements).toBe(true);
      const subscription = await prisma.announcement_subscriptions.findFirst({ where: { user_id: member.id } });
      expect(subscription).not.toBeNull();
    });

    it('is idempotent when already subscribed', async () => {
      const member = await createMember();
      const now = new Date();
      await prisma.announcement_subscriptions.create({ data: { user_id: member.id, created_at: now, updated_at: now } });

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(authHeaders(member))
        .send({ subscribed: true });

      expect(res.status).toBe(200);
      const count = await prisma.announcement_subscriptions.count({ where: { user_id: member.id } });
      expect(count).toBe(1);
    });

    it('unsubscribes the current user when subscribed=false', async () => {
      const member = await createMember();
      const now = new Date();
      await prisma.announcement_subscriptions.create({ data: { user_id: member.id, created_at: now, updated_at: now } });

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(authHeaders(member))
        .send({ subscribed: false });

      expect(res.status).toBe(200);
      expect(res.body.user.subscribed_to_announcements).toBe(false);
      const subscription = await prisma.announcement_subscriptions.findFirst({ where: { user_id: member.id } });
      expect(subscription).toBeNull();
    });

    it('is forbidden while impersonating (consent-fabrication regression)', async () => {
      const member = await createMember();
      const admin = await createUser({ email: `impersonating-admin-sub-${Date.now()}@example.org` });

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(impersonatingAuthHeaders(member, admin.id))
        .send({ subscribed: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden_while_impersonating');
      const subscription = await prisma.announcement_subscriptions.findFirst({ where: { user_id: member.id } });
      expect(subscription).toBeNull();
    });

    it('still succeeds for a normal, non-impersonated session', async () => {
      const member = await createMember();

      const res = await request(app)
        .patch('/api/v1/me/announcement_subscription')
        .set(authHeaders(member))
        .send({ subscribed: true });

      expect(res.status).toBe(200);
      expect(res.body.user.subscribed_to_announcements).toBe(true);
    });
  });

  describe('PATCH /api/v1/me/gdpr_acceptance', () => {
    it('sets gdpr_accepted to true for the current user, regardless of degree role', async () => {
      const noRoleUser = await createUser();

      const res = await request(app).patch('/api/v1/me/gdpr_acceptance').set(authHeaders(noRoleUser));

      expect(res.status).toBe(200);
      expect(res.body.user.gdpr_accepted).toBe(true);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: noRoleUser.id } });
      expect(reloaded.accepted_gdpr).toBe(true);
    });

    it('is idempotent when already accepted', async () => {
      const member = await createMember();
      await prisma.users.update({ where: { id: member.id }, data: { accepted_gdpr: true } });

      const res = await request(app).patch('/api/v1/me/gdpr_acceptance').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.user.gdpr_accepted).toBe(true);
    });

    it('401s without a token', async () => {
      const res = await request(app).patch('/api/v1/me/gdpr_acceptance');

      expect(res.status).toBe(401);
    });

    it('is forbidden while impersonating (consent-fabrication regression)', async () => {
      // Bug: the impersonate route issued a token indistinguishable from a
      // real login, so an admin impersonating a member could accept the
      // GDPR terms "as" that member with no trace back to the admin.
      const member = await createMember();
      const admin = await createUser({ email: `impersonating-admin-${Date.now()}@example.org` });

      const res = await request(app).patch('/api/v1/me/gdpr_acceptance').set(impersonatingAuthHeaders(member, admin.id));

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden_while_impersonating');
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.accepted_gdpr).toBe(false);
    });

    it('still succeeds for a normal, non-impersonated session', async () => {
      const member = await createMember();

      const res = await request(app).patch('/api/v1/me/gdpr_acceptance').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.user.gdpr_accepted).toBe(true);
    });
  });

  describe('PATCH /api/v1/me/password', () => {
    it('rejects the wrong current password', async () => {
      const member = await createMember();

      const res = await request(app).patch('/api/v1/me/password').set(authHeaders(member)).send({
        current_password: 'wrong-password',
        new_password: 'newpass123',
        new_password_confirmation: 'newpass123',
      });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
    });

    it('rejects a mismatched confirmation', async () => {
      const member = await createMember();

      const res = await request(app).patch('/api/v1/me/password').set(authHeaders(member)).send({
        current_password: PASSWORD,
        new_password: 'newpass123',
        new_password_confirmation: 'different456',
      });

      expect(res.status).toBe(422);
    });

    it('changes the password when the current password is correct and the new one is valid', async () => {
      const member = await createMember();

      const res = await request(app).patch('/api/v1/me/password').set(authHeaders(member)).send({
        current_password: PASSWORD,
        new_password: 'newpass123',
        new_password_confirmation: 'newpass123',
      });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(await bcrypt.compare('newpass123', reloaded.encrypted_password)).toBe(true);
    });

    it('is forbidden while impersonating (unattributable password-change regression)', async () => {
      const member = await createMember();
      const admin = await createUser({ email: `impersonating-admin-pw-${Date.now()}@example.org` });

      const res = await request(app)
        .patch('/api/v1/me/password')
        .set(impersonatingAuthHeaders(member, admin.id))
        .send({ current_password: PASSWORD, new_password: 'newpass123', new_password_confirmation: 'newpass123' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden_while_impersonating');
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(await bcrypt.compare(PASSWORD, reloaded.encrypted_password)).toBe(true);
    });

    it('revokes every outstanding refresh token for the user on a successful password change (stolen-cookie regression)', async () => {
      // Bug: neither this handler nor member soft-delete called
      // revokeFamily/an equivalent - an attacker holding a stolen refresh
      // token survived a password change meant to lock them out.
      const member = await createMember();
      const { rawToken } = await issueRefreshToken(member.id);

      const res = await request(app).patch('/api/v1/me/password').set(authHeaders(member)).send({
        current_password: PASSWORD,
        new_password: 'newpass123',
        new_password_confirmation: 'newpass123',
      });

      expect(res.status).toBe(200);
      await expect(rotateRefreshToken(rawToken)).rejects.toThrow(RefreshTokenInvalidError);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a role-less user with a technically-valid token gets 403 from update_password too (not just announcement_subscription)', async () => {
      // The Rails spec only exercises the forbidden case for
      // announcement_subscription, but update_password is gated by the exact
      // same self-scoped `update_password` grant in
      // default_user_abilities/ability.ts - only reachable via an
      // EnteredApprentice/FellowCraft/MasterMason degree role, same as
      // announcement_subscription. A role-less user (no degree role at all)
      // must be forbidden here too, even with a valid access token.
      const noRoleUser = await createLoginableUser();

      const res = await request(app).patch('/api/v1/me/password').set(authHeaders(noRoleUser)).send({
        current_password: PASSWORD,
        new_password: 'newpass123',
        new_password_confirmation: 'newpass123',
      });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: noRoleUser.id } });
      expect(await bcrypt.compare(PASSWORD, reloaded.encrypted_password)).toBe(true);
    });

    it('is forbidden without authentication on every mutating action', async () => {
      const resSubscription = await request(app).patch('/api/v1/me/announcement_subscription').send({ subscribed: true });
      expect(resSubscription.status).toBe(401);

      const resPassword = await request(app).patch('/api/v1/me/password').send({
        current_password: PASSWORD,
        new_password: 'newpass123',
        new_password_confirmation: 'newpass123',
      });
      expect(resPassword.status).toBe(401);
    });
  });
});
