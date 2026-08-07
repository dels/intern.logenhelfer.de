import type { announcements as AnnouncementRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { enqueueMail } from '../lib/mailQueue.js';
import { mailStringsFor } from '../lib/mailStrings.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueUuid } from '../lib/uuid.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/announcements_controller.rb.
 *
 * rails-app/app/models/announcement.rb's `after_create` callback
 * (`notify_subscribers_new_announcement`) emails every
 * AnnouncementSubscription holder via UserMailer - ported below as
 * `notifySubscribers`. `after_update`'s equivalent is commented out in the
 * Rails source itself (never actually sent), so it's not ported here either.
 */

const router = Router();

router.use(authenticateApiUser);

// -- small helpers ------------------------------------------------------

/** Port of User#fullname (rails-app/app/models/user.rb L63-65). */
function fullname(user: { firstname: string | null; lastname: string | null }): string {
  return [user.firstname, user.lastname].filter((part): part is string => part !== null && part !== undefined).join(' ');
}

/**
 * Port of ActiveSupport's Object#blank? as applied by
 * `validates_presence_of :title, :message_body` - nil/undefined, whitespace-
 * only strings, and empty collections are blank; anything else (including
 * non-string scalars, which Rails' blank? treats as present) is not.
 */
function isBlank(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/** Coerces a permitted-param value to the string Prisma's `title`/`message_body` columns expect. */
function toStoredString(value: unknown): string {
  return typeof value === 'string' ? value : String(value);
}

/**
 * Port of the `validates_presence_of :title, :message_body, :created_by_id`
 * full_messages, in declaration order (created_by_id is always set from
 * current_user, so it never fails here).
 *
 * The app's `default_locale` is `:de` (rails-app/config/application.rb),
 * with German `activerecord.attributes.announcement.*`/`errors.messages.blank`
 * translations (rails-app/config/locales/de.yml) - so the real full_messages
 * are German ("<Attribut> muss ausgefüllt werden"), not the English
 * ActiveRecord defaults. Hardcoded here (not looked up from a locale file,
 * since no i18n setup exists in this API yet) to match that exactly.
 */
function presenceErrors(final: { title: unknown; message_body: unknown }): string[] {
  const errors: string[] = [];
  if (isBlank(final.title)) errors.push('Überschrift muss ausgefüllt werden');
  if (isBlank(final.message_body)) errors.push('Nachricht muss ausgefüllt werden');
  return errors;
}

/** Port of AnnouncementsController#announcement_summary_json. */
function summaryJson(a: Pick<AnnouncementRow, 'uuid' | 'title' | 'created_at'>): { uuid: string | null; title: string | null; created_at: string } {
  return { uuid: a.uuid, title: a.title, created_at: a.created_at.toISOString() };
}

const SORTABLE_COLUMNS = ['title', 'created_at'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT_FIELD: SortableColumn = 'created_at';
const DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'desc';

function isSortableColumn(value: string): value is SortableColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Same allowlisted-column sort pattern as events.ts's sortClause - unlike that one, an unknown/missing sort falls back to created_at DESC (this list's existing default), not asc. */
function sortClause(sortParam: unknown): { field: SortableColumn; direction: 'asc' | 'desc' } {
  const raw = firstString(sortParam) ?? '';
  const field = raw.replace(/^-/, '');
  if (!isSortableColumn(field)) return { field: DEFAULT_SORT_FIELD, direction: DEFAULT_SORT_DIRECTION };
  return { field, direction: raw.startsWith('-') ? 'desc' : 'asc' };
}

/** Port of AnnouncementsController#announcement_json. */
async function announcementJson(a: AnnouncementRow): Promise<{
  uuid: string | null;
  title: string | null;
  created_at: string;
  message_body: string | null;
  created_by_name: string;
  updated_by_name: string | null;
  updated_at: string;
}> {
  const [creator, updater] = await Promise.all([
    a.created_by_id !== null ? prisma.users.findUnique({ where: { id: a.created_by_id }, select: { firstname: true, lastname: true } }) : null,
    a.updated_by_id !== null ? prisma.users.findUnique({ where: { id: a.updated_by_id }, select: { firstname: true, lastname: true } }) : null,
  ]);

  return {
    ...summaryJson(a),
    message_body: a.message_body,
    // `created_by` is a required, validated association (validates_presence_of
    // :created_by_id) so this should never actually be missing in practice.
    created_by_name: creator ? fullname(creator) : '',
    updated_by_name: updater ? fullname(updater) : null,
    updated_at: a.updated_at.toISOString(),
  };
}

/** Mirrors Announcement's `default_scope { where(deleted: false) }` (rails-app/app/models/announcement.rb L9). */
function findVisibleAnnouncement(uuid: string): Promise<AnnouncementRow | null> {
  return prisma.announcements.findFirst({ where: { uuid, deleted: false } });
}

/**
 * Port of Announcement#notify_subscribers_new_announcement + UserMailer
 * #announcement_published_notification (subject/body text taken from
 * rails-app/config/locales/de.yml's `user_mailer.new_announcement_notification`
 * and rails-app/app/views/user_mailer/announcement_published_notification.text.erb -
 * no i18n setup exists in this API yet, same rationale as this file's
 * `presenceErrors` hardcoding German strings directly).
 *
 * ponytail: sent inline, awaited by the request (see the POST handler) -
 * no background job queue exists in this API. Fine at today's volume (one
 * admin action, a handful of subscribers); if that ever changes, add a real
 * queue (e.g. BullMQ, Redis is no longer provisioned though) rather than
 * blocking the response on a slow SMTP call.
 */
async function notifySubscribers(announcement: AnnouncementRow, creatorName: string): Promise<void> {
  const [subscriptions, domain, technicalContactEmail, language] = await Promise.all([
    prisma.announcement_subscriptions.findMany({ where: { user_id: { not: null } } }),
    appConfig.get('domain') as Promise<string | null>,
    appConfig.get('technical_contact_email') as Promise<string | null>,
    appConfig.get('language') as Promise<string | null>,
  ]);
  const userIds = subscriptions.map((s) => s.user_id).filter((id): id is number => id !== null);
  if (userIds.length === 0) return;
  const subscribers = await prisma.users.findMany({ where: { id: { in: userIds } }, select: { email: true, firstname: true } });
  const strings = mailStringsFor(language ?? 'de').announcementPublished;

  await Promise.all(
    subscribers.map((subscriber) =>
      enqueueMail({
        to: subscriber.email,
        subject: strings.subject(domain ?? ''),
        text: strings.body(subscriber.firstname ?? '', announcement.title ?? '', creatorName, domain ?? '', technicalContactEmail ?? ''),
      }),
    ),
  );
}

// -- routes ---------------------------------------------------------------

// GET /api/v1/announcements
router.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('index', 'Announcement')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const { field, direction } = sortClause(req.query.sort);

    const [rows, rowCount] = await Promise.all([
      prisma.announcements.findMany({
        where: { deleted: false },
        orderBy: { [field]: direction },
        skip: page * perPage,
        take: perPage,
      }),
      prisma.announcements.count({ where: { deleted: false } }),
    ]);

    res.status(200).json(buildListResponse(rows.map(summaryJson), rowCount));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/announcements
router.post('/', async (req, res, next) => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (!req.ability?.can('create', 'Announcement')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { title?: unknown; message_body?: unknown };
    const errors = presenceErrors({ title: body.title, message_body: body.message_body });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const uuid = await generateUniqueUuid((candidate) => prisma.announcements.findFirst({ where: { uuid: candidate } }).then(Boolean));
    const now = new Date();
    const created = await prisma.announcements.create({
      data: {
        uuid,
        title: toStoredString(body.title),
        message_body: toStoredString(body.message_body),
        created_by_id: user.id,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    const json = await announcementJson(created);
    // A failed notification shouldn't fail the announcement's own creation -
    // matches Rails' `deliver_later` decoupling the mail from the request,
    // just done inline (no job queue in this port; see notifySubscribers's doc).
    try {
      await notifySubscribers(created, json.created_by_name);
    } catch (err) {
      console.error('announcement notification failed', err);
    }
    res.status(201).json(json);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/announcements/:uuid
router.get('/:uuid', async (req, res, next) => {
  try {
    const existing = await findVisibleAnnouncement(req.params.uuid);
    if (!existing) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('show', 'Announcement')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    res.status(200).json(await announcementJson(existing));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/announcements/:uuid
router.patch('/:uuid', async (req, res, next) => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    // `set_announcement`'s before_action runs before the ability check in
    // Rails, so an unknown uuid 404s even for a role that would also fail
    // the ability check - matched here by looking the record up first.
    const existing = await findVisibleAnnouncement(req.params.uuid);
    if (!existing) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('update', 'Announcement')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { title?: unknown; message_body?: unknown };
    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasMessageBody = Object.prototype.hasOwnProperty.call(body, 'message_body');
    const finalTitle = hasTitle ? body.title : existing.title;
    const finalMessageBody = hasMessageBody ? body.message_body : existing.message_body;

    const errors = presenceErrors({ title: finalTitle, message_body: finalMessageBody });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const data: { updated_by_id: number; updated_at: Date; title?: string; message_body?: string } = {
      updated_by_id: user.id,
      updated_at: new Date(),
    };
    if (hasTitle) data.title = toStoredString(finalTitle);
    if (hasMessageBody) data.message_body = toStoredString(finalMessageBody);

    const updated = await prisma.announcements.update({ where: { id: existing.id }, data });

    res.status(200).json(await announcementJson(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/announcements/:uuid
router.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await findVisibleAnnouncement(req.params.uuid);
    if (!existing) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('destroy', 'Announcement')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await prisma.announcements.update({ where: { id: existing.id }, data: { deleted: true, updated_at: new Date() } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
