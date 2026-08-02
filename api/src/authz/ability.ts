import { AbilityBuilder, createMongoAbility, subject, type MongoAbility, type MongoQuery } from '@casl/ability';

import type { users } from '../generated/prisma/client.js';

import { prisma } from '../db.js';

/**
 * Port of rails-app/app/models/ability.rb (CanCan) to CASL.
 *
 * Every action symbol that appears anywhere in ability.rb, gathered in one
 * place so rule declarations below can be checked against a closed set.
 */
export type Action =
  | 'manage'
  | 'google_sync'
  | 'create_google_contact'
  | 'update_google_contact'
  | 'show'
  | 'edit'
  | 'update'
  | 'update_announcement_subscription'
  | 'update_password'
  | 'create'
  | 'index'
  | 'add_me'
  | 'remove_me'
  | 'upcoming'
  | 'date'
  | 'public_workingplan'
  | 'internal_workingplan'
  | 'download'
  | 'members_list'
  | 'phone_list'
  | 'birthday_list'
  | 'members_of_council'
  | 'file_io_link'
  | 'file_stats'
  | 'mem_stats'
  | 'downloads'
  | 'destroy'
  | 'csv_export'
  | 'user_stats'
  | 'user_file_stats'
  | 'space_stats'
  | 'accepted'
  | 'inactive'
  | 'declined'
  | 'workingplan'
  | 'accept_gdpr'
  | 'impersonate';

/** Every subject (model) referenced anywhere in ability.rb. */
export type SubjectName =
  | 'User'
  | 'EventParticipant'
  | 'ExternalEventParticipant'
  | 'Announcement'
  | 'ExternalEvent'
  | 'AcademicTitle'
  | 'Event'
  | 'Category'
  | 'Directory'
  | 'AttachedFile'
  | 'Statistic'
  | 'UserRole'
  | 'Seeker'
  | 'AppConfig'
  | 'District'
  | 'Role'
  | 'Lodge'
  | 'Officer'
  | 'all';

// The 2nd type param constrains the shape `can`/`cannot` conditions can take.
// CASL's default per-subject inference needs each subject to be a real class
// or a `ForcedSubject`-tagged interface to type conditions precisely; our
// subjects are plain Prisma rows checked via the `subject()` helper (see
// toUserSubject below), so a single permissive Record shape is used across
// every subject instead of maintaining a parallel per-subject type map.
export type AppAbility = MongoAbility<[Action, SubjectName], MongoQuery<Record<string, unknown>>>;

/**
 * `AbilityBuilder<AppAbility>#can`/`#cannot` are typed with an elaborate
 * per-subject conditions overload (see `AddRule` in @casl/ability's own
 * types) that's built around subjects being real classes or
 * `ForcedSubject`-tagged interfaces. With plain-string subjects like ours it
 * collapses every conditions object down to `MongoQuery<never>` regardless of
 * the `AppAbility` conditions type param above, i.e. it rejects any
 * conditions at all. This narrower, hand-written signature is what the
 * runtime functions actually accept (a plain conditions object, same as
 * every `can(...)`/`cannot(...)` call in ability.rb) - the cast at
 * `buildAbility`'s `new AbilityBuilder(...)` call below is the one place
 * that bridges the two.
 */
interface Grant {
  can(action: Action | Action[], subjectType: SubjectName | SubjectName[], conditions?: Record<string, unknown>): void;
  cannot(action: Action | Action[], subjectType: SubjectName | SubjectName[], conditions?: Record<string, unknown>): void;
}

/** A subset of `users` fields needed to test the User-targeting rules below. */
type UserLike = Pick<users, 'id'>;

// ---------------------------------------------------------------------------
// Small role-check helpers, ported from rails-app/app/models/user.rb.
//
// Rails compares against `Role.find_by_name(...)` AR objects; since role
// names are the stable identifier of a role in this system, comparing by
// name (rather than re-fetching a Role row) is behaviorally equivalent and
// avoids a DB round trip in every check.
// ---------------------------------------------------------------------------

