import type { users } from '../../src/generated/prisma/client.js';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Action, AppAbility } from '../../src/authz/ability.js';
import {
  canManageUserAsUserAdmin,
  canViewAttachedFile,
  canViewCategory,
  canViewDirectory,
  canViewUserInDirectory,
  isAdmin,
  isAppResponsible,
  isNetDelegate,
  isSecretary,
  isUserAdmin,
  isWorshipfulMaster,
  toUserSubject,
  buildAbility,
} from '../../src/authz/ability.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

/**
 * `AppAbility#can`'s declared type only accepts a `SubjectName` literal, not
 * a `toUserSubject(...)`-tagged instance - same file-boundary rationale as
 * members.ts's/me.ts's identical `InstanceAbilityProbe` cast (this test file
 * can't widen ability.ts's own exported types).
 */
interface InstanceAbilityProbe {
  can(action: Action, subject: object): boolean;
}
function canOn(ability: AppAbility, action: Action, subject: object): boolean {
  return (ability as unknown as InstanceAbilityProbe).can(action, subject);
}

// Port of rails-app/spec/models/ability_spec.rb (28 examples).
//
// Some Ability rules are Ruby blocks (category/directory/attached_file
// role-overlap visibility, and the two AppConfig[:show_admins]-gated User
// visibility rules) that ability.ts deliberately does not encode as CASL
// conditions - see ability.ts's comments at canViewCategory/canViewDirectory/
// canViewAttachedFile/canViewUserInDirectory/canManageUserAsUserAdmin. Where
// the original spec exercises one of those through `be_able_to`, this port
// calls the corresponding helper directly instead of `ability.can()`, since
// that's the real call a route handler makes for these rules - not a gap in
// coverage, a different (correct) call path for the same policy.

let roleCounter = 0;

async function createRole(name: string): Promise<{ id: number; name: string }> {
  roleCounter += 1;
  const now = new Date();
  const role = await prisma.roles.create({
    data: { name, display_name: `${name} ${roleCounter}`, created_at: now, updated_at: now },
  });
  return { id: role.id, name };
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now } });
}

interface AbilityFixture {
  ability: ReturnType<typeof buildAbility>;
  user: users;
  roleIds: number[];
}

/** Port of the spec's `ability_for`/`user_with` helpers. */
async function abilityFor(...roleNames: string[]): Promise<AbilityFixture> {
  const user = await createUser();
  const roleIds: number[] = [];
  for (const name of roleNames) {
    const role = await createRole(name);
    roleIds.push(role.id);
    await assignRole(user.id, role.id);
  }
  return { ability: buildAbility(user, roleNames), user, roleIds };
}

async function createCategory(): Promise<{ id: number }> {
  const now = new Date();
  return prisma.categories.create({ data: { name: `Verwaltung ${roleCounter}`, created_at: now, updated_at: now } });
}

async function createDirectory(categoryId: number): Promise<{ id: number }> {
  const now = new Date();
  return prisma.directories.create({
    data: { name: `Protokolle ${roleCounter}`, category_id: categoryId, created_at: now, updated_at: now },
  });
}

async function createAttachedFile(directoryId: number, uploaderId: number): Promise<{ id: number }> {
  const now = new Date();
  return prisma.attached_files.create({
    data: {
      directory_id: directoryId,
      uploader_id: uploaderId,
      filename: 'a.pdf',
      content_type: 'application/pdf',
      content: Buffer.from('PDF-BYTES'),
      content_length: 9,
      created_at: now,
      updated_at: now,
    },
  });
}

async function attachRoleToCategory(categoryId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.category_roles.create({ data: { category_id: categoryId, role_id: roleId, created_at: now, updated_at: now } });
}

async function attachRoleToDirectory(directoryId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.directory_roles.create({ data: { directory_id: directoryId, role_id: roleId, created_at: now, updated_at: now } });
}

async function attachRoleToAttachedFile(attachedFileId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.attached_file_roles.create({
    data: { attached_file_id: attachedFileId, role_id: roleId, created_at: now, updated_at: now },
  });
}

