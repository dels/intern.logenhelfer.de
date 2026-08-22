import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import type { addresses as AddressRow, users as UserRow } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';

import { authenticateApiUser } from '../auth/middleware.js';
import { issueAccessToken } from '../auth/jwt.js';
import { revokeAllFamiliesForUser } from '../auth/refreshToken.js';
import type { Action, AppAbility } from '../authz/ability.js';
import { canManageUserAsUserAdmin, canViewUserInDirectory, isAdmin, isUserAdmin, loadUserRoleNames, toUserSubject } from '../authz/ability.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { getMfaSettings } from '../lib/mfaSettings.js';
import { getUsersWithVerifiedMfa, userHasVerifiedMfa } from '../lib/mfaStatus.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { prisma } from '../db.js';
import { generateUniqueUuid } from '../lib/uuid.js';
import { syncUserMobile } from '../lib/userMobile.js';

/**
 * Port of rails-app/app/controllers/api/v1/members_controller.rb - the
 * largest and most complex v1 controller (449 lines) in this migration.
 *
 * ## The ability.ts gap this file works around
 *
 * ability.ts deliberately never registers CASL rules for the block-
 * conditioned grants in Ability#default_user_abilities (`:members_list`,
 * `:phone_list`, `:birthday_list`, `:members_of_council`, and the `:show`/
 * `:index` visibility block) or Ability#user_admin_abilities (`:members_list`,
 * `:phone_list`, `:birthday_list`, `:edit`, `:update`, `:destroy`, `:create`) -
 * see canViewUserInDirectory/canManageUserAsUserAdmin's doc comments in
 * ability.ts, and directories.ts/roles.ts for the same pattern applied to
 * Directory/Role. Those two Ruby blocks reduce to the exact same boolean
 * (`AppConfig[:show_admins] || <caller is admin> || <target is not admin>`) -
 * canViewUserInDirectory and canManageUserAsUserAdmin are the same function
 * under two names, kept distinct only to mirror which Ruby method each
 * Rails call site actually reads from.
 *
 * What's missing is *reachability*: whether the calling user holds a role
 * that reaches `default_user_abilities` (EnteredApprentice/FellowCraft/
 * MasterMason, or transitively via any `can(:manage, User)` grant) or
 * `user_admin_abilities` (UserAdmin/Secretary/NetDelegate, or transitively
 * via Admin). Since ability.ts never registered those two Ruby methods'
 * User-subject grants as CASL rules, there's no `ability.can(...)` call that
 * reports reachability directly - so this file detects it via two rules
 * ability.ts *does* fully register unconditionally for exactly those role
 * sets (same trick roles.ts uses for `can('manage', 'UserRole')`):
 *
 *   - reachesDefaultUserAbilities: `ability.can('google_sync', 'User')` -
 *     `:google_sync` is a real, unconditional default_user_abilities grant,
 *     true for EnteredApprentice/FellowCraft/MasterMason, and also true for
 *     Admin/ApplicationAdmin (CASL's `manage` wildcard matches any action).
 *   - reachesUserAdminAbilities: `ability.can('manage', 'UserRole')` -
 *     user_admin_abilities' one unconditional grant, true for UserAdmin/
 *     Secretary/NetDelegate/Admin, false for ApplicationAdmin (which never
 *     calls user_admin_abilities in ability.rb).
 *
 * Per-instance checks then compose `ability.can(action, toUserSubject(...))`
 * (which already correctly resolves self-only and `manage(User)` grants)
 * with `reach && canViewUserInDirectory(...)` for the block-conditioned
 * remainder - see `visible` below. Class-level ability checks (no target
 * instance - `:create`, and the `phone_list`/`birthday_list`/`members_list`/
 * `members_of_council`/`csv_export` 403 gates) ignore the block entirely
 * (matching CanCan's own class-level semantics), so those use the reach
 * flags directly with no AppConfig involvement - see the `can*Class` helpers.
 *
 * IMPORTANT: `editable_fields` (ADMIN_FIELDS vs LIMITED_FIELDS) is gated on
 * `isUserAdmin` (Secretary/Admin/UserAdmin) - deliberately NOT the same set as
 * `reachesUserAdminAbilities` (which also includes NetDelegate). This is
 * exactly the asymmetry the Rails controller's own comment on
 * `editable_fields` warns about for UserAdmin (fixed there) - NetDelegate
 * still has the bug: a NetDelegate-only caller passes the `:create` ability
 * check (via `reachesUserAdminAbilities`) but gets `LIMITED_FIELDS` (via
 * `isUserAdmin` = false), so `member_params` never permits firstname/
 * lastname/date_of_birth/matriculation_number and the create always 422s.
 * Replicated faithfully, not fixed - see this task's final report.
 */

