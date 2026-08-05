import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import type { users } from '../generated/prisma/client.js';

import { authenticateApiUser } from '../auth/middleware.js';
import { revokeAllFamiliesForUser } from '../auth/refreshToken.js';
import type { Action, AppAbility } from '../authz/ability.js';
import { toUserSubject } from '../authz/ability.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { isMfaSetupRequiredFor } from '../lib/mfaStatus.js';

/**
 * Port of rails-app/app/controllers/api/v1/me_controller.rb.
 *
 * Every action here is instance-scoped to `current_user` (self-service:
 * viewing your own profile+abilities, subscribing/unsubscribing yourself
 * from announcements, accepting GDPR, changing your own password) - unlike
 * most other resources, there is no separate `:index`/collection concept.
 */

const router = Router();

// Deliberately NOT `router.use(authenticateApiUser)` here: this router is
// mounted at bare '/api/v1' (see app.ts's comment on why), so a blanket
// router-level `.use()` would run for EVERY '/api/v1/*' request that reaches
// this router - including ones meant for a later-mounted router (e.g.
// publicRouter's '/api/v1/public/*') - before Express ever checks whether the
// path matches one of this router's own routes. That silently 401'd every
// public, unauthenticated endpoint (caught by api/e2e/securityBoundaries.spec.ts,
// a real bug, not a hypothetical one). Apply the middleware per-route instead,
// same as every other resource router that isn't mounted at a shared prefix.

// --- abilities_map (GET /me) ------------------------------------------------

/**
 * Port of MeController::EXPOSED_MODELS, paired with the underscored JSON key
 * ActiveSupport's `String#underscore` produces for each Rails model name
 * (`name.underscore` in the Ruby `abilities_map`).
 */
const EXPOSED_MODELS: ReadonlyArray<{ key: string; subject: string }> = [
  { key: 'event', subject: 'Event' },
  { key: 'external_event', subject: 'ExternalEvent' },
  // ExternalEventParticipant is a distinct CASL subject from ExternalEvent -
  // externalEvents.ts's confirm/remove-on-behalf-of routes gate on
  // `can('manage', 'ExternalEventParticipant')` specifically (only granted
  // together with `manage ExternalEvent` by workingPlanAdminAbilities, NOT by
  // applicationAdminAbilities, which grants the latter alone) - exposed here
  // so the frontend can gate its "Bestätigen" button on the actual subject
  // the backend checks, instead of (incorrectly) on `external_event`.
  { key: 'external_event_participant', subject: 'ExternalEventParticipant' },
  { key: 'user', subject: 'User' },
  { key: 'seeker', subject: 'Seeker' },
  { key: 'lodge', subject: 'Lodge' },
  { key: 'district', subject: 'District' },
  { key: 'category', subject: 'Category' },
  { key: 'announcement', subject: 'Announcement' },
  { key: 'directory', subject: 'Directory' },
  { key: 'attached_file', subject: 'AttachedFile' },
  // FileDownload is a real Rails model (so `safe_constantize` never skips
  // it), but ability.rb never mentions it in any `can`/`cannot` call, and
  // there is no `can :manage, :all` catch-all either - so this key is
  // unconditionally `[]` for every user in Rails, and the probe below
  // reproduces that faithfully (rather than hardcoding `[]`) by asking the
  // real ability object, same as every other model here.
  { key: 'file_download', subject: 'FileDownload' },
  { key: 'officer', subject: 'Officer' },
  { key: 'role', subject: 'Role' },
  { key: 'statistic', subject: 'Statistic' },
  { key: 'app_config', subject: 'AppConfig' },
];

/** Port of MeController::ACTIONS. */
const CRUD_ACTIONS = ['read', 'create', 'update', 'destroy'] as const;

/**
 * Port of MeController::STATISTIC_ACTIONS - Statistic has no CRUD actions at
 * all in ability.rb; its rules use these six action names instead (mirroring
 * the legacy StatisticsController's actions - see the Rails controller's own
 * comment on this constant).
 */