function hasRole(roleNames: readonly string[], name: string): boolean {
  return roleNames.includes(name);
}

/** Port of User#admin?. */
export function isAdmin(roleNames: readonly string[]): boolean {
  return hasRole(roleNames, 'Admin');
}

/** Port of User#secretary?. */
export function isSecretary(roleNames: readonly string[]): boolean {
  return hasRole(roleNames, 'Secretary');
}

/** Port of User#worshipful_master?. */
export function isWorshipfulMaster(roleNames: readonly string[]): boolean {
  return hasRole(roleNames, 'WorshipfulMaster');
}

/** Port of User#net_delegate?. */
export function isNetDelegate(roleNames: readonly string[]): boolean {
  return hasRole(roleNames, 'NetDelegate');
}

/** Port of User#user_admin?. */
export function isUserAdmin(roleNames: readonly string[]): boolean {
  if (isSecretary(roleNames) || isAdmin(roleNames)) {
    return true;
  }
  return hasRole(roleNames, 'UserAdmin');
}

/** Port of User#app_responsible?. */
export function isAppResponsible(roleNames: readonly string[]): boolean {
  return isAdmin(roleNames) || isSecretary(roleNames) || isWorshipfulMaster(roleNames) || isNetDelegate(roleNames);
}

// ---------------------------------------------------------------------------
// Helper functions for rules that ability.rb expresses as Ruby blocks with
// arbitrary logic (role-set overlap, or an AppConfig lookup) rather than a
// plain CanCan conditions hash. CASL's `conditions` parameter only supports
// declarative MongoDB-style field matching, so - exactly like the Rails
// controllers already split SQL-expressible `accessible_by` conditions from
// manual Ruby-block filtering - these are ported as plain functions that
// route handlers call directly instead of ability.can()/ability.cannot().
// ---------------------------------------------------------------------------

function rolesOverlap(userRoleIds: readonly number[], targetRoleIds: readonly number[]): boolean {
  return userRoleIds.some((id) => targetRoleIds.includes(id));
}

// Replaces default_user_abilities' `can [:index, :show], Category, [...] do |c|
// [] != (c.roles & @user.roles) end` block (ability.rb L15-17).
export function canViewCategory(userRoleIds: readonly number[], categoryRoleIds: readonly number[]): boolean {
  return rolesOverlap(userRoleIds, categoryRoleIds);
}

// Replaces default_user_abilities' Directory analogue of the same rule (ability.rb L18-20).
export function canViewDirectory(userRoleIds: readonly number[], directoryRoleIds: readonly number[]): boolean {
  return rolesOverlap(userRoleIds, directoryRoleIds);
}

// Replaces default_user_abilities' AttachedFile analogue of the same rule (ability.rb L21-23).
export function canViewAttachedFile(userRoleIds: readonly number[], attachedFileRoleIds: readonly number[]): boolean {
  return rolesOverlap(userRoleIds, attachedFileRoleIds);
}

function canSeeAdminAccount(currentUserRoleNames: readonly string[], targetRoleNames: readonly string[], showAdmins: boolean): boolean {
  return showAdmins || isAdmin(currentUserRoleNames) || !isAdmin(targetRoleNames);
}

// Replaces default_user_abilities' `can [:index, :show, :members_list, :phone_list,
// :birthday_list, :members_of_council, :file_io_link], User, [...] do |u|
// AppConfig[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
// end` block (ability.rb L27-29).
export function canViewUserInDirectory(
  currentUserRoleNames: readonly string[],
  targetRoleNames: readonly string[],
  showAdmins: boolean,
): boolean {
  return canSeeAdminAccount(currentUserRoleNames, targetRoleNames, showAdmins);
}

// Replaces user_admin_abilities' `can [:index, :show, :members_list, :phone_list,
// :birthday_list, :edit, :update, :destroy, :create, :csv_export], User, [...] do |u|
// AppConfig[:show_admins] || @user.admin? || !u.admin? end` block (ability.rb L89-91).
export function canManageUserAsUserAdmin(
  currentUserRoleNames: readonly string[],
  targetRoleNames: readonly string[],
  showAdmins: boolean,
): boolean {
  return canSeeAdminAccount(currentUserRoleNames, targetRoleNames, showAdmins);
}