const SORTABLE_COLUMNS = ['lastname', 'firstname', 'matriculation_number', 'email'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT: SortableColumn = 'lastname';

const ADMIN_FIELDS = [
  'email',
  'firstname',
  'lastname',
  'date_of_birth',
  'matriculation_number',
  'job_title',
  'mobile',
  'entered_apprentice_since',
  'fellow_craft_since',
  'master_mason_since',
  'mother_lodge',
  'accepted_at',
  'role_ids',
  'addresses',
] as const;
// `email` was added to LIMITED_FIELDS deliberately, to support self-service
// account editing (a caller updating their own record via
// `PATCH /api/v1/members/:uuid`) - this is a product change on top of the
// Rails port, not part of the ADMIN_FIELDS/LIMITED_FIELDS fidelity split
// documented above. `mobile` (Task 3, users.mobile) follows the exact same
// self-service-plus-admin pattern as `job_title`/`email` - a plain,
// directly-settable string-or-null scalar, present in both lists. Note it's
// also silently overwritten by `syncUserMobile` on the next address write
// for this user - see that function's own doc comment.
const LIMITED_FIELDS = ['job_title', 'mobile', 'addresses', 'email'] as const;

const DEGREE_ROLE_NAMES = ['EnteredApprentice', 'FellowCraft', 'MasterMason'] as const;

const BCRYPT_COST = 12;

// Ported verbatim from rails-app/config/locales/de.yml's activerecord.errors
// keys (see User#validate_* / #fellow_craft_since= / #master_mason_since= /
// #set_degree_by_name). `must_be_fellow_craft_to_become_master` is used by
// BOTH the fellow_craft_since= and master_mason_since= guards in the Rails
// source (a real copy-paste bug - the fellow_craft_since= guard's message
// talks about becoming a Master, not a Fellow Craft) - replicated verbatim,
// flagged in this task's final report rather than "fixed" here.
const MSG_MUST_BE_FELLOW_CRAFT_TO_BECOME_MASTER = 'Um Meister zu werden muss der Benutzer erst Geselle sein.';
const MSG_MAX_BUSINESS_ADDRESSES = 'Es darf nur eine geschäftliche Adresse geben.';
const MSG_MAX_PRIVATE_ADDRESSES = 'Es darf nur eine private Adresse geben.';
const MSG_MOTHER_LODGE_ACCEPTED_AT = 'Mutterloge und angenommen an müssen beide leer oder ausgefüllt.';
const MSG_MUST_BE_ENTERED_APPRENTICE = 'Du musst das Datum der Aufnahme des Bruders angeben.';
function msgRoleNotFound(role: string): string {
  return `Die Rolle "${role}" existiert nicht in diesem System.`;
}

const router = Router();

router.use(authenticateApiUser);

// --- small Ruby-semantics helpers -------------------------------------------

/** Port of Ruby's `#present?` (used by `date.blank?` guards in User's degree setters). */
function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parses a `YYYY-MM-DD` request value into a UTC-midnight Date for a `@db.Date` column. */
function parseDateOnly(value: unknown): Date {
  return new Date(String(value));
}

/**
 * `AppAbility#can`'s subject parameter needs the `subject('User', {...})`-
 * tagged shape to accept a `toUserSubject(...)` value - see me.ts's
 * `InstanceAbilityProbe` for the identical file-boundary rationale (this
 * task can't widen ability.ts's own exported types).
 */
interface InstanceAbilityProbe {
  can(action: Action, subject: object): boolean;
}

function canOn(ability: AppAbility, action: Action, target: UserRow, targetRoleNames: readonly string[]): boolean {
  return (ability as unknown as InstanceAbilityProbe).can(action, toUserSubject(target, targetRoleNames));
}

/** See this file's header comment for why these two reach-flags exist. */
function reachesDefaultUserAbilities(ability: AppAbility): boolean {
  return ability.can('google_sync', 'User');
}
function reachesUserAdminAbilities(ability: AppAbility): boolean {
  return ability.can('manage', 'UserRole');
}

async function showAdminsConfig(): Promise<boolean> {
  return (await appConfig.get('show_admins')) === true;
}

// --- per-instance visibility (mirrors `ability.cannot?(:action, u)`) -------

interface VisibilityContext {
  ability: AppAbility;
  callerRoleNames: readonly string[];
  showAdmins: boolean;
}

/**
 * Both Ruby blocks this file works around (`default_user_abilities`' L27 and
 * `user_admin_abilities`' L89) pair their per-instance block with a
 * `["users.deleted = false"]` SQL condition - CanCan requires BOTH to match,
 * not just the block. `canOn`'s self-scope/`manage(User)` grants carry no
 * such condition in Ruby (self-scope: L6; `manage(User)`: application_admin_
 * abilities), so this only gates the `reach && canView...`-style fallback,
 * never the `canOn` branch.
 */
function isUndeleted(target: Pick<UserRow, 'deleted'>): boolean {
  return !target.deleted;
}

/** `:show` - used by #index's row filter, #show's 403 gate, and can_edit-style JSON fields. */
function canShowRow(ctx: VisibilityContext, target: UserRow, targetRoleNames: readonly string[]): boolean {
  if (canOn(ctx.ability, 'show', target, targetRoleNames)) return true;
  const reach = reachesDefaultUserAbilities(ctx.ability) || reachesUserAdminAbilities(ctx.ability);
  return reach && isUndeleted(target) && canViewUserInDirectory(ctx.callerRoleNames, targetRoleNames, ctx.showAdmins);
}

/** `:update` - default_user_abilities only ever grants this for self (already covered by `canOn`). */
function canUpdateRow(ctx: VisibilityContext, target: UserRow, targetRoleNames: readonly string[]): boolean {
  if (canOn(ctx.ability, 'update', target, targetRoleNames)) return true;
  return (
    reachesUserAdminAbilities(ctx.ability) &&
    isUndeleted(target) &&
    canManageUserAsUserAdmin(ctx.callerRoleNames, targetRoleNames, ctx.showAdmins)
  );
}

/** `:destroy` - default_user_abilities never grants this at all, not even for self. */
function canDestroyRow(ctx: VisibilityContext, target: UserRow, targetRoleNames: readonly string[]): boolean {
  if (canOn(ctx.ability, 'destroy', target, targetRoleNames)) return true;
  return (
    reachesUserAdminAbilities(ctx.ability) &&
    isUndeleted(target) &&
    canManageUserAsUserAdmin(ctx.callerRoleNames, targetRoleNames, ctx.showAdmins)
  );
}

/** `:members_list`/`:phone_list`/`:birthday_list` row filter - granted (with the same block) by both role chains. */
function canListRow(ctx: VisibilityContext, action: Action, target: UserRow, targetRoleNames: readonly string[]): boolean {
  if (canOn(ctx.ability, action, target, targetRoleNames)) return true;
  const reach = reachesDefaultUserAbilities(ctx.ability) || reachesUserAdminAbilities(ctx.ability);
  return reach && isUndeleted(target) && canViewUserInDirectory(ctx.callerRoleNames, targetRoleNames, ctx.showAdmins);
}

/** `:csv_export` row filter - only user_admin_abilities carries a block; member_of_council_abilities'/manage(User)'s grants are unconditional and already covered by `canOn`. */
function canCsvExportRow(ctx: VisibilityContext, target: UserRow, targetRoleNames: readonly string[]): boolean {
  if (canOn(ctx.ability, 'csv_export', target, targetRoleNames)) return true;
  return (
    reachesUserAdminAbilities(ctx.ability) &&
    isUndeleted(target) &&
    canManageUserAsUserAdmin(ctx.callerRoleNames, targetRoleNames, ctx.showAdmins)
  );
}

// --- class-level gates (mirror `ability.can?(:action, User)` - ignores blocks) ---

function canCreateClass(ability: AppAbility): boolean {
  return ability.can('create', 'User') || reachesUserAdminAbilities(ability);
}
function canMembersListClass(ability: AppAbility): boolean {
  return reachesDefaultUserAbilities(ability) || reachesUserAdminAbilities(ability);
}
function canMembersOfCouncilClass(ability: AppAbility): boolean {
  // user_admin_abilities' block list does NOT include :members_of_council -
  // only default_user_abilities (Entered/Fellow/Master, or manage(User)) does.
  return reachesDefaultUserAbilities(ability);
}
function canCsvExportClass(ability: AppAbility): boolean {
  return ability.can('csv_export', 'User') || reachesUserAdminAbilities(ability);
}

// --- role/address data loading -----------------------------------------------

interface RoleRow {
  roleId: number;
  name: string | null;
  displayName: string | null;
  roleAddedAt: Date | null;
  /** Mirrors roles.administrational_role (DB default true) - the same flag
   * GET /api/v1/roles's ?scope=positions|administrational and
   * MemberForm's role_ids editor ("Ämter" vs "Verwaltungsrollen") already
   * split on. Kept here so memberDetailJson's per-role `kind` can reuse
   * the identical distinction instead of re-deriving it from display names. */
  administrationalRole: boolean;
}

/** Batch-loads every role a set of users holds (one query pair, not N+1). */
async function loadRoleRowsForUsers(userIds: number[]): Promise<Map<number, RoleRow[]>> {
  const map = new Map<number, RoleRow[]>();
  if (userIds.length === 0) return map;

  const userRoles = await prisma.user_roles.findMany({ where: { user_id: { in: userIds } } });
  const roleIds = [...new Set(userRoles.map((ur) => ur.role_id).filter((id): id is number => id !== null))];
  const roles = roleIds.length > 0 ? await prisma.roles.findMany({ where: { id: { in: roleIds } } }) : [];
  const roleById = new Map(roles.map((r) => [r.id, r]));

  for (const ur of userRoles) {
    if (ur.user_id === null || ur.role_id === null) continue;
    const role = roleById.get(ur.role_id);
    const list = map.get(ur.user_id) ?? [];
    list.push({
      roleId: ur.role_id,
      name: role?.name ?? null,
      displayName: role?.display_name ?? null,
      roleAddedAt: ur.role_added_at,
      administrationalRole: role?.administrational_role ?? true,
    });
    map.set(ur.user_id, list);
  }
  return map;
}

async function loadRoleRowsForUser(userId: number): Promise<RoleRow[]> {
  const map = await loadRoleRowsForUsers([userId]);
  return map.get(userId) ?? [];
}

function roleNamesOf(rows: RoleRow[]): string[] {
  return rows.map((r) => r.name).filter((n): n is string => n !== null);
}

/** Port of `Role.positions.pluck(:id) + Role.administrational_roles.pluck(:id)` - the union is exactly "every role that isn't a degree". */
async function nonDegreeRoleIds(): Promise<number[]> {
  const rows = await prisma.roles.findMany({ where: { name: { notIn: [...DEGREE_ROLE_NAMES] } }, select: { id: true } });
  return rows.map((r) => r.id);
}

async function loadAddressesForUser(userId: number): Promise<AddressRow[]> {
  return prisma.addresses.findMany({ where: { addressable_id: userId, addressable_type: 'User', deleted: false }, orderBy: { id: 'asc' } });
}

/** Batch sibling of loadAddressesForUser - one query for a whole page's/list's worth of users instead of an N+1 loop, mirroring loadRoleRowsForUsers' grouping pattern. */
async function loadAddressesForUsers(userIds: number[]): Promise<Map<number, AddressRow[]>> {
  const map = new Map<number, AddressRow[]>();
  if (userIds.length === 0) return map;

  const addresses = await prisma.addresses.findMany({
    where: { addressable_id: { in: userIds }, addressable_type: 'User', deleted: false },
    orderBy: [{ addressable_id: 'asc' }, { id: 'asc' }],
  });
  for (const address of addresses) {
    if (address.addressable_id === null) continue;
    const list = map.get(address.addressable_id) ?? [];
    list.push(address);
    map.set(address.addressable_id, list);
  }
  return map;
}

// --- address JSON / domain helpers (port of app/models/address.rb) --------

const ADDRESS_TYPE_PRIVATE = 0;
const ADDRESS_TYPE_BUSINESS = 1;

/** Port of Address#purpose - private/business ignore the stored value entirely and return the translated type name; only "other"/blank falls back to the raw column. */
function addressPurpose(address: Pick<AddressRow, 'type_of_address' | 'purpose'>): string {
  if (address.type_of_address === ADDRESS_TYPE_PRIVATE) return 'Privat';
  if (address.type_of_address === ADDRESS_TYPE_BUSINESS) return 'Geschäftlich';
  return address.purpose ?? '';
}

/** Port of Address#vcf_type. */
function addressVcfType(address: Pick<AddressRow, 'type_of_address' | 'purpose'>): string {
  if (address.type_of_address === ADDRESS_TYPE_PRIVATE) return 'home';
  if (address.type_of_address === ADDRESS_TYPE_BUSINESS) return 'work';
  return addressPurpose(address);
}

/** Port of Address#street - joins the three street lines with newlines, then strips. */
function addressStreet(address: Pick<AddressRow, 'street1' | 'street2' | 'street3'>): string {
  return [address.street1, address.street2, address.street3]
    .filter((v): v is string => v !== null && v !== undefined)
    .join('\n')
    .trim();
}

function addressJson(address: AddressRow): {
  id: number;
  type_of_address: number | null;
  purpose: string;
  street: string;
  zip: string | null;
  city: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
} {
  return {
    id: address.id,
    type_of_address: address.type_of_address,
    purpose: addressPurpose(address),
    street: addressStreet(address),
    zip: address.zip,
    city: address.city,
    phone: address.phone,
    fax: address.fax,
    mobile: address.mobile,
    email: address.email,
  };
}

/** Port of #export_address_json (members_controller.rb) - the CSV/vCard-only field set (street1/2/3 + remarks), deliberately NOT reused by #directory_pdf_address_json - see that function's header comment. */
function exportAddressJson(address: AddressRow): {
  type_of_address: number | null;
  vcf_type: string;
  street1: string | null;
  street2: string | null;
  street3: string | null;
  street: string;
  zip: string | null;
  city: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
  remarks: string | null;
} {
  return {
    type_of_address: address.type_of_address,
    vcf_type: addressVcfType(address),
    street1: address.street1,
    street2: address.street2,
    street3: address.street3,
    street: addressStreet(address),
    zip: address.zip,
    city: address.city,
    phone: address.phone,
    fax: address.fax,
    mobile: address.mobile,
    email: address.email,
    remarks: address.remarks,
  };
}

/**
 * Port of #directory_pdf_address_json. Narrower than exportAddressJson on
 * purpose: #export_data is gated only by :members_list (granted to every
 * authenticated member), NOT the deliberately tighter :csv_export that gates
 * #csv_export_data - street1/2/3 and remarks are CSV/VCF-export-only fields
 * (see the regression test "does not leak the csv_export-only
 * street1/street2/street3/remarks fields").
 */
function directoryPdfAddressJson(address: AddressRow): {
  street: string;
  zip: string | null;
  city: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
} {
  return {
    street: addressStreet(address),
    zip: address.zip,
    city: address.city,
    phone: address.phone,
    fax: address.fax,
    mobile: address.mobile,
    email: address.email,
  };
}

function phoneNumbersPrintable(addresses: AddressRow[]): string {
  return addresses
    .filter((a) => isPresent(a.phone))
    .map((a) => `${addressPurpose(a)}:\n${a.phone}`)
    .join('\n');
}
function faxNumbersPrintable(addresses: AddressRow[]): string {
  return addresses
    .filter((a) => isPresent(a.fax))
    .map((a) => `${addressPurpose(a)}:\n${a.fax}`)
    .join('\n');
}

// --- member JSON builders ---------------------------------------------------

interface MemberSummaryJson {
  uuid: string | null;
  email: string;
  firstname: string | null;
  lastname: string | null;
  matriculation_number: number | null;
  job_title: string | null;
  can_edit: boolean;
  can_destroy: boolean;
  can_impersonate: boolean;
  mfa_enabled: boolean;
}

function memberSummaryJson(user: UserRow, ctx: VisibilityContext, roleRows: RoleRow[], mfaEnabled: boolean): MemberSummaryJson {
  const roleNames = roleNamesOf(roleRows);
  return {
    uuid: user.uuid,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    matriculation_number: user.matriculation_number,
    job_title: user.job_title,
    can_edit: canUpdateRow(ctx, user, roleNames),
    can_destroy: canDestroyRow(ctx, user, roleNames),
    can_impersonate: canOn(ctx.ability, 'impersonate', user, roleNames),
    mfa_enabled: mfaEnabled,
  };
}

interface MemberListRowJson extends MemberSummaryJson {
  mobile: string;
}

/**
 * List-row JSON for `GET /api/v1/members` - MemberSummary plus the
 * `users.mobile` column value (Task 3: `mobile` is now a real, sync-on-write
 * column on `users` itself - see `syncUserMobile` in `lib/userMobile.ts` -
 * no longer derived ad hoc from the first two addresses here). `?? ''`
 * matches this field's existing non-nullable `string` contract
 * (`MemberSummary.mobile` in openapi.yaml).
 */
function memberListRowJson(user: UserRow, ctx: VisibilityContext, roleRows: RoleRow[], mfaEnabled: boolean): MemberListRowJson {
  return {
    ...memberSummaryJson(user, ctx, roleRows, mfaEnabled),
    mobile: user.mobile ?? '',
  };
}

async function memberDetailJson(
  user: UserRow,
  ctx: VisibilityContext,
  roleRows: RoleRow[],
  editableFields: readonly string[],
  assignableIds: readonly number[],
): Promise<MemberSummaryJson & Record<string, unknown>> {
  const addresses = await loadAddressesForUser(user.id);
  const eas = roleRows.find((r) => r.name === 'EnteredApprentice')?.roleAddedAt ?? null;
  const fcs = roleRows.find((r) => r.name === 'FellowCraft')?.roleAddedAt ?? null;
  const mms = roleRows.find((r) => r.name === 'MasterMason')?.roleAddedAt ?? null;
  const roleIds = roleRows.map((r) => r.roleId);
  // Single-user lookup, not batched: every current call site (POST /, GET
  // /:uuid, PATCH /:uuid) already has no page-sized set of ids at hand, so
  // computing it inline here (one extra query, not N+1 - this is a detail
  // response, not a list row) is simpler than threading a Set through three
  // call sites that don't otherwise need one. Contrast with the GET /
  // list handler below, which DOES have a page-sized id set and batches via
  // getUsersWithVerifiedMfa instead.
  const mfaEnabled = await userHasVerifiedMfa(user.id);

  return {
    ...memberSummaryJson(user, ctx, roleRows, mfaEnabled),
    mobile: user.mobile,
    date_of_birth: user.date_of_birth ? formatDateOnly(user.date_of_birth) : null,
    entered_apprentice_since: eas ? formatDateOnly(eas) : null,
    fellow_craft_since: fcs ? formatDateOnly(fcs) : null,
    master_mason_since: mms ? formatDateOnly(mms) : null,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    addresses: addresses.map((a) => addressJson(a)),
    roles: roleRows.map((r) => ({
      display_name: r.displayName ?? '',
      kind: r.administrationalRole ? ('administrational' as const) : ('positions' as const),
    })),
    mother_lodge: user.mother_lodge,
    accepted_at: user.accepted_at ? formatDateOnly(user.accepted_at) : null,
    role_ids: roleIds.filter((id) => assignableIds.includes(id)),
    editable_fields: [...editableFields],
  };
}

/** `mobile` reads `users.mobile` directly (Task 3) - `phone`/`fax` stay address-derived/multi-address-printable, unaffected by this feature. */
function phoneListRowJson(user: UserRow, addresses: AddressRow[]): { uuid: string | null; lastname: string | null; firstname: string | null; phone: string; fax: string; mobile: string } {
  return {
    uuid: user.uuid,
    lastname: user.lastname,
    firstname: user.firstname,
    phone: phoneNumbersPrintable(addresses),
    fax: faxNumbersPrintable(addresses),
    mobile: user.mobile ?? '',
  };
}

type PhoneListRow = ReturnType<typeof phoneListRowJson>;

// fax isn't in this list - the Telefonliste UI dropped its Fax column (still
// present in the PDF export, so phoneListRowJson still computes it), and
// there's no on-screen control left that could ever send sort=fax.
const PHONE_SORTABLE_COLUMNS = ['lastname', 'firstname', 'phone', 'mobile'] as const;
type PhoneSortableColumn = (typeof PHONE_SORTABLE_COLUMNS)[number];
const DEFAULT_PHONE_SORT: PhoneSortableColumn = 'lastname';

function isPhoneSortableColumn(value: unknown): value is PhoneSortableColumn {
  return typeof value === 'string' && (PHONE_SORTABLE_COLUMNS as readonly string[]).includes(value);
}

/** Same allowlisted-column pattern as the members/birthday-list comparators above - phone/mobile are already-formatted display strings, so a plain string compare (nulls-last) covers every sortable column here. */
function phoneSortComparator(sortParam: unknown): (a: PhoneListRow, b: PhoneListRow) => number {
  const raw = String(sortParam ?? '');
  const field = raw.replace(/^-/, '');
  const column: PhoneSortableColumn = isPhoneSortableColumn(field) ? field : DEFAULT_PHONE_SORT;
  const desc = raw.startsWith('-');

  return (a, b) => {
    const av = a[column];
    const bv = b[column];
    let cmp: number;
    if (av === null || av === undefined) cmp = bv === null || bv === undefined ? 0 : 1;
    else if (bv === null || bv === undefined) cmp = -1;
    else cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  };
}

/** Shared by birthdayListRowJson and the birthday-list sort keys below - both need the same age, both must agree on "today". */
function computeAge(dob: Date | null, today: Date): number | null {
  if (!dob) return null;
  const hadBirthdayThisYear =
    today.getUTCMonth() > dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate());
  return today.getUTCFullYear() - dob.getUTCFullYear() - (hadBirthdayThisYear ? 0 : 1);
}