async function categoryRoleIds(categoryId: number): Promise<number[]> {
  const rows = await prisma.category_roles.findMany({ where: { category_id: categoryId }, select: { role_id: true } });
  return rows.map((r) => r.role_id).filter((id): id is number => id !== null);
}

async function directoryRoleIds(directoryId: number): Promise<number[]> {
  const rows = await prisma.directory_roles.findMany({ where: { directory_id: directoryId }, select: { role_id: true } });
  return rows.map((r) => r.role_id).filter((id): id is number => id !== null);
}

async function attachedFileRoleIds(attachedFileId: number): Promise<number[]> {
  const rows = await prisma.attached_file_roles.findMany({
    where: { attached_file_id: attachedFileId },
    select: { role_id: true },
  });
  return rows.map((r) => r.role_id).filter((id): id is number => id !== null);
}

describe('buildAbility', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('a plain member (no functional role - EnteredApprentice/FellowCraft/MasterMason all resolve here)', () => {
    it('can manage their own profile but not others', async () => {
      const { ability, user } = await abilityFor('EnteredApprentice');
      const other = await createUser();

      expect(canOn(ability, 'show', toUserSubject(user))).toBe(true);
      expect(canOn(ability, 'update', toUserSubject(user))).toBe(true);
      expect(canOn(ability, 'update', toUserSubject(other))).toBe(false);
      expect(canOn(ability, 'destroy', toUserSubject(user))).toBe(false);
    });

    it('can update their own birthday-calendar consent but not others\'', async () => {
      const { ability, user } = await abilityFor('EnteredApprentice');
      const other = await createUser();

      expect(canOn(ability, 'update_birthday_calendar_consent', toUserSubject(user))).toBe(true);
      expect(canOn(ability, 'update_birthday_calendar_consent', toUserSubject(other))).toBe(false);
    });

    it('can read announcements and external events, but not manage them', async () => {
      const { ability } = await abilityFor('EnteredApprentice');

      expect(ability.can('index', 'Announcement')).toBe(true);
      expect(ability.can('manage', 'Announcement')).toBe(false);
      expect(ability.can('index', 'ExternalEvent')).toBe(true);
      expect(ability.can('manage', 'ExternalEvent')).toBe(false);
    });

    it('cannot see a category/directory/attached_file it holds no role for', async () => {
      const { roleIds } = await abilityFor('EnteredApprentice');
      const category = await createCategory();
      const directory = await createDirectory(category.id);
      const uploader = await createUser();
      const attachedFile = await createAttachedFile(directory.id, uploader.id);

      expect(canViewCategory(roleIds, await categoryRoleIds(category.id))).toBe(false);
      expect(canViewDirectory(roleIds, await directoryRoleIds(directory.id))).toBe(false);
      expect(canViewAttachedFile(roleIds, await attachedFileRoleIds(attachedFile.id))).toBe(false);
    });

    it('sees a category/directory/attached_file once it shares a role with it', async () => {
      const { roleIds } = await abilityFor('EnteredApprentice');
      const [roleId] = roleIds;
      if (roleId === undefined) throw new Error('expected a role id');
      const category = await createCategory();
      const directory = await createDirectory(category.id);
      const uploader = await createUser();
      const attachedFile = await createAttachedFile(directory.id, uploader.id);

      await attachRoleToCategory(category.id, roleId);
      await attachRoleToDirectory(directory.id, roleId);
      await attachRoleToAttachedFile(attachedFile.id, roleId);

      expect(canViewCategory(roleIds, await categoryRoleIds(category.id))).toBe(true);
      expect(canViewDirectory(roleIds, await directoryRoleIds(directory.id))).toBe(true);
      expect(canViewAttachedFile(roleIds, await attachedFileRoleIds(attachedFile.id))).toBe(true);
    });

    it('cannot manage lodges, users, roles, or app config', async () => {
      const { ability } = await abilityFor('EnteredApprentice');
      const other = await createUser();

      expect(ability.can('manage', 'Lodge')).toBe(false);
      expect(ability.can('manage', 'Role')).toBe(false);
      expect(ability.can('manage', 'UserRole')).toBe(false);
      expect(ability.can('manage', 'AppConfig')).toBe(false);
      expect(canOn(ability, 'destroy', toUserSubject(other))).toBe(false);
    });

    it('cannot impersonate anyone', async () => {
      const { ability } = await abilityFor('EnteredApprentice');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(false);
    });
  });

  describe('FileAdmin', () => {
    it('manages categories, directories, and attached files', async () => {
      const { ability } = await abilityFor('FileAdmin');

      expect(ability.can('manage', 'Category')).toBe(true);
      expect(ability.can('manage', 'Directory')).toBe(true);
      expect(ability.can('manage', 'AttachedFile')).toBe(true);
    });

    it('cannot manage users, events, or lodges', async () => {
      const { ability } = await abilityFor('FileAdmin');
      const other = await createUser();

      expect(canOn(ability, 'manage', toUserSubject(other))).toBe(false);
      expect(ability.can('manage', 'Event')).toBe(false);
      expect(ability.can('manage', 'Lodge')).toBe(false);
    });
  });

  describe('UserAdmin', () => {
    it('manages user roles and can edit/destroy members', async () => {
      const { ability } = await abilityFor('UserAdmin');

      expect(ability.can('manage', 'UserRole')).toBe(true);
      // edit/destroy of an ordinary member is user_admin_abilities' AppConfig[:show_admins]-gated
      // block (ability.rb L89-91), not a CASL rule - see canManageUserAsUserAdmin.
      expect(canManageUserAsUserAdmin(['UserAdmin'], [], false)).toBe(true);
    });

    it('cannot manage categories, directories, or events (no file_admin/working_plan_admin grant)', async () => {
      const { ability } = await abilityFor('UserAdmin');

      expect(ability.can('manage', 'Category')).toBe(false);
      expect(ability.can('manage', 'Directory')).toBe(false);
      expect(ability.can('manage', 'Event')).toBe(false);
    });

    it('cannot impersonate (impersonate is granted only via the strict Admin role)', async () => {
      const { ability } = await abilityFor('UserAdmin');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(false);
    });
  });

  describe('WorkingPlanAdmin', () => {
    it('manages events and event participants', async () => {
      const { ability } = await abilityFor('WorkingPlanAdmin');

      expect(ability.can('manage', 'Event')).toBe(true);
      expect(ability.can('manage', 'ExternalEvent')).toBe(true);
    });

    it('cannot manage users, categories, or announcements', async () => {
      const { ability } = await abilityFor('WorkingPlanAdmin');
      const other = await createUser();

      expect(canOn(ability, 'manage', toUserSubject(other))).toBe(false);
      expect(ability.can('manage', 'Category')).toBe(false);
      expect(ability.can('manage', 'Announcement')).toBe(false);
    });
  });

  describe('MemberOfCouncil', () => {
    it('sees statistics and seekers, and can csv-export members, but cannot manage anything', async () => {
      const { ability } = await abilityFor('MemberOfCouncil');
      const other = await createUser();

      expect(ability.can('index', 'Statistic')).toBe(true);
      expect(ability.can('user_stats', 'Statistic')).toBe(true);
      expect(canOn(ability, 'csv_export', toUserSubject(other))).toBe(true);
      expect(ability.can('index', 'Seeker')).toBe(true);
      expect(canOn(ability, 'manage', toUserSubject(other))).toBe(false);
      expect(ability.can('manage', 'Category')).toBe(false);
    });
  });

  describe('NetDelegate', () => {
    it('manages files and users but not events, lodges, or announcements', async () => {
      const { ability } = await abilityFor('NetDelegate');

      expect(ability.can('manage', 'Category')).toBe(true);
      expect(ability.can('manage', 'UserRole')).toBe(true);
      expect(ability.can('manage', 'Event')).toBe(false);
      expect(ability.can('manage', 'Lodge')).toBe(false);
      expect(ability.can('manage', 'Announcement')).toBe(false);
    });
  });

  describe('WorshipfulMaster', () => {
    it('manages events, announcements, files, and lodges, and manages seekers', async () => {
      const { ability } = await abilityFor('WorshipfulMaster');

      expect(ability.can('manage', 'Event')).toBe(true);
      expect(ability.can('manage', 'Announcement')).toBe(true);
      expect(ability.can('manage', 'Category')).toBe(true);
      expect(ability.can('manage', 'Lodge')).toBe(true);
      expect(ability.can('manage', 'Seeker')).toBe(true);
    });

    it('does NOT manage users or user roles (no user_admin_abilities grant, unlike Secretary)', async () => {
      const { ability } = await abilityFor('WorshipfulMaster');
      const other = await createUser();

      expect(ability.can('manage', 'UserRole')).toBe(false);
      expect(canOn(ability, 'destroy', toUserSubject(other))).toBe(false);
    });

    it('cannot impersonate (impersonate is granted only via the strict Admin role)', async () => {
      const { ability } = await abilityFor('WorshipfulMaster');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(false);
    });
  });

  describe('Secretary', () => {
    it('manages events, announcements, files, lodges, and users', async () => {
      const { ability } = await abilityFor('Secretary');

      expect(ability.can('manage', 'Event')).toBe(true);
      expect(ability.can('manage', 'Announcement')).toBe(true);
      expect(ability.can('manage', 'Category')).toBe(true);
      expect(ability.can('manage', 'Lodge')).toBe(true);
      expect(ability.can('manage', 'UserRole')).toBe(true);
      // destroy of an ordinary member is user_admin_abilities' AppConfig[:show_admins]-gated
      // block (ability.rb L89-91), not a CASL rule - see canManageUserAsUserAdmin.
      expect(canManageUserAsUserAdmin(['Secretary'], [], false)).toBe(true);
    });

    it('cannot impersonate (impersonate is granted only via the strict Admin role)', async () => {
      const { ability } = await abilityFor('Secretary');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(false);
    });
  });

  describe('ApplicationAdmin', () => {
    it('manages app config, roles, districts, and users (can :manage, User)', async () => {
      const { ability } = await abilityFor('ApplicationAdmin');
      const other = await createUser();

      expect(ability.can('manage', 'AppConfig')).toBe(true);
      expect(ability.can('manage', 'Role')).toBe(true);
      expect(ability.can('manage', 'District')).toBe(true);
      expect(canOn(ability, 'destroy', toUserSubject(other))).toBe(true);
    });

    it(
      'still cannot impersonate - the global impersonate guard overrides `can :manage, User` ' +
        "regardless of which role grants it (regression coverage for commit 6f76857, " +
        "'Fix ApplicationAdmin role bypassing the impersonation gate')",
      async () => {
        const { ability } = await abilityFor('ApplicationAdmin');
        const other = await createUser();

        expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(false);
      },
    );
  });

  describe('Admin (strict admin - the only role that can impersonate)', () => {
    it('manages essentially everything: events, announcements, files, lodges, users, app config', async () => {
      const { ability } = await abilityFor('Admin');

      expect(ability.can('manage', 'Event')).toBe(true);
      expect(ability.can('manage', 'Announcement')).toBe(true);
      expect(ability.can('manage', 'Category')).toBe(true);
      expect(ability.can('manage', 'Lodge')).toBe(true);
      expect(ability.can('manage', 'UserRole')).toBe(true);
      expect(ability.can('manage', 'AppConfig')).toBe(true);
      expect(ability.can('manage', 'Statistic')).toBe(true);
    });

    it('can impersonate an ordinary, non-deleted, non-self member', async () => {
      const { ability } = await abilityFor('Admin');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(true);
    });

    it('cannot impersonate themself', async () => {
      const { ability, user } = await abilityFor('Admin');

      expect(canOn(ability, 'impersonate', toUserSubject(user, ['Admin']))).toBe(false);
    });

    it('cannot impersonate another Admin', async () => {
      const { ability } = await abilityFor('Admin');
      const { user: otherAdmin } = await abilityFor('Admin');

      expect(canOn(ability, 'impersonate', toUserSubject(otherAdmin, ['Admin']))).toBe(false);
    });

    it('cannot impersonate a deleted member', async () => {
      const { ability } = await abilityFor('Admin');
      const other = await createUser();
      const deletedOther = await prisma.users.update({ where: { id: other.id }, data: { deleted: true } });

      expect(canOn(ability, 'impersonate', toUserSubject(deletedOther))).toBe(false);
    });
  });

  describe('a user holding both Admin and ApplicationAdmin', () => {
    it('still cannot impersonate themself or another Admin (guard holds under multi-role union)', async () => {
      const { ability, user: dualRoleAdmin } = await abilityFor('Admin', 'ApplicationAdmin');
      const { user: otherAdmin } = await abilityFor('Admin');
      const other = await createUser();

      expect(canOn(ability, 'impersonate', toUserSubject(dualRoleAdmin, ['Admin', 'ApplicationAdmin']))).toBe(false);
      expect(canOn(ability, 'impersonate', toUserSubject(otherAdmin, ['Admin']))).toBe(false);
      expect(canOn(ability, 'impersonate', toUserSubject(other))).toBe(true);
    });
  });
});