/**
 * Tags a plain `users` row as a CASL `User` subject. CASL detects a plain
 * object's subject type from `object.constructor.name` unless it's been
 * explicitly tagged (see the `subject` helper's docs) - a bare Prisma `users`
 * row has `constructor === Object`, so every instance-level `User` check
 * (self-vs-other, impersonate, ...) must go through this, not the raw row.
 *
 * Also adds the `admin` flag the final `cannot :impersonate` guard needs.
 * `admin` isn't a real `users` column (admin-ness comes from the roles join
 * table), so unlike `id`/`deleted` it has to be computed by the caller before
 * the check - this is that computation, done once here rather than at every
 * call site. `roleNames` defaults to `[]` for checks that don't care about
 * admin-ness (e.g. the plain self-vs-other checks).
 */
export function toUserSubject(user: users, roleNames: readonly string[] = []) {
  return subject('User', { ...user, admin: isAdmin(roleNames) });
}

// ---------------------------------------------------------------------------
// Per-role rule sets, ported 1:1 from ability.rb's `*_abilities` methods.
// Cross-calls between these functions mirror the Ruby methods' cross-calls
// exactly (e.g. adminAbilities calling secretaryAbilities etc.) so the same
// grants end up registered regardless of which of a user's roles happens to
// be processed "first" - order only matters for the trailing impersonate
// guard in buildAbility, which is why that one is applied last, always.
// ---------------------------------------------------------------------------

/** Port of Ability#default_user_abilities (ability.rb L4-31). */
function defaultUserAbilities({ can }: Grant, user: UserLike): void {
  can(['google_sync', 'create_google_contact', 'update_google_contact'], 'User');
  can(['show', 'edit', 'update', 'update_announcement_subscription', 'update_password'], 'User', { id: user.id });
  can(['show', 'create', 'edit', 'update'], 'EventParticipant', { user_id: user.id });
  can(['show', 'create', 'edit', 'update'], 'ExternalEventParticipant', { user_id: user.id });
  can(['index', 'show'], 'Announcement');
  can(['index', 'show'], 'ExternalEvent');
  can(['show'], 'AcademicTitle');
  can(['add_me', 'remove_me'], 'Event', { user_id: user.id });
  can(['add_me', 'remove_me'], 'ExternalEvent', { user_id: user.id });
  can(['index', 'show', 'upcoming', 'date', 'public_workingplan', 'internal_workingplan'], 'Event');
  // Category/Directory/AttachedFile role-overlap visibility (ability.rb
  // L15-23) and the AppConfig[:show_admins]-gated User visibility rule
  // (ability.rb L27-29) are Ruby blocks, not CanCan conditions hashes - see
  // canViewCategory/canViewDirectory/canViewAttachedFile/canViewUserInDirectory
  // above; route handlers call those directly instead of ability.can().
  can(['index', 'file_stats', 'mem_stats', 'downloads'], 'Statistic');
}

/** Port of Ability#file_admin_abilities (ability.rb L82-86). */
function fileAdminAbilities({ can }: Grant): void {
  can('manage', 'Category');
  can('manage', 'Directory');
  can('manage', 'AttachedFile');
}

/** Port of Ability#user_admin_abilities (ability.rb L88-93). */
function userAdminAbilities({ can }: Grant): void {
  // The index/show/edit/update/destroy/create/csv_export grant (ability.rb
  // L89-91) is the AppConfig[:show_admins]-gated block - see
  // canManageUserAsUserAdmin above; route handlers call that directly.
  can('manage', 'UserRole');
}

/** Port of Ability#working_plan_admin_abilities (ability.rb L127-132). */
function workingPlanAdminAbilities({ can }: Grant): void {
  can('manage', 'Event');
  can('manage', 'EventParticipant');
  can('manage', 'ExternalEvent');
  can('manage', 'ExternalEventParticipant');
}