function addYears(d: Date, years: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCFullYear(copy.getUTCFullYear() + years);
  return copy;
}

/** roleRows' EnteredApprentice roleAddedAt is the jubilee anchor date for both birthdayListRowJson and the sort keys below. */
function enteredApprenticeDate(roleRows: RoleRow[]): Date | null {
  return roleRows.find((r) => r.name === 'EnteredApprentice')?.roleAddedAt ?? null;
}

function birthdayListRowJson(user: UserRow, roleRows: RoleRow[], today: Date): {
  uuid: string | null;
  lastname: string | null;
  firstname: string | null;
  date_of_birth: string | null;
  age: number | null;
  twentyfifth_jubilee: string | null;
  fortieth_jubilee: string | null;
} {
  const eas = enteredApprenticeDate(roleRows);

  return {
    uuid: user.uuid,
    lastname: user.lastname,
    firstname: user.firstname,
    date_of_birth: user.date_of_birth ? formatDateOnly(user.date_of_birth) : null,
    age: computeAge(user.date_of_birth, today),
    twentyfifth_jubilee: eas ? formatDateOnly(addYears(eas, 25)) : null,
    fortieth_jubilee: eas ? formatDateOnly(addYears(eas, 40)) : null,
  };
}

const BIRTHDAY_SORTABLE_COLUMNS = ['lastname', 'firstname', 'date_of_birth', 'age', 'twentyfifth_jubilee', 'fortieth_jubilee'] as const;
type BirthdaySortableColumn = (typeof BIRTHDAY_SORTABLE_COLUMNS)[number];
const DEFAULT_BIRTHDAY_SORT: BirthdaySortableColumn = 'date_of_birth';

