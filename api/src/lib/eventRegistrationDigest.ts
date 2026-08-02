import { prisma } from '../db.js';
import { appConfig } from './appConfig.js';
import { sendMail } from './mail.js';
import { mailStringsFor, type MailStrings } from './mailStrings.js';

/**
 * Nightly email to the Secretary ("Korr. Schriftführer") and JuniorDeacon
 * ("2. Schaffer") roles' configured mailboxes (`roles.email` - a static
 * per-role address, not necessarily the current holder's personal one),
 * listing every event registration (internal AND external) made since the
 * last digest. Falls back to WorshipfulMaster's configured mailbox if
 * neither has an email set. Every send is BCC'd to the personal email of
 * each non-deleted user currently holding the Admin role. Originally
 * external-only; generalized to also cover `event_participants` once
 * internal-event registration shipped.
 *
 * Internal and external registrations are collected independently (their
 * participant tables have different PK types - BigInt vs Int - and
 * different parent-event tables), then combined into a single mail body
 * and a single send. Each side's rows only advance past `notified_at` once
 * mail delivery is confirmed for ALL recipients: a stray row (event
 * deleted) is marked notified immediately; a real row is left pending on
 * any failure so the next nightly run retries it.
 */

const DIGEST_ROLE_NAMES = ['Secretary', 'JuniorDeacon'];
const FALLBACK_ROLE_NAME = 'WorshipfulMaster';
const ADMIN_ROLE_NAME = 'Admin';