/** Port of Ability#lodges_admin_abilites (ability.rb L134-137). */
function lodgesAdminAbilities({ can }: Grant): void {
  can('manage', 'Lodge');
  can('manage', 'Officer');
}

/** Port of Ability#announcement_admin_abilities (ability.rb L153-155). */
function announcementAdminAbilities({ can }: Grant): void {
  can('manage', 'Announcement');
}

/** Port of Ability#application_admin_abilities (ability.rb L140-151). */
function applicationAdminAbilities({ can }: Grant): void {
  can('manage', 'AppConfig');
  can('manage', 'AcademicTitle');
  can('manage', 'District');
  can('manage', 'Role');
  can('manage', 'User');
  can('manage', 'Category');
  can('manage', 'Lodge');
  can('manage', 'Officer');
  can('manage', 'Event');
  can('manage', 'ExternalEvent');
}

/** Port of Ability#member_of_council_abilities (ability.rb L75-79). */
function memberOfCouncilAbilities({ can }: Grant): void {
  can(['index', 'file_stats', 'user_stats', 'user_file_stats', 'space_stats'], 'Statistic');
  can(['csv_export'], 'User');
  can(['index', 'show', 'accepted', 'inactive', 'declined'], 'Seeker');
}

/** Port of Ability#worshipful_master_abilities (ability.rb L59-65). */
function worshipfulMasterAbilities(grant: Grant): void {
  workingPlanAdminAbilities(grant);
  announcementAdminAbilities(grant);
  fileAdminAbilities(grant);
  lodgesAdminAbilities(grant);
  grant.can('manage', 'Seeker');
}

/** Port of Ability#net_delegate_abilities (ability.rb L68-72). */
function netDelegateAbilities(grant: Grant): void {
  fileAdminAbilities(grant);
  userAdminAbilities(grant);
  grant.can('manage', 'Statistic');
}

/** Port of Ability#secretary_abilities (ability.rb L49-56). */
function secretaryAbilities(grant: Grant): void {
  workingPlanAdminAbilities(grant);
  announcementAdminAbilities(grant);
  lodgesAdminAbilities(grant);
  fileAdminAbilities(grant);
  userAdminAbilities(grant);
  grant.can('manage', 'Statistic');
}

/** Port of Ability#admin_abilities (ability.rb L34-46). */
function adminAbilities(grant: Grant): void {
  worshipfulMasterAbilities(grant);
  secretaryAbilities(grant);
  netDelegateAbilities(grant);
  userAdminAbilities(grant);
  applicationAdminAbilities(grant);
  memberOfCouncilAbilities(grant);
  grant.can('manage', 'Statistic');
  // The actual restriction (strict-Admin-only, valid-target-only) is enforced
  // globally by buildAbility's trailing `cannot` below - see the comment
  // there for why it can't live here.
  grant.can(['impersonate'], 'User');
}

/** Port of Ability#entered_apprentice_abilities (ability.rb L158-160). */
function enteredApprenticeAbilities(grant: Grant, user: UserLike): void {
  defaultUserAbilities(grant, user);
}

/** Port of Ability#fellow_craft_abilities (ability.rb L163-166). */
function fellowCraftAbilities(grant: Grant, user: UserLike): void {
  enteredApprenticeAbilities(grant, user);
}

/** Port of Ability#master_mason_abilities (ability.rb L169-171). */
function masterMasonAbilities(grant: Grant, user: UserLike): void {
  fellowCraftAbilities(grant, user);
}

/**
 * Dispatch table mirroring `Ability#initialize`'s `method = :"#{role.name.underscore}_abilities";
 * self.send(method) if self.respond_to?(method)` (ability.rb L101-104).
 * TypeScript has no equivalent of dynamic method dispatch + respond_to?, so
 * this maps each real role name straight to its handler - functionally the
 * same outcome (a known role name invokes its abilities method; an unknown
 * one is a no-op) without needing to reimplement Rails' `String#underscore`.
 */