function isBirthdaySortableColumn(value: unknown): value is BirthdaySortableColumn {
  return typeof value === 'string' && (BIRTHDAY_SORTABLE_COLUMNS as readonly string[]).includes(value);
}

/**
 * Days from today until this user's next birthday (month/day only, ignoring
 * birth year), wrapping to next year once this year's occurrence has
 * passed - this is what makes the default 'date_of_birth' sort show
 * "soonest upcoming first" rather than a raw chronological sort by full
 * date_of_birth (which would bury next month's birthdays behind decades-old
 * ones). A Feb 29 dob in a non-leap candidate year rolls over to Mar 1 via
 * JS's own Date normalization - an accepted, undocumented fallback, not a
 * bug, since no ported spec pins down leap-day behavior either way.
 */
function daysUntilNextBirthday(dob: Date, today: Date): number {
  const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  let candidate = Date.UTC(today.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate());
  if (candidate < todayMidnight) candidate = Date.UTC(today.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate());
  return Math.round((candidate - todayMidnight) / 86_400_000);
}

interface BirthdaySortKey {
  user: UserRow;
  lastname: string | null;
  firstname: string | null;
  date_of_birth: number | null;
  age: number | null;
  twentyfifth_jubilee: number | null;
  fortieth_jubilee: number | null;
}

function buildBirthdaySortKey(user: UserRow, roleRows: RoleRow[], today: Date): BirthdaySortKey {
  const eas = enteredApprenticeDate(roleRows);
  return {
    user,
    lastname: user.lastname,
    firstname: user.firstname,
    date_of_birth: user.date_of_birth ? daysUntilNextBirthday(user.date_of_birth, today) : null,
    age: computeAge(user.date_of_birth, today),
    twentyfifth_jubilee: eas ? addYears(eas, 25).getTime() : null,
    fortieth_jubilee: eas ? addYears(eas, 40).getTime() : null,
  };
}

/** Same allowlisted-column/nulls/desc-flip pattern as sortComparator further below, applied to the birthday list's computed sort keys (age/jubilee/days-until-birthday aren't real columns Prisma could order by). */
function birthdaySortComparator(sortParam: unknown): (a: BirthdaySortKey, b: BirthdaySortKey) => number {
  const raw = String(sortParam ?? '');
  const field = raw.replace(/^-/, '');
  const column: BirthdaySortableColumn = isBirthdaySortableColumn(field) ? field : DEFAULT_BIRTHDAY_SORT;
  const desc = raw.startsWith('-');

  return (a, b) => {
    const av = a[column];
    const bv = b[column];
    let cmp: number;
    if (av === null || av === undefined) cmp = bv === null || bv === undefined ? 0 : 1;
    else if (bv === null || bv === undefined) cmp = -1;
    else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
    return desc ? -cmp : cmp;
  };
}

function fullname(user: Pick<UserRow, 'firstname' | 'lastname'>): string {
  return [user.firstname, user.lastname].filter((v): v is string => isPresent(v)).join(' ');
}

async function fullnameWithTitle(user: UserRow): Promise<string> {
  let titleShort: string | null = null;
  if (user.academic_title_id !== null) {
    const title = await prisma.academic_titles.findUnique({ where: { id: user.academic_title_id } });
    titleShort = title?.short ?? null;
  }
  return [titleShort, user.firstname, user.lastname].filter((v): v is string => isPresent(v)).join(' ');
}

/** Port of User#num_degree. */
function numDegree(roleRows: RoleRow[]): number {
  const names = new Set(roleNamesOf(roleRows));
  let degree = 1;
  if (names.has('FellowCraft')) degree += 1;
  if (names.has('MasterMason')) degree += 1;
  return degree;
}

async function exportRowJson(
  user: UserRow,
  roleRows: RoleRow[],
): Promise<{
  uuid: string | null;
  matriculation_number: number | null;
  fullname_with_title: string;
  job_title: string | null;
  num_degree: number;
  entered_apprentice_since: string | null;
  accepted_at: string | null;
  date_of_birth: string | null;
  business_address: ReturnType<typeof directoryPdfAddressJson> | null;
  private_address: ReturnType<typeof directoryPdfAddressJson> | null;
  positions: string[];
}> {
  const addresses = await loadAddressesForUser(user.id);
  const business = addresses.find((a) => a.type_of_address === ADDRESS_TYPE_BUSINESS) ?? null;
  const priv = addresses.find((a) => a.type_of_address === ADDRESS_TYPE_PRIVATE) ?? null;
  const eas = roleRows.find((r) => r.name === 'EnteredApprentice')?.roleAddedAt ?? null;
  // Port of User#positions: self.roles & Role.positions (administrational_role:
  // false, excluding degree names) - NOT the union with administrational_roles
  // that member_json's role_ids field uses.
  const positionNames = roleRows
    .filter((r) => !DEGREE_ROLE_NAMES.includes((r.name ?? '') as (typeof DEGREE_ROLE_NAMES)[number]))
    .filter((r) => r.name !== null);

  const positionRoleIds = positionNames.map((r) => r.roleId);
  const positionRoles =
    positionRoleIds.length > 0
      ? await prisma.roles.findMany({ where: { id: { in: positionRoleIds }, administrational_role: false } })
      : [];

  return {
    uuid: user.uuid,
    matriculation_number: user.matriculation_number,
    fullname_with_title: await fullnameWithTitle(user),
    job_title: user.job_title,
    num_degree: numDegree(roleRows),
    entered_apprentice_since: eas ? formatDateOnly(eas) : null,
    accepted_at: user.accepted_at ? formatDateOnly(user.accepted_at) : null,
    date_of_birth: user.date_of_birth ? formatDateOnly(user.date_of_birth) : null,
    business_address: business ? directoryPdfAddressJson(business) : null,
    private_address: priv ? directoryPdfAddressJson(priv) : null,
    positions: positionRoles.map((r) => r.display_name ?? ''),
  };
}

async function csvExportRowJson(user: UserRow): Promise<{
  uuid: string | null;
  lastname: string | null;
  firstname: string | null;
  fullname: string;
  email: string;
  date_of_birth: string | null;
  addresses: ReturnType<typeof exportAddressJson>[];
}> {
  const addresses = await loadAddressesForUser(user.id);
  return {
    uuid: user.uuid,
    lastname: user.lastname,
    firstname: user.firstname,
    fullname: fullname(user),
    email: user.email,
    date_of_birth: user.date_of_birth ? formatDateOnly(user.date_of_birth) : null,
    addresses: addresses.map((a) => exportAddressJson(a)),
  };
}

// --- degree-date setters (port of User#entered_apprentice_since=/etc.) ----
//
// These persist immediately (their own `user_roles` upsert), exactly like
// Rails' `set_degree_by_name`'s `ur.save!` - NOT part of the update
// transaction below. See this file's header comment / this task's final
// report for the consequence: a degree-date write survives even if the
// surrounding @member.save-equivalent later rolls back.

async function getDegreeDate(userId: number, roleName: string): Promise<Date | null> {
  const role = await prisma.roles.findFirst({ where: { name: roleName } });
  if (!role) return null;
  const ur = await prisma.user_roles.findFirst({ where: { user_id: userId, role_id: role.id } });
  return ur?.role_added_at ?? null;
}

async function setDegreeByName(userId: number, roleName: string, dateValue: unknown, errors: string[]): Promise<void> {
  if (!isPresent(dateValue)) return;
  const role = await prisma.roles.findFirst({ where: { name: roleName } });
  if (!role) {
    errors.push(msgRoleNotFound(roleName));
    return;
  }
  const date = parseDateOnly(dateValue);
  const existing = await prisma.user_roles.findFirst({ where: { user_id: userId, role_id: role.id } });
  const now = new Date();
  if (existing) {
    await prisma.user_roles.update({ where: { id: existing.id }, data: { role_added_at: date, updated_at: now } });
  } else {
    await prisma.user_roles.create({ data: { user_id: userId, role_id: role.id, role_added_at: date, created_at: now, updated_at: now } });
  }
}

/**
 * Port of #apply_degree_dates - always assigns in this fixed order
 * (EnteredApprentice, then FellowCraft, then MasterMason), independent of
 * request param order, since the FellowCraft/MasterMason guards below each
 * re-read the just-written prior degree.
 */
async function applyDegreeDates(userId: number, body: Record<string, unknown>, errors: string[]): Promise<void> {
  if (isPresent(body.entered_apprentice_since)) {
    await setDegreeByName(userId, 'EnteredApprentice', body.entered_apprentice_since, errors);
  }
  if (isPresent(body.fellow_craft_since)) {
    const eas = await getDegreeDate(userId, 'EnteredApprentice');
    if (!eas) {
      errors.push(MSG_MUST_BE_FELLOW_CRAFT_TO_BECOME_MASTER);
    } else {
      await setDegreeByName(userId, 'FellowCraft', body.fellow_craft_since, errors);
    }
  }
  if (isPresent(body.master_mason_since)) {
    const fcs = await getDegreeDate(userId, 'FellowCraft');
    if (!fcs) {
      errors.push(MSG_MUST_BE_FELLOW_CRAFT_TO_BECOME_MASTER);
    } else {
      await setDegreeByName(userId, 'MasterMason', body.master_mason_since, errors);
    }
  }
}