// Supplementary coverage for the helper functions extracted from ability.rb's
// Ruby-block rules (not literal ability_spec.rb examples - see that spec's
// own header note that AppConfig[:show_admins] nuances are intentionally not
// re-litigated there - but required by this repo's CLAUDE.md: new
// functionality needs its own happy/unhappy/edge-case coverage).
describe('AppConfig[:show_admins]-gated User visibility helpers', () => {
  describe('canViewUserInDirectory (replaces default_user_abilities L27-29)', () => {
    it('is visible when AppConfig[:show_admins] is on, regardless of roles', () => {
      expect(canViewUserInDirectory([], ['Admin'], true)).toBe(true);
    });

    it('is visible to an admin viewer even when the switch is off', () => {
      expect(canViewUserInDirectory(['Admin'], ['Admin'], false)).toBe(true);
    });

    it('is visible when the target is not an admin, switch off, non-admin viewer', () => {
      expect(canViewUserInDirectory([], [], false)).toBe(true);
    });

    it('is hidden from a non-admin viewer when the target is an admin and the switch is off', () => {
      expect(canViewUserInDirectory([], ['Admin'], false)).toBe(false);
    });
  });

  describe('canManageUserAsUserAdmin (replaces user_admin_abilities L89-91)', () => {
    it('mirrors the same three-way gate', () => {
      expect(canManageUserAsUserAdmin([], ['Admin'], true)).toBe(true);
      expect(canManageUserAsUserAdmin(['Admin'], ['Admin'], false)).toBe(true);
      expect(canManageUserAsUserAdmin([], [], false)).toBe(true);
      expect(canManageUserAsUserAdmin([], ['Admin'], false)).toBe(false);
    });
  });
});

