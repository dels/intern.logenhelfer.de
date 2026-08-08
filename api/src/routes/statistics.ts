import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import type { AppAbility } from '../authz/ability.js';
import { isAdmin, isNetDelegate, loadUserRoleNames } from '../authz/ability.js';
import { appConfig } from '../lib/appConfig.js';
import { parsePageParams } from '../lib/pagination.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/statistics_controller.rb.
 *
 * Every sub-report is gated on a distinct CASL action against the
 * `Statistic` subject (see api/src/authz/ability.ts's
 * defaultUserAbilities/memberOfCouncilAbilities/etc. - `file_stats`,
 * `mem_stats`, `downloads` are granted to every authenticated user by
 * default, while `user_stats`/`user_file_stats` require MemberOfCouncil (or
 * above) - a bare-role-less authenticated user gets none of the five).
 */

const router = Router();

router.use(authenticateApiUser);

function slice<T>(rows: T[], page: number, perPage: number): T[] {
  return rows.slice(page * perPage, page * perPage + perPage);
}

/**
 * Ruby string interpolation renders `nil` as an empty string, not the
 * literal text "null" JS template literals would produce - `file_stats`'s
 * `row_id` (`"#{filename}::#{attached_file_id}"`) depends on that exact
 * behavior when either half of the key is nil, so this replicates it instead
 * of using a plain template literal.
 */