// --- member_params equivalent -----------------------------------------------

function editableFieldsFor(callerRoleNames: readonly string[]): readonly string[] {
  return isUserAdmin(callerRoleNames) ? ADMIN_FIELDS : LIMITED_FIELDS;
}

/** Scalar (non-address, non-role_ids, non-degree-date) fields actually present in the request body, restricted to what editableFields whitelists. */
function scalarUpdatesFrom(body: Record<string, unknown>, editableFields: readonly string[]): Record<string, unknown> {
  const excluded = new Set(['addresses', 'role_ids', 'entered_apprentice_since', 'fellow_craft_since', 'master_mason_since']);
  const scalarFields = editableFields.filter((f) => !excluded.has(f));
  const out: Record<string, unknown> = {};
  for (const field of scalarFields) {
    if (field in body) out[field] = body[field];
  }
  return out;
}

interface AddressInput {
  id?: number;
  type_of_address?: number | null;
  purpose?: string | null;
  street1?: string | null;
  street2?: string | null;
  street3?: string | null;
  zip?: string | null;
  city?: string | null;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;
  remarks?: string | null;
  _destroy?: boolean;
}

/**
 * Port of the nested `addresses_attributes=` handling accepts_nested_attributes_for
 * gives User, run inside the same transaction as the parent save (see the
 * PATCH handler) so a validation failure rolls address writes back too.
 * Returns the resulting effective (post-_destroy) address set for
 * validate_addresses to count.
 */
async function applyAddresses(
  tx: PrismaTx,
  userId: number,
  inputs: AddressInput[],
  errors: string[],
): Promise<void> {
  for (const input of inputs) {
    if (input.id !== undefined) {
      const existing = await tx.addresses.findFirst({ where: { id: input.id, addressable_id: userId, addressable_type: 'User' } });
      if (!existing) {
        // Rails: nested-attributes lookup is scoped through member.addresses,
        // so an id belonging to a different user's address raises
        // ActiveRecord::RecordNotFound -> BaseController maps that to 404.
        throw ApiError.notFound();
      }
      if (input._destroy) {
        await tx.addresses.delete({ where: { id: existing.id } });
        continue;
      }
      const data: Record<string, unknown> = {};
      for (const key of ['type_of_address', 'purpose', 'street1', 'street2', 'street3', 'zip', 'city', 'phone', 'fax', 'mobile', 'email', 'remarks'] as const) {
        if (key in input) data[key] = input[key];
      }
      if (Object.keys(data).length > 0) {
        await tx.addresses.update({ where: { id: existing.id }, data });
      }
    } else {
      const now = new Date();
      await tx.addresses.create({
        data: {
          addressable_id: userId,
          addressable_type: 'User',
          type_of_address: input.type_of_address ?? null,
          purpose: input.purpose ?? undefined,
          street1: input.street1 ?? null,
          street2: input.street2 ?? null,
          street3: input.street3 ?? null,
          zip: input.zip ?? null,
          city: input.city ?? null,
          phone: input.phone ?? null,
          fax: input.fax ?? null,
          mobile: input.mobile ?? null,
          email: input.email ?? null,
          remarks: input.remarks ?? null,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });
    }
  }

  // Port of User#validate_addresses - counted on the post-_destroy effective
  // set (destroys above already applied), max 1 private + 1 business.
  const remaining = await tx.addresses.findMany({ where: { addressable_id: userId, addressable_type: 'User', deleted: false } });
  if (remaining.filter((a) => a.type_of_address === ADDRESS_TYPE_PRIVATE).length > 1) {
    errors.push(MSG_MAX_PRIVATE_ADDRESSES);
  }
  if (remaining.filter((a) => a.type_of_address === ADDRESS_TYPE_BUSINESS).length > 1) {
    errors.push(MSG_MAX_BUSINESS_ADDRESSES);
  }

  // ponytail: users.mobile is address-derived and gets overwritten on every
  // address save - a direct edit to the base mobile field survives until
  // the next address write touches this user, then loses. Accepted
  // trade-off, not a bug. Runs even when the block above just pushed a
  // validation error - the whole transaction (including this write) is
  // rolled back by the caller in that case, same as every other write in
  // this function.
  await syncUserMobile(tx, userId);
}

/**
 * Whether another user (any `deleted` status - matches this column's DB-level
 * uniqueness scope, see this plan's Global Constraints) already holds this
 * matriculation_number. Replaces the old resolveMatriculationNumber()'s
 * silent auto-bump-on-collision: a duplicate is now a real validation error
 * (see the create/update route handlers below), never silently overridden.
 */
async function isMatriculationNumberTaken(tx: PrismaTx, candidate: number, excludeUserId: number | null): Promise<boolean> {
  const where: Record<string, unknown> = { matriculation_number: candidate };
  if (excludeUserId !== null) where.id = { not: excludeUserId };
  const duplicate = await tx.users.findFirst({ where });
  return duplicate !== null;
}

/**
 * max(matriculation_number) + 1 across ALL users (any `deleted` status), or 1
 * if none exist yet. Used only as a suggested default for the "create new
 * member" form (GET /next_matriculation_number) - never to silently override
 * a caller-supplied value on collision (see isMatriculationNumberTaken).
 */
async function suggestNextMatriculationNumber(): Promise<number> {
  const agg = await prisma.users.aggregate({ _max: { matriculation_number: true } });
  return (agg._max.matriculation_number ?? 0) + 1;
}

/**
 * Port of #apply_role_ids, including UserRole's after_save eviction hook
 * (`unless role.is_group?`) for a non-group role's prior holder - never
 * touches degree roles (excluded via `assignableIds`).
 */
async function applyRoleIds(tx: PrismaTx, userId: number, submitted: number[], assignableIds: number[]): Promise<void> {
  const currentRows = await tx.user_roles.findMany({ where: { user_id: userId, role_id: { in: assignableIds } } });
  const currentIds = currentRows.map((r) => r.role_id).filter((id): id is number => id !== null);
  const submittedIds = [...new Set(submitted.map((id) => Number(id)))].filter((id) => assignableIds.includes(id));

  const toRemove = currentIds.filter((id) => !submittedIds.includes(id));
  const toAdd = submittedIds.filter((id) => !currentIds.includes(id));

  for (const roleId of toRemove) {
    await tx.user_roles.deleteMany({ where: { user_id: userId, role_id: roleId } });
  }
  for (const roleId of toAdd) {
    const role = await tx.roles.findUnique({ where: { id: roleId } });
    if (role && !role.group) {
      await tx.user_roles.deleteMany({ where: { role_id: roleId, NOT: { user_id: userId } } });
    }
    const now = new Date();
    await tx.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now } });
  }
}

/** Port of User#validate_roles (`on: :update`) - the account must have an EnteredApprentice degree date. */
async function validateRolesOnUpdate(tx: PrismaTx, userId: number, errors: string[]): Promise<void> {
  const role = await tx.roles.findFirst({ where: { name: 'EnteredApprentice' } });
  const ur = role ? await tx.user_roles.findFirst({ where: { user_id: userId, role_id: role.id } }) : null;
  if (!ur?.role_added_at) {
    errors.push(MSG_MUST_BE_ENTERED_APPRENTICE);
  }
}

/** Port of User#validate_mother_lodge_accepted_at_combi - both-or-neither. */
function validateMotherLodgeCombi(motherLodge: unknown, acceptedAt: unknown, errors: string[]): void {
  const mlBlank = !isPresent(motherLodge);
  const aaBlank = !isPresent(acceptedAt);
  if (mlBlank === aaBlank) return;
  errors.push(MSG_MOTHER_LODGE_ACCEPTED_AT);
}

// The interactive-transaction client type Prisma's `$transaction(async (tx) => ...)` callback provides.
type PrismaTx = Prisma.TransactionClient;

// --- routes: fixed-path collection endpoints (registered before /:uuid) ----

router.get('/phone_list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canMembersListClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    const users = await prisma.users.findMany({ where: { deleted: false }, orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }] });
    const roleRowsByUser = await loadRoleRowsForUsers(users.map((u) => u.id));
    const visible = users.filter((u) => canListRow(ctx, 'phone_list', u, roleNamesOf(roleRowsByUser.get(u.id) ?? [])));

    const addressesByUser = await loadAddressesForUsers(visible.map((u) => u.id));
    const rows = visible
      .map((u) => phoneListRowJson(u, addressesByUser.get(u.id) ?? []))
      .sort(phoneSortComparator(req.query.sort));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const pagedRows = rows.slice(page * perPage, page * perPage + perPage);

    res.status(200).json(buildListResponse(pagedRows, visible.length));
  } catch (err) {
    next(err);
  }
});

router.get('/birthday_list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canMembersListClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    const users = await prisma.users.findMany({ where: { deleted: false }, orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }] });
    const roleRowsByUser = await loadRoleRowsForUsers(users.map((u) => u.id));
    const visible = users.filter((u) => canListRow(ctx, 'birthday_list', u, roleNamesOf(roleRowsByUser.get(u.id) ?? [])));

    const today = new Date();
    const sortKeys = visible
      .map((u) => buildBirthdaySortKey(u, roleRowsByUser.get(u.id) ?? [], today))
      .sort(birthdaySortComparator(req.query.sort));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const pagedKeys = sortKeys.slice(page * perPage, page * perPage + perPage);

    res
      .status(200)
      .json(buildListResponse(pagedKeys.map((k) => birthdayListRowJson(k.user, roleRowsByUser.get(k.user.id) ?? [], today)), visible.length));
  } catch (err) {
    next(err);
  }
});