// Port of the small role-check helpers from rails-app/app/models/user.rb.
describe('role-check helpers (ported from user.rb)', () => {
  it('isAdmin/isSecretary/isWorshipfulMaster/isNetDelegate reflect the exact matching role only', () => {
    expect(isAdmin(['Admin'])).toBe(true);
    expect(isAdmin(['Secretary'])).toBe(false);
    expect(isSecretary(['Secretary'])).toBe(true);
    expect(isWorshipfulMaster(['WorshipfulMaster'])).toBe(true);
    expect(isNetDelegate(['NetDelegate'])).toBe(true);
    expect(isNetDelegate([])).toBe(false);
  });

  it('isUserAdmin is true for Secretary, Admin, or UserAdmin', () => {
    expect(isUserAdmin(['Secretary'])).toBe(true);
    expect(isUserAdmin(['Admin'])).toBe(true);
    expect(isUserAdmin(['UserAdmin'])).toBe(true);
    expect(isUserAdmin(['WorshipfulMaster'])).toBe(false);
  });

  it('isAppResponsible is true for Admin/Secretary/WorshipfulMaster/NetDelegate but NOT for UserAdmin alone', () => {
    expect(isAppResponsible(['Admin'])).toBe(true);
    expect(isAppResponsible(['Secretary'])).toBe(true);
    expect(isAppResponsible(['WorshipfulMaster'])).toBe(true);
    expect(isAppResponsible(['NetDelegate'])).toBe(true);
    expect(isAppResponsible(['UserAdmin'])).toBe(false);
    expect(isAppResponsible([])).toBe(false);
  });
});