const STATISTIC_ACTIONS = ['index', 'user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'] as const;

/**
 * `AppAbility#can` (api/src/authz/ability.ts) is typed against a closed
 * `Action`/`SubjectName` union built from every action/subject symbol that
 * actually appears in a `can`/`cannot` call in ability.rb. Two of the probes
 * this map needs fall outside that closed set on purpose:
 *
 *  - `:read` is never a literal grant action anywhere in ability.rb - CanCan's
 *    `:read` is a *query-side* alias for `:index`/`:show` - so it was never
 *    added to `Action`. It's still meaningful to probe at runtime though:
 *    CASL's `:manage` (like CanCan's) matches any action, so `can('read', X)`
 *    is true exactly when a `can('manage', X)` rule exists, matching Rails'
 *    behavior (`ability.can?(:read, Klass)` is only ever true via a `:manage`
 *    rule in ability.rb - grep confirms no rule grants literal `:read`).
 *  - `'FileDownload'` is never a subject in ability.rb, so it isn't part of
 *    `SubjectName` either.
 *
 * Both are legal to query against the real CASL ability at runtime (it just
 * checks its actual rule set and returns false for anything unregistered) -
 * this narrower ad-hoc signature is used for the probe below instead of
 * widening ability.ts's own exported types (out of this task's file
 * boundary).
 */
interface AbilityProbe {
  can(action: string, subjectType: string): boolean;
}

function abilitiesMap(ability: AppAbility): Record<string, string[]> {
  const probe = ability as unknown as AbilityProbe;
  const map: Record<string, string[]> = {};
  for (const { key, subject } of EXPOSED_MODELS) {
    const actions: readonly string[] = subject === 'Statistic' ? STATISTIC_ACTIONS : CRUD_ACTIONS;
    map[key] = actions.filter((action) => probe.can(action, subject));
  }
  return map;
}

// --- auth_json (User#auth_json) --------------------------------------------

interface MeUserPayload {
  id: number;
  uuid: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  subscribed_to_announcements: boolean;
  gdpr_accepted: boolean | null;
  birthday_calendar_consent: boolean;
  birthday_calendar_consent_requested: boolean;
}

type AuthJsonUser = Pick<users, 'id' | 'uuid' | 'email' | 'firstname' | 'lastname' | 'accepted_gdpr' | 'birthday_calendar_consent'>;

/**
 * Port of User#auth_json (rails-app/app/models/user.rb). Duplicated from
 * api/src/routes/session.ts's identical private (unexported) helper rather
 * than imported - this task's file boundaries don't permit editing
 * session.ts (owned by another in-flight task) to export it; see this task's
 * final report for the flag.
 *
 * `uuid` was added on top of the original Rails `auth_json` port so the
 * frontend can address the current user via the existing
 * `/api/v1/members/:uuid` self-service endpoints (see account editing task) -
 * a deliberate product addition, not part of the Rails-fidelity port.
 * `users.uuid` is a nullable column in the Prisma schema (legacy backfill
 * column), but openapi.yaml's `MeUser.uuid` is a required, non-nullable
 * string (matching the `Member`/`holder_uuid` convention elsewhere in this
 * migration - see members.ts's `holder_uuid: holder.uuid ?? ''`) - coalesce
 * to `''` rather than widen the contract to `nullable: true`, since every
 * real user is expected to have a uuid and a blank string is a safer failure
 * mode than a response-validation 500.
 */
/**
 * Whether the frontend should show the birthday-calendar opt-in switch at
 * all - true only when the feature is enabled AND the admin has chosen
 * per-member consent (not "blanket" - see this repo's CLAUDE.md/design spec
 * for the "Zustimmung aller Brüder anderweitig eingeholt" mode, where no
 * per-member switch is shown because there's nothing for the member to
 * opt into individually).
 */
async function birthdayCalendarConsentRequested(): Promise<boolean> {
  if ((await appConfig.get('birthday_calendar_available')) !== true) {
    return false;
  }
  return (await appConfig.get('birthday_calendar_consent_mode')) === 'individual';
}