router.get('/members_of_council', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canMembersOfCouncilClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const roles = await prisma.roles.findMany({
      where: { administrational_role: false, ordering_number: { not: null } },
      orderBy: { ordering_number: 'asc' },
    });

    const rows: Array<{
      role_display_name: string;
      role_email: string | null;
      holder_uuid: string;
      holder_fullname: string;
      holder_phone: string;
      holder_mobile: string;
    }> = [];

    for (const role of roles) {
      const holderRoles = await prisma.user_roles.findMany({ where: { role_id: role.id } });
      for (const holderRole of holderRoles) {
        if (!holderRole.user_id) continue;
        // eslint-disable-next-line no-await-in-loop -- one role can have several holders; each needs its own address lookup.
        const holder = await prisma.users.findFirst({ where: { id: holderRole.user_id, deleted: false } });
        if (!holder) continue;

        // eslint-disable-next-line no-await-in-loop -- see above.
        const addresses = await loadAddressesForUser(holder.id);
        rows.push({
          role_display_name: role.display_name ?? '',
          role_email: role.email,
          holder_uuid: holder.uuid ?? '',
          holder_fullname: fullname(holder),
          holder_phone: phoneNumbersPrintable(addresses),
          // `users.mobile` directly (Task 3) - unlike holder_phone, no
          // longer a multi-address printable string.
          holder_mobile: holder.mobile ?? '',
        });
      }
    }

    res.status(200).json({ rows });
  } catch (err) {
    next(err);
  }
});

router.get('/export_data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canMembersListClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const currentUser = req.currentUser!;
    await recordFileDownload(currentUser.id, 'Mitgliederverzeichnis (Export)', req.ip ?? currentUser.current_sign_in_ip);

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    const users = await prisma.users.findMany({
      where: { deleted: false },
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { matriculation_number: 'asc' }],
    });
    const roleRowsByUser = await loadRoleRowsForUsers(users.map((u) => u.id));
    const visible = users.filter((u) => canListRow(ctx, 'members_list', u, roleNamesOf(roleRowsByUser.get(u.id) ?? [])));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = visible.slice(page * perPage, page * perPage + perPage);
    const rows = await Promise.all(paged.map((u) => exportRowJson(u, roleRowsByUser.get(u.id) ?? [])));

    res.status(200).json(buildListResponse(rows, visible.length));
  } catch (err) {
    next(err);
  }
});

router.get('/csv_export_data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canCsvExportClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const currentUser = req.currentUser!;
    await recordFileDownload(currentUser.id, 'Mitgliederverzeichnis (CSV-Export)', req.ip ?? currentUser.current_sign_in_ip);

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    const users = await prisma.users.findMany({
      where: { deleted: false },
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { matriculation_number: 'asc' }],
    });
    const roleRowsByUser = await loadRoleRowsForUsers(users.map((u) => u.id));
    const visible = users.filter((u) => canCsvExportRow(ctx, u, roleNamesOf(roleRowsByUser.get(u.id) ?? [])));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = visible.slice(page * perPage, page * perPage + perPage);
    const rows = await Promise.all(paged.map((u) => csvExportRowJson(u)));

    res.status(200).json(buildListResponse(rows, visible.length));
  } catch (err) {
    next(err);
  }
});

const RECORD_EXPORT_KINDS: Record<string, { ability: (a: AppAbility) => boolean; filename: string }> = {
  members_list: { ability: canMembersListClass, filename: 'Mitgliederverzeichnis' },
  birthday_list: { ability: canMembersListClass, filename: 'Geburtstagsliste' },
  phone_list: { ability: canMembersListClass, filename: 'Telefonliste' },
};

/**
 * Shared column-filling logic for a `file_downloads` audit row - the single
 * place that writes one, whether triggered by the client-side
 * `/record_export` beacon (below) or server-side, unconditionally, from
 * inside the export handlers themselves (security fix: previously
 * file_downloads rows were ONLY ever written by the client beacon, so
 * calling csv_export_data/export_data directly - a script, or a compromised
 * account that never calls the beacon - left zero server-side record of the
 * bulk PII export).
 */