function fullname(user: { firstname: string | null; lastname: string | null }): string {
  return [user.firstname, user.lastname].filter((p): p is string => !!p).join(' ');
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface DigestResult {
  recipients: string[];
  eventCount: number;
}

interface CollectResult {
  lines: string[];
  eventCount: number;
  validIds: number[];
  strayIds: number[];
}

type DigestStrings = MailStrings['eventRegistrationDigest'];

async function collectExternal(strings: DigestStrings): Promise<CollectResult> {
  const pending = await prisma.external_event_participants.findMany({ where: { notified_at: null } });
  if (pending.length === 0) return { lines: [], eventCount: 0, validIds: [], strayIds: [] };

  const eventIds = [...new Set(pending.map((p) => p.external_event_id).filter((id): id is number => id !== null))];
  const events = eventIds.length > 0 ? await prisma.external_events.findMany({ where: { id: { in: eventIds }, deleted: false } }) : [];
  const eventsById = new Map(events.map((e) => [e.id, e]));

  const byEvent = new Map<number, typeof pending>();
  const strayIds: number[] = [];
  for (const participant of pending) {
    if (participant.external_event_id === null || !eventsById.has(participant.external_event_id)) {
      strayIds.push(participant.id);
      continue;
    }
    const bucket = byEvent.get(participant.external_event_id);
    if (bucket) bucket.push(participant);
    else byEvent.set(participant.external_event_id, [participant]);
  }

  if (byEvent.size === 0) return { lines: [], eventCount: 0, validIds: [], strayIds };

  const userIds = [...new Set([...byEvent.values()].flat().map((p) => p.user_id).filter((id): id is number => id !== null))];
  const users = userIds.length > 0 ? await prisma.users.findMany({ where: { id: { in: userIds } } }) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const lines: string[] = [];
  for (const [eventId, participants] of byEvent) {
    const event = eventsById.get(eventId);
    if (!event) continue;
    lines.push(strings.externalLine(event.title, formatDateOnly(event.date), event.host ?? strings.unknownHost));
    for (const participant of participants) {
      const user = participant.user_id !== null ? usersById.get(participant.user_id) : undefined;
      const suffix = participant.festive_board ? strings.festiveBoardSuffix : '';
      lines.push(strings.participantLine(`${user ? fullname(user) : strings.unknownParticipant}${suffix}`));
    }
    lines.push('');
  }

  return { lines, eventCount: byEvent.size, validIds: [...byEvent.values()].flat().map((p) => p.id), strayIds };
}

async function collectInternal(strings: DigestStrings): Promise<CollectResult> {
  const pending = await prisma.event_participants.findMany({ where: { notified_at: null } });
  if (pending.length === 0) return { lines: [], eventCount: 0, validIds: [], strayIds: [] };

  const eventIds = [...new Set(pending.map((p) => p.event_id).filter((id): id is number => id !== null))];
  const events = eventIds.length > 0 ? await prisma.events.findMany({ where: { id: { in: eventIds }, deleted: false } }) : [];
  const eventsById = new Map(events.map((e) => [e.id, e]));

  const byEvent = new Map<number, typeof pending>();
  const strayIds: number[] = [];
  for (const participant of pending) {
    if (participant.event_id === null || !eventsById.has(participant.event_id)) {
      strayIds.push(Number(participant.id));
      continue;
    }
    const bucket = byEvent.get(participant.event_id);
    if (bucket) bucket.push(participant);
    else byEvent.set(participant.event_id, [participant]);
  }

  if (byEvent.size === 0) return { lines: [], eventCount: 0, validIds: [], strayIds };

  const userIds = [...new Set([...byEvent.values()].flat().map((p) => p.user_id).filter((id): id is number => id !== null))];
  const users = userIds.length > 0 ? await prisma.users.findMany({ where: { id: { in: userIds } } }) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const lines: string[] = [];
  for (const [eventId, participants] of byEvent) {
    const event = eventsById.get(eventId);
    if (!event) continue;
    lines.push(strings.internalLine(event.title ?? '', formatDateOnly(event.date), event.location ?? strings.unknownLocation));
    for (const participant of participants) {
      const user = participant.user_id !== null ? usersById.get(participant.user_id) : undefined;
      const suffix = participant.festive_board ? strings.festiveBoardSuffix : '';
      lines.push(strings.participantLine(`${user ? fullname(user) : strings.unknownParticipant}${suffix}`));
    }
    lines.push('');
  }

  return { lines, eventCount: byEvent.size, validIds: [...byEvent.values()].flat().map((p) => Number(p.id)), strayIds };
}

/** Personal email addresses of every non-deleted user holding the Admin role, for BCC. */
async function adminBccAddresses(): Promise<string[]> {
  const adminRole = await prisma.roles.findFirst({ where: { name: ADMIN_ROLE_NAME } });
  if (!adminRole) return [];
  const holders = await prisma.user_roles.findMany({ where: { role_id: adminRole.id } });
  const userIds = holders.map((h) => h.user_id).filter((id): id is number => id !== null);
  if (userIds.length === 0) return [];
  const users = await prisma.users.findMany({ where: { id: { in: userIds }, deleted: false } });
  return users.map((u) => u.email).filter((email): email is string => !!email);
}

export async function sendEventRegistrationDigest(): Promise<DigestResult> {
  const language = ((await appConfig.get('language')) as string | null) ?? 'de';
  const strings = mailStringsFor(language).eventRegistrationDigest;
  const [internal, external] = await Promise.all([collectInternal(strings), collectExternal(strings)]);

  if (internal.strayIds.length > 0) {
    await prisma.event_participants.updateMany({ where: { id: { in: internal.strayIds } }, data: { notified_at: new Date() } });
  }
  if (external.strayIds.length > 0) {
    await prisma.external_event_participants.updateMany({ where: { id: { in: external.strayIds } }, data: { notified_at: new Date() } });
  }

  const eventCount = internal.eventCount + external.eventCount;
  if (eventCount === 0) {
    return { recipients: [], eventCount: 0 };
  }

  const roles = await prisma.roles.findMany({ where: { name: { in: DIGEST_ROLE_NAMES } } });
  let recipients = roles.map((r) => r.email).filter((email): email is string => !!email);

  if (recipients.length === 0) {
    const fallbackRole = await prisma.roles.findFirst({ where: { name: FALLBACK_ROLE_NAME } });
    if (fallbackRole?.email) recipients = [fallbackRole.email];
  }

  if (recipients.length === 0) {
    console.error('event registration digest: no recipient email configured for Secretary/JuniorDeacon/WorshipfulMaster roles');
    return { recipients: [], eventCount };
  }

  const bcc = (await adminBccAddresses()).join(',') || undefined;
  const lines = [...internal.lines, ...external.lines];
  try {
    // One send with every recipient in `to`, not one sendMail per recipient -
    // otherwise each admin in `bcc` would get a duplicate copy per "to"
    // address (Secretary + JuniorDeacon normally both configured).
    await sendMail({
      to: recipients.join(','),
      bcc,
      subject: strings.subject,
      text: [strings.greeting, '', ...lines, '--', strings.footer].join('\n'),
    });
  } catch (error) {
    console.error('event registration digest: sendMail failed, leaving rows pending for retry', error);
    return { recipients: [], eventCount };
  }

  if (internal.validIds.length > 0) {
    await prisma.event_participants.updateMany({ where: { id: { in: internal.validIds } }, data: { notified_at: new Date() } });
  }
  if (external.validIds.length > 0) {
    await prisma.external_event_participants.updateMany({ where: { id: { in: external.validIds } }, data: { notified_at: new Date() } });
  }

  return { recipients, eventCount };
}