const ROLE_ABILITY_BUILDERS: Record<string, (grant: Grant, user: UserLike) => void> = {
  Admin: (grant) => adminAbilities(grant),
  Secretary: (grant) => secretaryAbilities(grant),
  WorshipfulMaster: (grant) => worshipfulMasterAbilities(grant),
  NetDelegate: (grant) => netDelegateAbilities(grant),
  MemberOfCouncil: (grant) => memberOfCouncilAbilities(grant),
  FileAdmin: (grant) => fileAdminAbilities(grant),
  UserAdmin: (grant) => userAdminAbilities(grant),
  WorkingPlanAdmin: (grant) => workingPlanAdminAbilities(grant),
  ApplicationAdmin: (grant) => applicationAdminAbilities(grant),
  AnnouncementAdmin: (grant) => announcementAdminAbilities(grant),
  EnteredApprentice: enteredApprenticeAbilities,
  FellowCraft: fellowCraftAbilities,
  MasterMason: masterMasonAbilities,
};

/**
 * Port of Ability#initialize (ability.rb L95-125).
 *
 * `roleNames` is the caller-supplied list of role names the user currently
 * holds (Prisma models `user_roles`/`roles` as plain join tables with no
 * relation back onto `users`, so this can't be read off `user` itself - see
 * loadUserRoleNames below for the canonical way to fetch it).
 */
export function buildAbility(user: users | null | undefined, roleNames: readonly string[] = []): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  // See the `Grant` interface's doc comment for why this cast is here.
  const can = builder.can as Grant['can'];
  const cannot = builder.cannot as Grant['cannot'];
  const { build } = builder;

  can('workingplan', 'Event');

  if (!user) {
    return build();
  }

  can('accept_gdpr', 'User', { id: user.id });

  for (const roleName of roleNames) {
    ROLE_ABILITY_BUILDERS[roleName]?.({ can, cannot }, user);
  }

  // Global, always-last-defined guard for :impersonate (ability.rb L106-124).
  // CASL resolves can?/cannot? the same way CanCan does - by scanning rules
  // most-recently-defined-first and stopping at the first match - so a
  // role-method-local `cannot` could be silently outranked by a *later*
  // unconditional `can` granted by a *different* role method reached via a
  // *different* role the same user holds (e.g. applicationAdminAbilities'
  // `can('manage', 'User')`, reachable directly via the independently-
  // assignable ApplicationAdmin role, with no carve-out of its own). Adding
  // this guard here, after every role's rules have already been registered,
  // guarantees it is always the most-recently-added rule for this
  // action/subject - regardless of which roles the user holds or what order
  // roleNames is in - so it always wins.
  //
  // Ruby expressed the four denial conditions as one `do |u| ... end` block
  // (`!@user.admin? || u.deleted? || u.id == @user.id || u.admin?`); CASL's
  // conditions matcher has no top-level `$or` in its default operator set,
  // so instead of one OR'd condition object, each disjunct becomes its own
  // `cannot` rule. That is equivalent: CASL scans rules newest-first and
  // stops at the first match, so if *any* of these three later rules matches
  // the target, it (not the earlier `can`) is the first match and denies -
  // exactly the OR semantics of the original block.
  if (!isAdmin(roleNames)) {
    cannot(['impersonate'], 'User');
  } else {
    cannot(['impersonate'], 'User', { deleted: true });
    cannot(['impersonate'], 'User', { id: user.id });
    cannot(['impersonate'], 'User', { admin: true });
  }

  return build();
}

/**
 * Fetches the role names a user currently holds. `user_roles`/`roles` have no
 * Prisma relation back onto `users` (plain join-table FKs - see
 * schema.prisma), so this is a small manual two-step join rather than a
 * Prisma `include`.
 */
export async function loadUserRoleNames(userId: number): Promise<string[]> {
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: userId },
    select: { role_id: true },
  });
  const roleIds = userRoles.map((userRole) => userRole.role_id).filter((id): id is number => id !== null);
  if (roleIds.length === 0) {
    return [];
  }

  const roleRows = await prisma.roles.findMany({
    where: { id: { in: roleIds } },
    select: { name: true },
  });
  return roleRows.map((role) => role.name).filter((name): name is string => name !== null);
}