async function recordFileDownload(userId: number, filename: string, remoteIp: string | null): Promise<void> {
  const now = new Date();
  await prisma.file_downloads.create({
    data: {
      user_id: userId,
      attached_file_id: null,
      filename,
      remote_ip: remoteIp,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

router.post('/record_export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kind = (req.body as { kind?: unknown } | undefined)?.kind;
    const config = typeof kind === 'string' ? RECORD_EXPORT_KINDS[kind] : undefined;
    if (!config) {
      res.status(400).json({ error: 'bad_request', detail: 'unknown kind' });
      return;
    }
    if (!config.ability(req.ability!)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const currentUser = req.currentUser!;
    await recordFileDownload(currentUser.id, config.filename, currentUser.current_sign_in_ip);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- routes: /api/v1/members collection -------------------------------------

function isSortableColumn(value: unknown): value is SortableColumn {
  return typeof value === 'string' && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

/** Port of #sort_clause. */
function sortComparator(sortParam: unknown): (a: UserRow, b: UserRow) => number {
  const raw = String(sortParam ?? '');
  const field = raw.replace(/^-/, '');
  const column: SortableColumn = isSortableColumn(field) ? field : DEFAULT_SORT;
  const desc = raw.startsWith('-');

  return (a, b) => {
    const av = a[column];
    const bv = b[column];
    let cmp: number;
    if (av === null || av === undefined) cmp = bv === null || bv === undefined ? 0 : 1;
    else if (bv === null || bv === undefined) cmp = -1;
    else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
    return desc ? -cmp : cmp;
  };
}

/** Port of User.search - ILIKE across email/firstname/lastname/matriculation_number/job_title/mother_lodge::text, plus any of the user's addresses' phone/mobile/street1-3. */
function matchesSearch(user: UserRow, term: string, addresses: AddressRow[]): boolean {
  const needle = term.toLowerCase();
  const userMatches =
    (user.email ?? '').toLowerCase().includes(needle) ||
    (user.firstname ?? '').toLowerCase().includes(needle) ||
    (user.lastname ?? '').toLowerCase().includes(needle) ||
    (user.job_title ?? '').toLowerCase().includes(needle) ||
    (user.mother_lodge ?? '').toLowerCase().includes(needle) ||
    String(user.matriculation_number ?? '').toLowerCase().includes(needle);
  if (userMatches) return true;
  return addresses.some((a) =>
    (a.phone ?? '').toLowerCase().includes(needle) ||
    (a.mobile ?? '').toLowerCase().includes(needle) ||
    (a.street1 ?? '').toLowerCase().includes(needle) ||
    (a.street2 ?? '').toLowerCase().includes(needle) ||
    (a.street3 ?? '').toLowerCase().includes(needle),
  );
}

router.get('/next_matriculation_number', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canCreateClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const next_matriculation_number = await suggestNextMatriculationNumber();
    res.status(200).json({ next_matriculation_number });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    let users = await prisma.users.findMany({ where: { deleted: false } });
    const search = req.query.search;
    if (typeof search === 'string' && search.length > 0) {
      // Address fields are part of the search surface, so the full
      // candidate set's addresses must be loaded before filtering - not
      // just the eventual paged slice (see the addressesByUser load below,
      // which still only covers the page, for display purposes).
      const addressesForSearch = await loadAddressesForUsers(users.map((u) => u.id));
      users = users.filter((u) => matchesSearch(u, search, addressesForSearch.get(u.id) ?? []));
    }
    users = [...users].sort(sortComparator(req.query.sort));

    const roleRowsByUser = await loadRoleRowsForUsers(users.map((u) => u.id));
    const visible = users.filter((u) => canShowRow(ctx, u, roleNamesOf(roleRowsByUser.get(u.id) ?? [])));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = visible.slice(page * perPage, page * perPage + perPage);

    // Only the paged slice's MFA status is needed here - this is for
    // response display (the mfa_enabled column), a separate concern from
    // the full-candidate-set load above needed for the search filter
    // itself. Batched (one query for the whole page), not per-row, to avoid
    // an N+1. (Addresses no longer need a separate batched load here for
    // display purposes - "Mobile" now reads `users.mobile` directly, see
    // memberListRowJson.)
    const mfaEnabledIds = await getUsersWithVerifiedMfa(paged.map((u) => u.id));

    res
      .status(200)
      .json(buildListResponse(
        paged.map((u) => memberListRowJson(u, ctx, roleRowsByUser.get(u.id) ?? [], mfaEnabledIds.has(u.id))),
        visible.length,
      ));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = req.ability!;
    if (!canCreateClass(ability)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const editableFields = editableFieldsFor(callerRoleNames);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const scalarUpdates = scalarUpdatesFrom(body, editableFields);

    const errors: string[] = [];
    if (!isPresent(scalarUpdates.firstname)) errors.push("Vorname kann nicht leer sein.");
    if (!isPresent(scalarUpdates.lastname)) errors.push("Nachname kann nicht leer sein.");
    if (!isPresent(scalarUpdates.date_of_birth)) errors.push("Geburtsdatum kann nicht leer sein.");
    if (!isPresent(scalarUpdates.matriculation_number)) errors.push("Matrikelnummer kann nicht leer sein.");
    if (!isPresent(scalarUpdates.email)) errors.push("E-Mail kann nicht leer sein.");

    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    validateMotherLodgeCombi(scalarUpdates.mother_lodge, scalarUpdates.accepted_at, errors);
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const throwawayPassword = randomBytes(16).toString('hex');
    const encryptedPassword = await bcrypt.hash(throwawayPassword, BCRYPT_COST);
    const now = new Date();

    const created = await prisma.$transaction(async (tx) => {
      const matriculationNumber = Number(scalarUpdates.matriculation_number);
      if (await isMatriculationNumberTaken(tx, matriculationNumber, null)) {
        throw new RollbackError(['Matrikelnummer bereits vergeben.']);
      }
      const uuid = await generateUniqueUuid((candidate) => tx.users.findFirst({ where: { uuid: candidate } }).then(Boolean));
      const user = await tx.users.create({
        data: {
          uuid,
          email: String(scalarUpdates.email),
          firstname: String(scalarUpdates.firstname),
          lastname: String(scalarUpdates.lastname),
          date_of_birth: parseDateOnly(scalarUpdates.date_of_birth),
          matriculation_number: matriculationNumber,
          job_title: (scalarUpdates.job_title as string | null | undefined) ?? null,
          mobile: (scalarUpdates.mobile as string | null | undefined) ?? null,
          mother_lodge: (scalarUpdates.mother_lodge as string | null | undefined) ?? null,
          accepted_at: isPresent(scalarUpdates.accepted_at) ? parseDateOnly(scalarUpdates.accepted_at) : null,
          encrypted_password: encryptedPassword,
          created_at: now,
          updated_at: now,
        },
      });

      const addressInputs = Array.isArray(body.addresses) ? (body.addresses as AddressInput[]) : [];
      if (addressInputs.length > 0 && editableFields.includes('addresses')) {
        const addrErrors: string[] = [];
        await applyAddresses(tx, user.id, addressInputs, addrErrors);
        if (addrErrors.length > 0) {
          throw new RollbackError(addrErrors);
        }
        // applyAddresses just ran syncUserMobile, which may have overwritten
        // the direct `mobile` scalar just written above (accepted, by-design
        // clobber - see syncUserMobile's own comment) - re-read so the
        // response reflects the actual post-sync value, not the stale
        // in-memory `user` from before the address write.
        return tx.users.findUniqueOrThrow({ where: { id: user.id } });
      }

      return user;
    });

    // apply_degree_dates runs UNCONDITIONALLY on create (no editable_fields
    // gate at this call site in Rails) and, per the Rails controller, its
    // errors are never inspected afterward - any failure here (e.g. a
    // missing Role row) is silently swallowed, matching Rails exactly. See
    // this task's final report.
    const degreeErrors: string[] = [];
    await applyDegreeDates(created.id, body, degreeErrors);
    if (!(await getDegreeDate(created.id, 'EnteredApprentice'))) {
      await setDegreeByName(created.id, 'EnteredApprentice', formatDateOnly(new Date()), degreeErrors);
    }

    const roleRows = await loadRoleRowsForUser(created.id);
    const assignableIds = await nonDegreeRoleIds();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins: await showAdminsConfig() };
    const json = await memberDetailJson(created, ctx, roleRows, editableFields, assignableIds);

    res.status(201).json(json);
  } catch (err) {
    if (err instanceof RollbackError) {
      res.status(422).json({ error: 'unprocessable', detail: err.messages.join(', ') });
      return;
    }
    // Safety net for the race the in-transaction isMatriculationNumberTaken
    // check narrows but can't fully close (two near-simultaneous creates
    // both passing the pre-check before either INSERT commits) - the DB's
    // own unique index (see Task 2) is the actual backstop; this just turns
    // its P2002 into the same validation-error shape instead of a bare 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(422).json({ error: 'unprocessable', detail: 'Matrikelnummer bereits vergeben.' });
      return;
    }
    next(err);
  }
});

// --- routes: /api/v1/members/:uuid ------------------------------------------

/** Port of #set_member - looked up regardless of `deleted` (impersonate needs to find a deleted target to deny it with 403, not 404). */
async function findMemberByUuid(uuid: string): Promise<UserRow | null> {
  return prisma.users.findFirst({ where: { uuid } });
}

class RollbackError extends Error {
  readonly messages: string[];

  constructor(messages: string[]) {
    super(messages.join(', '));
    this.messages = messages;
  }
}

/**
 * Express 5's route-literal param-type inference (`ParseRouteParameters`)
 * only kicks in when the handler callback is left un-annotated; this file's
 * handlers explicitly annotate `req: Request` (no generic), which falls back
 * to the bare `ParamsDictionary` index signature (`string | string[]`, plus
 * `| undefined` from this project's `noUncheckedIndexedAccess`). A literal
 * `:uuid` segment is always a single string at runtime (only wildcard/`*`
 * segments can produce an array) - this narrows that back down, and 404s
 * in the (unreachable in practice) case it isn't.
 */
function uuidParam(value: string | string[] | undefined): string {
  if (typeof value !== 'string') throw ApiError.notFound();
  return value;
}

router.get('/:uuid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await findMemberByUuid(uuidParam(req.params.uuid));
    if (!target) throw ApiError.notFound();

    const ability = req.ability!;
    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };
    const roleRows = await loadRoleRowsForUser(target.id);

    if (!canShowRow(ctx, target, roleNamesOf(roleRows))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const editableFields = editableFieldsFor(callerRoleNames);
    const assignableIds = await nonDegreeRoleIds();
    res.status(200).json(await memberDetailJson(target, ctx, roleRows, editableFields, assignableIds));
  } catch (err) {
    next(err);
  }
});

router.patch('/:uuid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await findMemberByUuid(uuidParam(req.params.uuid));
    if (!target) throw ApiError.notFound();

    const ability = req.ability!;
    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };
    let roleRows = await loadRoleRowsForUser(target.id);

    if (!canUpdateRow(ctx, target, roleNamesOf(roleRows))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const editableFields = editableFieldsFor(callerRoleNames);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const scalarUpdates = scalarUpdatesFrom(body, editableFields);

    // apply_degree_dates - gated on editable_fields including
    // 'entered_apprentice_since' (i.e. ADMIN_FIELDS, i.e. isUserAdmin) -
    // persists immediately, outside the transaction below (see that
    // function's header comment).
    if (editableFields.includes('entered_apprentice_since')) {
      const degreeErrors: string[] = [];
      await applyDegreeDates(target.id, body, degreeErrors);
      if (degreeErrors.length > 0) {
        res.status(422).json({ error: 'unprocessable', detail: degreeErrors.join(', ') });
        return;
      }
    }

    const roleIdsRequested = Array.isArray(body.role_ids) && editableFields.includes('role_ids');
    if (roleIdsRequested && !ability.can('manage', 'UserRole')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Security fix: `ability.can('manage', 'UserRole')` alone (held by
    // UserAdmin/Secretary/NetDelegate, none of them Admin) only gates
    // whether the caller may touch role_ids at all - it says nothing about
    // *which* role ids. nonDegreeRoleIds() (used below to compute
    // assignableIds) returns every non-degree role id, including Admin's, so
    // without this check any UserAdmin/Secretary/NetDelegate could grant
    // themselves or anyone else the Admin role. Only a caller who already
    // holds Admin may grant it.
    if (roleIdsRequested) {
      const adminRole = await prisma.roles.findFirst({ where: { name: 'Admin' }, select: { id: true } });
      const requestedRoleIds = (body.role_ids as unknown[]).map(Number);
      if (adminRole && requestedRoleIds.includes(adminRole.id) && !isAdmin(callerRoleNames)) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
    }

    // MFA officer-role gate: when mfa_enforce_for_officers is on, granting
    // any NEW non-degree role to a user with no verified MFA method is
    // rejected. Existing role-holders are grandfathered - only newly
    // *added* role ids (not already in roleRows) are checked, so
    // re-submitting an unchanged role set never trips this for a
    // still-unenrolled existing officer.
    if (roleIdsRequested) {
      const { enforceForOfficers } = await getMfaSettings();
      if (enforceForOfficers) {
        const requestedRoleIds = (body.role_ids as unknown[]).map(Number);
        const currentRoleIds = roleRows.map((r) => r.roleId);
        const newlyGrantedIds = requestedRoleIds.filter((id) => !currentRoleIds.includes(id));
        if (newlyGrantedIds.length > 0 && !(await userHasVerifiedMfa(target.id))) {
          res.status(422).json({ error: 'unprocessable', detail: 'Nutzer muss zuerst MFA aktivieren, bevor eine Amtsrolle vergeben werden kann.' });
          return;
        }
      }
    }

    let rolledBack = false;
    try {
      await prisma.$transaction(async (tx) => {
        const errors: string[] = [];

        const addressInputs = Array.isArray(body.addresses) ? (body.addresses as AddressInput[]) : [];
        if (addressInputs.length > 0 && editableFields.includes('addresses')) {
          await applyAddresses(tx, target.id, addressInputs, errors);
        }

        if (roleIdsRequested) {
          const assignableIds = await nonDegreeRoleIds();
          await applyRoleIds(tx, target.id, (body.role_ids as unknown[]).map(Number), assignableIds);
        }

        validateMotherLodgeCombi(
          'mother_lodge' in scalarUpdates ? scalarUpdates.mother_lodge : target.mother_lodge,
          'accepted_at' in scalarUpdates ? scalarUpdates.accepted_at : target.accepted_at,
          errors,
        );

        await validateRolesOnUpdate(tx, target.id, errors);

        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(scalarUpdates)) {
          if (key === 'date_of_birth' || key === 'accepted_at') {
            data[key] = isPresent(value) ? parseDateOnly(value) : null;
          } else if (key === 'matriculation_number') {
            if (isPresent(value)) {
              const candidate = Number(value);
              if (await isMatriculationNumberTaken(tx, candidate, target.id)) {
                errors.push('Matrikelnummer bereits vergeben.');
              }
              data[key] = candidate;
            } else {
              data[key] = null;
            }
          } else {
            data[key] = value;
          }
        }

        if (errors.length > 0) {
          throw new RollbackError(errors);
        }

        if (Object.keys(data).length > 0) {
          data.updated_at = new Date();
          await tx.users.update({ where: { id: target.id }, data });
        }

        if (addressInputs.length > 0 && editableFields.includes('addresses')) {
          // applyAddresses above already ran syncUserMobile once, before
          // this transaction's own scalar `data` write - if that write
          // included a direct `mobile` edit (same request as an address
          // save), it would otherwise be the last word instead of the
          // address-derived value. Re-sync here so an address write always
          // has the last word regardless of what else the same request
          // touched, matching the create handler's precedent above and
          // this feature's accepted design (see syncUserMobile's own
          // comment).
          await syncUserMobile(tx, target.id);
        }
      });
    } catch (err) {
      if (err instanceof RollbackError) {
        rolledBack = true;
        res.status(422).json({ error: 'unprocessable', detail: err.messages.join(', ') });
      } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Same race/safety-net rationale as the create handler above - the
        // DB's unique index is the real backstop, this just gives it the
        // same validation-error shape instead of a bare 500.
        rolledBack = true;
        res.status(422).json({ error: 'unprocessable', detail: 'Matrikelnummer bereits vergeben.' });
      } else {
        throw err;
      }
    }
    if (rolledBack) return;

    const updated = await prisma.users.findUniqueOrThrow({ where: { id: target.id } });
    roleRows = await loadRoleRowsForUser(target.id);
    const assignableIds = await nonDegreeRoleIds();
    res.status(200).json(await memberDetailJson(updated, ctx, roleRows, editableFields, assignableIds));
  } catch (err) {
    next(err);
  }
});