async function authJsonFor(user: AuthJsonUser): Promise<MeUserPayload> {
  const subscriptionCount = await prisma.announcement_subscriptions.count({ where: { user_id: user.id } });
  return {
    id: user.id,
    uuid: user.uuid ?? '',
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    subscribed_to_announcements: subscriptionCount > 0,
    gdpr_accepted: user.accepted_gdpr,
    birthday_calendar_consent: user.birthday_calendar_consent,
    birthday_calendar_consent_requested: await birthdayCalendarConsentRequested(),
  };
}

/**
 * Statistic actions granted unconditionally to every authenticated user via
 * Ability#default_user_abilities (ability.ts's defaultUserAbilities -
 * `can(['index', 'file_stats', 'mem_stats', 'downloads'], 'Statistic')`).
 * These four - and only these four - are subject to the
 * `users_can_view_statistics` AppConfig gate below - `user_stats`/
 * `user_file_stats` are never granted to a caller this gate would apply to
 * in the first place (they require memberOfCouncilAbilities or above, which
 * always bypasses the gate), so they're deliberately left out of this list.
 */
const STATISTICS_GATE_ACTIONS: readonly string[] = ['index', 'file_stats', 'mem_stats', 'downloads'];

/**
 * Whether the `users_can_view_statistics` AppConfig flag should hide the
 * default-user-tier Statistic grants (STATISTICS_GATE_ACTIONS above) from
 * this caller's ability map. A caller who already holds the explicit
 * `user_stats` grant (MemberOfCouncil/NetDelegate/Secretary/Admin) always
 * bypasses this gate. Mirrors statistics.ts's identically-scoped
 * `statisticsViewingAllowedForCaller` (inverted sense) - this is the
 * client-facing half of the same check: hiding the nav item and the report
 * links here, 403ing the actual data endpoints there. Neither alone is
 * sufficient (see this repo's CLAUDE.md authorization requirements) - both
 * exist on purpose.
 */
async function statisticsGatedForCaller(ability: AppAbility): Promise<boolean> {
  if (ability.can('user_stats', 'Statistic')) {
    return false;
  }
  const enabled = await appConfig.get('users_can_view_statistics');
  return enabled === false;
}

/**
 * Whether this caller's `abilities.seeker` should be given the synthetic
 * `names_list` hint - the frontend-facing half of seekers.ts's identically-
 * scoped `seekerNamesListAllowedForCaller` (same rationale: a caller who
 * already holds full Seeker read access via Admin/WorshipfulMaster/
 * MemberOfCouncil never gets this, regardless of the AppConfig flag - see
 * that function's own comment for why this is what excludes the Worshipful
 * Master). `names_list` is not a real CASL action (ability.ts's buildAbility
 * has no DB access to consult the AppConfig flag), so it's added here as a
 * plain string the frontend can check for, same idea as the `read` probe
 * this map already synthesizes from `manage` rules.
 */
async function seekerNamesListAllowedForCaller(ability: AppAbility): Promise<boolean> {
  if (ability.can('index', 'Seeker')) {
    return false;
  }
  return (await appConfig.get('show_seeker_names_to_brothers')) === true;
}

async function meJson(user: AuthJsonUser, ability: AppAbility): Promise<{ user: MeUserPayload; abilities: Record<string, string[]>; mfa_setup_required: boolean }> {
  const abilities = abilitiesMap(ability);
  if (await statisticsGatedForCaller(ability)) {
    abilities.statistic = (abilities.statistic ?? []).filter((action) => !STATISTICS_GATE_ACTIONS.includes(action));
  }
  if (await seekerNamesListAllowedForCaller(ability)) {
    abilities.seeker = [...(abilities.seeker ?? []), 'names_list'];
  }
  return { user: await authJsonFor(user), abilities, mfa_setup_required: await isMfaSetupRequiredFor(user.id) };
}

/**
 * Port of `params.require(:key)` - see session.ts's identical helper for the
 * exact semantics duplicated here (same file-boundary rationale as
 * authJsonFor above).
 */