function rubyToS(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Security hardening (not in the Rails controller, which returned IP fields
 * to every caller permitted to view these sub-reports): `user_stats`'s
 * `current_sign_in_ip` and `downloads`' `remote_ip` are peer-surveillance-
 * sensitive - several roles beyond Admin are granted access to these
 * sub-reports (see the module doc comment above), but only Admin/NetDelegate
 * should actually see the raw IP value. Everyone else gets the row with the
 * IP field nulled out (both `UserStatsRow.current_sign_in_ip` and
 * `DownloadRow.remote_ip` are `required`+`nullable: true` in openapi.yaml, so
 * nulling - not omitting the key - is what keeps response validation green).
 *
 * Demo mode: both reports are reachable by anyone with demo credentials,
 * and both IP fields there are real visitor traffic (not seeded fixture
 * data) - nulled for every caller, Admin/NetDelegate included, whenever
 * DEMO_MODE is set. Baked into this single helper (every call site routes
 * through it) rather than duplicated per call site, so any future
 * IP-bearing report inherits the same protection automatically instead of
 * needing to remember to add the check itself.
 */
function canSeeIpFields(callerRoleNames: readonly string[]): boolean {
  return (isAdmin(callerRoleNames) || isNetDelegate(callerRoleNames)) && process.env.DEMO_MODE !== 'true';
}

/** Port of User#fullname (rails-app/app/models/user.rb): compact + join(' '). */
function fullname(user: { firstname: string | null; lastname: string | null }): string {
  return [user.firstname, user.lastname].filter((part): part is string => part !== null && part !== undefined).join(' ');
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Generic allowlisted-column comparator factory, reused by every sub-report
 * below - each has its own distinct row shape/column set (and some columns,
 * like downloads' user_fullname or file_stats' count, are computed rather
 * than real DB columns Prisma could orderBy directly), but the same
 * nulls-last/desc-flip sort semantics apply everywhere else in this codebase
 * (see members.ts's sortComparator for the pattern this mirrors), so it's
 * written once here instead of four near-identical copies. An unknown/missing
 * sort param falls back to defaultField/defaultDirection entirely (never a
 * partially-applied direction on a rejected field).
 */
function sortComparatorFactory<T>(
  columns: readonly (keyof T & string)[],
  defaultField: keyof T & string,
  defaultDirection: 'asc' | 'desc' = 'asc',
) {
  return (sortParam: unknown): ((a: T, b: T) => number) => {
    const raw = firstString(sortParam) ?? '';
    const rawField = raw.replace(/^-/, '');
    const isKnown = (columns as readonly string[]).includes(rawField);
    const column = (isKnown ? rawField : defaultField) as keyof T & string;
    const desc = isKnown ? raw.startsWith('-') : defaultDirection === 'desc';

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
  };
}

/**
 * Port of User#age (rails-app/app/models/user.rb L346-349). `date_of_birth`
 * is a NOT-NULL-validated column at the Rails model layer
 * (`validates_presence_of :date_of_birth`) - every undeleted user reaching
 * this code path is assumed to have one, exactly as the Ruby method assumes
 * (it would raise NoMethodError on a nil date_of_birth too).
 */
function age(dateOfBirth: Date): number {
  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  const nowDay = now.getUTCDate();
  const dobYear = dateOfBirth.getUTCFullYear();
  const dobMonth = dateOfBirth.getUTCMonth();
  const dobDay = dateOfBirth.getUTCDate();

  const birthdayPassedThisYear = nowMonth > dobMonth || (nowMonth === dobMonth && nowDay >= dobDay);
  return nowYear - dobYear - (birthdayPassedThisYear ? 0 : 1);
}

/**
 * Port of `AppConfig[:max_db_mem_size].to_i` (rails-app/app/models/app_config.rb)
 * via the shared AppConfigService (api/src/lib/appConfig.ts), which already
 * owns the `app_config_adapters` cache/lookup/default-value logic - `max_db_mem_size`
 * is a `'string'`-typed key there (Rails stores/reads it as a string too,
 * applying `.to_i` only at the call site), so the `.to_i` cast happens here,
 * matching Ruby's `nil.to_i == 0` fallback for the (KNOWN_KEYS-guaranteed-non-null-here) edge case.
 */
async function maxDbMemSizeBytes(): Promise<number> {
  const raw = await appConfig.get('max_db_mem_size');
  if (raw === null) {
    return 0;
  }
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Server-side enforcement of the `users_can_view_statistics` AppConfig
 * toggle (api/src/lib/appConfig.ts) for the three sub-reports granted to
 * every authenticated user by default (file_stats/mem_stats/downloads - see
 * this module's doc comment above and ability.ts's defaultUserAbilities). A
 * caller who already holds the explicit `user_stats` grant
 * (MemberOfCouncil/NetDelegate/Secretary/Admin - see
 * memberOfCouncilAbilities/netDelegateAbilities/secretaryAbilities/
 * adminAbilities in ability.ts) always bypasses this gate - they have
 * elevated statistic access regardless of this AppConfig setting. Mirrors
 * (and must stay consistent with) me.ts's identically-scoped
 * `statisticsGatedForCaller`, which drives the client-facing nav/list
 * hiding - this function is the actual data-endpoint enforcement, since a
 * client-only hide is not sufficient (see this repo's CLAUDE.md
 * authorization requirements).
 */
async function statisticsViewingAllowedForCaller(ability: AppAbility): Promise<boolean> {
  if (ability.can('user_stats', 'Statistic')) {
    return true;
  }
  const enabled = await appConfig.get('users_can_view_statistics');
  return enabled !== false;
}

const USER_STATS_SORTABLE_COLUMNS = [
  'matriculation_number',
  'lastname',
  'firstname',
  'sign_in_count',
  'current_sign_in_at',
  'current_sign_in_ip',
] as const;
type UserStatsSortField = (typeof USER_STATS_SORTABLE_COLUMNS)[number];

/**
 * Same allowlisted-column pattern as events.ts's sortClause - real `users`
 * columns, so this stays a DB-level orderBy rather than the fetch-all-then-
 * JS-sort pattern the computed-column reports below need.
 *
 * `current_sign_in_ip` is excluded from the allowlist unless `canSeeIp` is
 * true - unlike `downloads`' `remote_ip` sort (which nulls the field out
 * *before* sorting the already-fetched rows, so an unprivileged caller's
 * null values carry no order information), this report's pagination/sort
 * happens directly in Prisma's `orderBy` against the real column, before any
 * masking. Allowing `sort=current_sign_in_ip` here for a caller who can't see
 * the value itself would leak IP ordering as a side channel even with the
 * response field nulled - see this file's `canSeeIpFields` doc comment.
 */
function userStatsSortClause(sortParam: unknown, canSeeIp: boolean): { field: UserStatsSortField; direction: 'asc' | 'desc' } {
  const raw = firstString(sortParam) ?? '';
  const field = raw.replace(/^-/, '');
  const allowedFields: readonly string[] = canSeeIp
    ? USER_STATS_SORTABLE_COLUMNS
    : USER_STATS_SORTABLE_COLUMNS.filter((c) => c !== 'current_sign_in_ip');
  if (!allowedFields.includes(field)) {
    return { field: 'current_sign_in_at', direction: 'desc' };
  }
  return { field: field as UserStatsSortField, direction: raw.startsWith('-') ? 'desc' : 'asc' };
}

// GET /api/v1/statistics/user_stats
router.get('/user_stats', async (req, res, next) => {
  try {
    if (!req.ability?.can('user_stats', 'Statistic')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    // canSeeIpFields() already folds in the DEMO_MODE check (see its own
    // doc comment) - reusing this single `canSeeIp` value for both the
    // response mapping below and the sort clause keeps the side-channel
    // protection (see userStatsSortClause's doc comment) in sync
    // automatically.
    const canSeeIp = canSeeIpFields(callerRoleNames);
    const { field, direction } = userStatsSortClause(req.query.sort, canSeeIp);

    const undeleted = await prisma.users.findMany({ where: { deleted: false }, select: { date_of_birth: true } });
    const avgAge =
      undeleted.length > 0
        ? Math.floor(undeleted.reduce((sum, u) => sum + age(u.date_of_birth as Date), 0) / undeleted.length)
        : 0;

    const scopeWhere = { deleted: false, current_sign_in_at: { not: null } } as const;
    const [rows, rowCount] = await Promise.all([
      prisma.users.findMany({
        where: scopeWhere,
        orderBy: { [field]: direction },
        skip: page * perPage,
        take: perPage,
        select: {
          uuid: true,
          matriculation_number: true,
          lastname: true,
          firstname: true,
          sign_in_count: true,
          current_sign_in_at: true,
          current_sign_in_ip: true,
        },
      }),
      prisma.users.count({ where: scopeWhere }),
    ]);

    res.status(200).json({
      avg_age: avgAge,
      rows: rows.map((u) => ({
        uuid: u.uuid,
        matriculation_number: u.matriculation_number,
        lastname: u.lastname,
        firstname: u.firstname,
        sign_in_count: u.sign_in_count,
        current_sign_in_at: u.current_sign_in_at ? u.current_sign_in_at.toISOString() : null,
        current_sign_in_ip: canSeeIp ? u.current_sign_in_ip : null,
      })),
      row_count: rowCount,
    });
  } catch (err) {
    next(err);
  }
});

const DOWNLOADS_SORTABLE_COLUMNS = ['filename', 'user_fullname', 'remote_ip', 'created_at'] as const;
interface DownloadRowJson {
  id: number;
  filename: string | null;
  user_fullname: string | null;
  remote_ip: string | null;
  created_at: string;
}
const downloadsSortComparator = sortComparatorFactory<DownloadRowJson>(DOWNLOADS_SORTABLE_COLUMNS, 'created_at', 'desc');

// GET /api/v1/statistics/downloads
router.get('/downloads', async (req, res, next) => {
  try {
    if (!req.ability?.can('downloads', 'Statistic')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (!(await statisticsViewingAllowedForCaller(req.ability!))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);

    const callerRoleNames = await loadUserRoleNames(req.currentUser!.id);
    const canSeeIp = canSeeIpFields(callerRoleNames);

    // `user_fullname` isn't a real file_downloads column (no Prisma relation
    // to users is declared) - a DB-level orderBy can't reach it, so this
    // fetches every undeleted download (like file_stats/user_file_stats
    // below already do for their own computed columns) and sorts/paginates
    // in JS instead of pushing pagination down to Prisma.
    const downloads = await prisma.file_downloads.findMany({ where: { deleted: false } });

    const userIds = [...new Set(downloads.map((d) => d.user_id).filter((id): id is number => id !== null))];
    const users =
      userIds.length > 0
        ? await prisma.users.findMany({ where: { id: { in: userIds } }, select: { id: true, firstname: true, lastname: true } })
        : [];
    const fullnameById = new Map(users.map((u) => [u.id, fullname(u)]));

    const rows: DownloadRowJson[] = downloads
      .map((d) => ({
        id: d.id,
        filename: d.filename,
        user_fullname: d.user_id !== null ? (fullnameById.get(d.user_id) ?? null) : null,
        remote_ip: canSeeIp ? d.remote_ip : null,
        created_at: d.created_at.toISOString(),
      }))
      .sort(downloadsSortComparator(req.query.sort));

    const rowCount = rows.length;
    const paged = slice(rows, page, perPage);

    res.status(200).json({ rows: paged, row_count: rowCount });
  } catch (err) {
    next(err);
  }
});

const FILE_STATS_SORTABLE_COLUMNS = ['filename', 'count'] as const;
interface FileStatsFlatRow {
  filename: string | null;
  attached_file_id: number | null;
  count: number;
}
const fileStatsSortComparator = sortComparatorFactory<FileStatsFlatRow>(FILE_STATS_SORTABLE_COLUMNS, 'count', 'desc');

// GET /api/v1/statistics/file_stats
router.get('/file_stats', async (req, res, next) => {
  try {
    if (!req.ability?.can('file_stats', 'Statistic')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (!(await statisticsViewingAllowedForCaller(req.ability!))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);

    const grouped = await prisma.file_downloads.groupBy({
      by: ['filename', 'attached_file_id'],
      where: { deleted: false },
      _count: { _all: true },
    });
    const flattened = grouped.map((g) => ({ filename: g.filename, attached_file_id: g.attached_file_id, count: g._count._all }));
    // Array#sort is stable (guaranteed by spec since ES2019/all supported
    // Node versions) - matches Ruby's `sort_by!` closely enough for the
    // deterministic (single distinct max count) case the Rails spec asserts.
    flattened.sort(fileStatsSortComparator(req.query.sort));

    const rowCount = flattened.length;
    const paged = slice(flattened, page, perPage);

    const attachedFileIds = [...new Set(paged.map((g) => g.attached_file_id).filter((id): id is number => id !== null))];
    const attachedFiles =
      attachedFileIds.length > 0
        ? await prisma.attached_files.findMany({ where: { id: { in: attachedFileIds }, deleted: false }, select: { id: true, uuid: true } })
        : [];
    const uuidById = new Map(attachedFiles.map((f) => [f.id, f.uuid]));

    res.status(200).json({
      rows: paged.map((g) => ({
        row_id: `${rubyToS(g.filename)}::${rubyToS(g.attached_file_id)}`,
        filename: g.filename,
        count: g.count,
        attached_file_uuid: g.attached_file_id !== null ? (uuidById.get(g.attached_file_id) ?? null) : null,
      })),
      row_count: rowCount,
    });
  } catch (err) {
    next(err);
  }
});

const USER_FILE_STATS_SORTABLE_COLUMNS = ['matriculation_number', 'lastname', 'firstname', 'count'] as const;
interface UserFileStatsFlatRow {
  id: number;
  uuid: string | null;
  matriculation_number: number | null;
  lastname: string | null;
  firstname: string | null;
  count: number;
}
const userFileStatsSortComparator = sortComparatorFactory<UserFileStatsFlatRow>(USER_FILE_STATS_SORTABLE_COLUMNS, 'count', 'desc');

// GET /api/v1/statistics/user_file_stats
router.get('/user_file_stats', async (req, res, next) => {
  try {
    if (!req.ability?.can('user_file_stats', 'Statistic')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);

    // Port of `User.joins(:file_downloads).group(:id, :uuid,
    // :matriculation_number, :lastname, :firstname).count` - an inner join,
    // and (unlike the other four sub-reports) NOT scoped to undeleted USERS -
    // a deleted user with download history still shows up here, matching the
    // Rails controller's plain `User.joins(...)` (no `.undeleted`).
    // `deleted: false` below is applied to FILE_DOWNLOADS, mirroring
    // FileDownload's own `default_scope { where(deleted: false) }`
    // (rails-app/app/models/file_download.rb) the same way the `downloads`/
    // `file_stats` sub-reports above do. NOTE (flagged, not fully verified):
    // whether ActiveRecord's `joins(:file_downloads)` actually applies the
    // *joined* model's default_scope to the join condition (vs. only to a
    // `FileDownload.where(...)` sourced query) is genuinely ambiguous Rails
    // behavior that the Rails spec never exercises (no example creates a
    // soft-deleted FileDownload here) - this keeps the same `deleted: false`
    // filter as the other reports as the most likely/sensible reading, but a
    // real Rails `to_sql` check would be needed to fully confirm it.
    const grouped = await prisma.file_downloads.groupBy({
      by: ['user_id'],
      where: { deleted: false, user_id: { not: null } },
      _count: { _all: true },
    });

    const userIds = grouped.map((g) => g.user_id).filter((id): id is number => id !== null);
    const users =
      userIds.length > 0
        ? await prisma.users.findMany({
            where: { id: { in: userIds } },
            select: { id: true, uuid: true, matriculation_number: true, lastname: true, firstname: true },
          })
        : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const combined = grouped
      .map((g) => {
        const user = g.user_id !== null ? userById.get(g.user_id) : undefined;
        return user ? { ...user, count: g._count._all } : undefined;
      })
      .filter((row): row is UserFileStatsFlatRow => row !== undefined);

    combined.sort(userFileStatsSortComparator(req.query.sort));

    const rowCount = combined.length;
    const paged = slice(combined, page, perPage);

    res.status(200).json({
      rows: paged.map((r) => ({
        uuid: r.uuid,
        matriculation_number: r.matriculation_number,
        lastname: r.lastname,
        firstname: r.firstname,
        count: r.count,
      })),
      row_count: rowCount,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/statistics/mem_stats
router.get('/mem_stats', async (req, res, next) => {
  try {
    if (!req.ability?.can('mem_stats', 'Statistic')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (!(await statisticsViewingAllowedForCaller(req.ability!))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const [userCount, eventCount, memoryUsed, memoryUsedInclArchived, maxDbMemSize] = await Promise.all([
      prisma.users.count({ where: { deleted: false } }),
      // Event.rb has `default_scope { where(deleted: false).order('date ASC') }`
      // (rails-app/app/models/event.rb L9) - `Event.count` in the Rails
      // controller therefore only counts undeleted events, not the full table.
      prisma.events.count({ where: { deleted: false } }),
      prisma.attached_files.aggregate({ where: { deleted: false }, _sum: { content_length: true } }),
      prisma.attached_files.aggregate({ _sum: { content_length: true } }),
      maxDbMemSizeBytes(),
    ]);

    res.status(200).json({
      user_count: userCount,
      event_count: eventCount,
      memory_used_bytes: memoryUsed._sum.content_length ?? 0,
      memory_used_incl_archived_bytes: memoryUsedInclArchived._sum.content_length ?? 0,
      max_db_mem_size_bytes: maxDbMemSize,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