router.delete('/:uuid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await findMemberByUuid(uuidParam(req.params.uuid));
    if (!target) throw ApiError.notFound();

    const ability = req.ability!;
    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };
    const roleRows = await loadRoleRowsForUser(target.id);

    if (!canDestroyRow(ctx, target, roleNamesOf(roleRows))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Port of User#validate_roles (`on: :update`) - the soft-delete's
    // `update!` runs in the same :update validation context in Rails, so a
    // member missing an EnteredApprentice date 422s instead of soft-deleting.
    const errors: string[] = [];
    await validateRolesOnUpdate(prisma, target.id, errors);
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    await prisma.users.update({
      where: { id: target.id },
      data: { deleted: true, email: `deleted-${Math.floor(Date.now() / 1000)}-${target.email}`, updated_at: new Date() },
    });

    // Security fix: revoke every outstanding refresh token for the
    // soft-deleted member - otherwise an offboarded/expelled member's
    // existing refresh cookie keeps working for up to 30 more days even
    // though fresh logins are already blocked (email mangled above).
    await revokeAllFamiliesForUser(target.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * Admin MFA reset: wipes every one of the target's MFA credential rows,
 * force-mints a password-reset token (mirrors passwordReset.ts's own
 * randomBytes(32) shape), revokes all of the target's refresh-token
 * families, and writes a server-side mfa_reset_events audit row.
 *
 * Known, deliberate scope gap (not a bug to fix here): the reset token
 * minted below is never emailed to the target, so this doesn't actually
 * force them through a password change - their existing password keeps
 * working for login. Sending the "your MFA was reset" notification email
 * is a natural follow-up but wasn't part of the approved spec for this task.
 */
router.post('/:uuid/mfa/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Security fix: req.currentUser reflects the JWT's `sub` claim, which
    // under an impersonation token is the IMPERSONATED user, not the real
    // actor (see middleware.ts's `impersonatorId`/`act` plumbing) - so the
    // self-target guard below is impersonation-blind: a hijacked Admin
    // session could impersonate any lesser-privileged-but-still-authorized
    // account (impersonation blocks admin targets and self, but not other
    // privileged roles), then use that impersonation token to target its
    // OWN original uuid, which no longer equals req.currentUser!.id and so
    // sails through the self-guard - wiping the real actor's MFA with the
    // audit row misattributed to the impersonated user. Rejecting outright
    // whenever an impersonation token is in play (regardless of target)
    // closes the whole class of "act as someone else to reach a route
    // you'd otherwise be blocked from" problems for this route, matching
    // me.ts's `gdpr_acceptance`/`announcement_subscription` handlers, which
    // apply the identical check for the identical reason (an admin-driven
    // session must never be able to perform a sensitive, attributable
    // action under cover of impersonation).
    if (req.impersonatorId !== undefined) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const target = await findMemberByUuid(uuidParam(req.params.uuid));
    if (!target) throw ApiError.notFound();

    // Security fix: this is an admin-only action - default_user_abilities'
    // unconditional `can(['update', ...], 'User', {id: user.id})` (see
    // ability.ts's defaultUserAbilities) would otherwise let ANY logged-in
    // member pass a `canUpdateRow` self-check with zero step-up proof,
    // letting a hijacked session token wipe its own MFA and then sail
    // straight through Task 11's proof-of-control gate on
    // `/mfa/setup/start` (which only triggers when a verified method
    // already exists). Guarding on identity first, unconditionally, closes
    // this for every role - including Admin, whose unconditional `manage`
    // grant (applicationAdminAbilities) would otherwise still satisfy
    // `canDestroyRow` for self too. `canDestroyRow` (not `canUpdateRow`) is
    // used below for the real authorization decision because - per its own
    // doc comment and DELETE /:uuid's existing precedent -
    // default_user_abilities never grants `destroy` at all, so it correctly
    // continues to allow UserAdmin/Secretary/NetDelegate/Admin to reset
    // ANY OTHER user's MFA (identical fallback branch to canUpdateRow) while
    // never self-granting via the default per-user rule.
    if (target.id === req.currentUser!.id) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const ability = req.ability!;
    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const showAdmins = await showAdminsConfig();
    const targetRoleNames = roleNamesOf(await loadRoleRowsForUser(target.id));
    const ctx: VisibilityContext = { ability, callerRoleNames, showAdmins };

    if (!canDestroyRow(ctx, target, targetRoleNames)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const resetToken = randomBytes(32).toString('hex');

    // Security fix: fold the reset-token write and the audit-row write into
    // the SAME transaction as the five MFA-table deletes, not two separate
    // awaits after it - otherwise a crash between the deletes committing and
    // the audit insert permanently wipes a target's MFA with no audit trail
    // at all. `revokeAllFamiliesForUser` deliberately stays OUTSIDE this
    // transaction - it calls the raw `prisma` client internally
    // (refreshToken.ts), not a passed-in `tx` handle, so it can't
    // participate without a larger refactor; it still runs right after the
    // transaction commits, same relative order as before.
    await prisma.$transaction([
      prisma.mfa_totp_credentials.deleteMany({ where: { user_id: target.id } }),
      prisma.mfa_email_credentials.deleteMany({ where: { user_id: target.id } }),
      prisma.mfa_passkey_credentials.deleteMany({ where: { user_id: target.id } }),
      prisma.mfa_backup_codes.deleteMany({ where: { user_id: target.id } }),
      prisma.mfa_trusted_devices.deleteMany({ where: { user_id: target.id } }),
      prisma.users.update({
        where: { id: target.id },
        data: {
          reset_password_token: createHash('sha256').update(resetToken).digest('hex'),
          reset_password_sent_at: new Date(),
        },
      }),
      prisma.mfa_reset_events.create({
        data: { admin_id: req.currentUser!.id, user_id: target.id, created_at: new Date() },
      }),
    ]);

    await revokeAllFamiliesForUser(target.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:uuid/impersonate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await findMemberByUuid(uuidParam(req.params.uuid));
    if (!target) throw ApiError.notFound();

    const ability = req.ability!;
    const targetRoleNames = await loadUserRoleNames(target.id);

    if (!canOn(ability, 'impersonate', target, targetRoleNames)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const now = new Date();
    await prisma.impersonation_events.create({
      data: {
        admin_id: BigInt(req.currentUser!.id),
        user_id: BigInt(target.id),
        remote_ip: req.ip ?? null,
        created_at: now,
        updated_at: now,
      },
    });

    const subscriptionCount = await prisma.announcement_subscriptions.count({ where: { user_id: target.id } });
    res.status(200).json({
      // Security fix: tags this token with `act` (the impersonating admin's
      // id) so it's distinguishable from a real login token - see
      // jwt.ts/middleware.ts and me.ts's impersonation gate.
      access_token: issueAccessToken(target.id, req.currentUser!.id),
      user: {
        id: target.id,
        email: target.email,
        firstname: target.firstname,
        lastname: target.lastname,
        subscribed_to_announcements: subscriptionCount > 0,
        gdpr_accepted: target.accepted_gdpr,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