function requireParam(body: unknown, key: string): string {
  const value = (body as Record<string, unknown> | null | undefined)?.[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    throw ApiError.badRequest(`param is missing or the value is empty: ${key}`);
  }
  return String(value);
}

/**
 * Port of `ActiveModel::Type::Boolean.new.cast` (used by
 * `update_announcement_subscription` on `params[:subscribed]`): an empty
 * string (or a missing/nil value) casts to a falsy value, and any value in
 * `FALSE_VALUES` casts to `false` - everything else (including any other
 * non-blank string) casts to `true`.
 */
const RAILS_BOOLEAN_FALSE_VALUES = new Set<unknown>([false, 0, '0', 'f', 'F', 'false', 'FALSE', 'off', 'OFF']);

function castRailsBoolean(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  return !RAILS_BOOLEAN_FALSE_VALUES.has(value);
}

// Devise's password validations (rails-app/config/initializers/devise.rb:
// `config.password_length = 8..128`) plus its confirmation validation - both
// enforced here so `update_password` matches `current_user.save`'s actual
// validation set, not just the current_password check the Rails controller
// itself does inline. Messages match rails-app/config/locales/de.yml's
// `errors.messages.confirmation`/`too_short` combined with the
// `activerecord.attributes.user.password` human name ("Password"), i.e. the
// real `errors.full_messages` output Rails would produce for this model/locale.
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 12;

/**
 * `AppAbility#can`'s second parameter is typed as the plain `SubjectName`
 * string union (see `AppAbility`'s definition in api/src/authz/ability.ts) -
 * CASL only widens that to accept a `subject('User', {...})`-tagged instance
 * when the ability's subject type parameter is the richer `Subject`/
 * `SubjectClass` shape, which `AppAbility` doesn't use. Every *instance*-level
 * check this controller needs (`accept_gdpr`/`update_password`/
 * `update_announcement_subscription`, each scoped to `id: user.id` in
 * ability.rb) has to go through `toUserSubject`, so - exactly like
 * ability.ts's own `Grant` interface cast (see its doc comment) bridges an
 * analogous mismatch for `can`/`cannot` at rule-definition time - this is the
 * one place that bridges it for `can?` at query time, rather than widening
 * ability.ts's own exported types (out of this task's file boundary).
 */
interface InstanceAbilityProbe {
  can(action: Action, subject: object): boolean;
}

function canOnSelf(ability: AppAbility, action: Action, user: users): boolean {
  return (ability as unknown as InstanceAbilityProbe).can(action, toUserSubject(user));
}

// --- routes ------------------------------------------------------------

router.get('/me', authenticateApiUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.currentUser!;
    const ability = req.ability!;
    res.status(200).json(await meJson(user, ability));
  } catch (err) {
    next(err);
  }
});

router.patch('/me/announcement_subscription', authenticateApiUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.currentUser!;
    const ability = req.ability!;

    // Security fix: an admin impersonating a member must not be able to
    // change the member's own announcement-subscription consent under the
    // member's identity, with no trace back to the admin - see
    // jwt.ts/middleware.ts's `act`/`impersonatorId` plumbing.
    if (req.impersonatorId !== undefined) {
      res.status(403).json({ error: 'forbidden_while_impersonating' });
      return;
    }

    if (!canOnSelf(ability, 'update_announcement_subscription', user)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    if (castRailsBoolean((req.body as Record<string, unknown> | undefined)?.subscribed)) {
      const existing = await prisma.announcement_subscriptions.findFirst({ where: { user_id: user.id } });
      if (!existing) {
        const now = new Date();
        await prisma.announcement_subscriptions.create({ data: { user_id: user.id, created_at: now, updated_at: now } });
      }
    } else {
      await prisma.announcement_subscriptions.deleteMany({ where: { user_id: user.id } });
    }

    res.status(200).json(await meJson(user, ability));
  } catch (err) {
    next(err);
  }
});

router.patch('/me/gdpr_acceptance', authenticateApiUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.currentUser!;
    const ability = req.ability!;

    // Security fix: same impersonation gate as announcement_subscription
    // above - GDPR acceptance is a legally meaningful consent action, so it
    // must never be attributable to the impersonated member while an admin
    // is actually driving the session.
    if (req.impersonatorId !== undefined) {
      res.status(403).json({ error: 'forbidden_while_impersonating' });
      return;
    }

    if (!canOnSelf(ability, 'accept_gdpr', user)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await prisma.users.update({ where: { id: user.id }, data: { accepted_gdpr: true } });

    res.status(200).json(await meJson({ ...user, accepted_gdpr: true }, ability));
  } catch (err) {
    next(err);
  }
});

router.patch('/me/birthday_calendar_consent', authenticateApiUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.currentUser!;
    const ability = req.ability!;

    // Security fix precedent: same impersonation gate as
    // announcement_subscription/gdpr_acceptance above - this is a real
    // consent record (see this repo's CLAUDE.md: "member self-service
    // actions that create a consent/attribution record ... must not be
    // silently executable while impersonating"), so it must never be
    // attributable to the impersonated member while an admin is actually
    // driving the session.
    if (req.impersonatorId !== undefined) {
      res.status(403).json({ error: 'forbidden_while_impersonating' });
      return;
    }

    if (!canOnSelf(ability, 'update_birthday_calendar_consent', user)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // No Rails-boolean-cast helper needed here (unlike castRailsBoolean
    // above) - this is a net-new endpoint with no legacy param semantics to
    // match, and in production express-openapi-validator already rejects a
    // non-boolean `consent` before this handler ever runs.
    const consent = Boolean((req.body as { consent?: boolean } | undefined)?.consent);
    const updated = await prisma.users.update({ where: { id: user.id }, data: { birthday_calendar_consent: consent } });

    res.status(200).json(await meJson(updated, ability));
  } catch (err) {
    next(err);
  }
});

router.patch('/me/password', authenticateApiUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.currentUser!;
    const ability = req.ability!;

    // Security fix: an admin impersonating a member must not be able to
    // change the member's own password under the member's identity, with no
    // trace back to the admin - same rationale and pattern as this file's
    // announcement_subscription/gdpr_acceptance handlers above. Found during
    // a final whole-branch MFA review as an inconsistency (those two
    // siblings already had this guard, this one didn't) - not currently
    // exploitable on its own (there's no admin-set-arbitrary-password
    // endpoint for an impersonating admin to have produced the target's real
    // current password), but the guard belongs here on the same "silent,
    // unattributable mutation" principle regardless.
    if (req.impersonatorId !== undefined) {
      res.status(403).json({ error: 'forbidden_while_impersonating' });
      return;
    }

    if (!canOnSelf(ability, 'update_password', user)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const currentPassword = requireParam(req.body, 'current_password');
    const newPassword = requireParam(req.body, 'new_password');
    const newPasswordConfirmation = requireParam(req.body, 'new_password_confirmation');

    const currentPasswordValid = user.encrypted_password !== '' && (await bcrypt.compare(currentPassword, user.encrypted_password));
    if (!currentPasswordValid) {
      res.status(422).json({ error: 'unprocessable', detail: 'Aktuelles Passwort ist falsch' });
      return;
    }

    const errors: string[] = [];
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password ist zu kurz (nicht weniger als ${MIN_PASSWORD_LENGTH} Zeichen)`);
    }
    if (newPassword !== newPasswordConfirmation) {
      errors.push('Password stimmt nicht mit der Bestätigung überein');
    }
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const newEncryptedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.users.update({ where: { id: user.id }, data: { encrypted_password: newEncryptedPassword } });

    // Security fix: revoke every outstanding refresh token for this user so
    // a stolen/leaked refresh cookie doesn't survive a password change meant
    // to lock that session out - see refreshToken.ts's
    // revokeAllFamiliesForUser doc comment.
    await revokeAllFamiliesForUser(user.id);

    res.status(200).json(await meJson(user, ability));
  } catch (err) {
    next(err);
  }
});

export default router;
