import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/db.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const { sendEventRegistrationDigest } = await import('../../src/lib/eventRegistrationDigest.js');

async function makeEvent(overrides: Partial<{ title: string; host: string }> = {}) {
  const now = new Date();
  return prisma.external_events.create({
    data: {
      uuid: crypto.randomUUID(),
      title: overrides.title ?? 'Besuch',
      host: overrides.host ?? 'Loge X',
      location: 'Musterstadt',
      date: new Date(Date.UTC(2026, 8, 1)),
      time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
      created_by_id: 1,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

async function makeRole(name: string, email: string | null) {
  const now = new Date();
  return prisma.roles.create({ data: { name, display_name: name, email, created_at: now, updated_at: now } });
}

beforeEach(async () => {
  await resetDb();
  for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
  vi.mocked(sendMail).mockClear();
});

describe('sendEventRegistrationDigest', () => {
  it('does nothing when there are no unnotified registrations', async () => {
    const result = await sendEventRegistrationDigest();
    expect(result).toEqual({ recipients: [], eventCount: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('emails Secretary and JuniorDeacon role addresses with new registrations, then marks them notified', async () => {
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    await makeRole('JuniorDeacon', 'schaffer@example.test');
    const event = await makeEvent({ title: 'Sommerfest' });
    const user = await createUser({ firstname: 'Max', lastname: 'Mustermann' });
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    const result = await sendEventRegistrationDigest();

    expect(result.eventCount).toBe(1);
    expect(result.recipients.sort()).toEqual(['schaffer@example.test', 'schriftfuehrer@example.test']);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [[firstCall]] = vi.mocked(sendMail).mock.calls;
    expect(firstCall.to.split(',').sort()).toEqual(['schaffer@example.test', 'schriftfuehrer@example.test']);
    expect(firstCall.text).toContain('Sommerfest');
    expect(firstCall.text).toContain('Max Mustermann');

    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).not.toBeNull();
  });

  it('does not re-notify on a second run with no new registrations', async () => {
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    const event = await makeEvent();
    const user = await createUser();
    await prisma.external_event_participants.create({ data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() } });

    await sendEventRegistrationDigest();
    vi.mocked(sendMail).mockClear();
    const second = await sendEventRegistrationDigest();

    expect(second).toEqual({ recipients: [], eventCount: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('logs and skips sending when neither role has an email configured, leaving rows pending for the next run', async () => {
    await makeRole('Secretary', null);
    const event = await makeEvent();
    const user = await createUser();
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    const result = await sendEventRegistrationDigest();
    expect(result.recipients).toEqual([]);
    expect(sendMail).not.toHaveBeenCalled();

    // Critical: rows must NOT be marked notified when there's no recipient
    // to send to, or the registration is lost forever even once an admin
    // configures an address - the next nightly run must still pick it up.
    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).toBeNull();

    const rerun = await sendEventRegistrationDigest();
    expect(rerun.eventCount).toBe(1);
  });

  it('falls back to WorshipfulMaster when neither Secretary nor JuniorDeacon has an email configured', async () => {
    await makeRole('WorshipfulMaster', 'meister@example.test');
    const event = await makeEvent();
    const user = await createUser();
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    const result = await sendEventRegistrationDigest();

    expect(result.recipients).toEqual(['meister@example.test']);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0][0].to).toBe('meister@example.test');
    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).not.toBeNull();
  });

  it('still logs and skips sending when Secretary, JuniorDeacon, and WorshipfulMaster all lack an email', async () => {
    await makeRole('Secretary', null);
    await makeRole('WorshipfulMaster', null);
    const event = await makeEvent();
    const user = await createUser();
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    const result = await sendEventRegistrationDigest();

    expect(result.recipients).toEqual([]);
    expect(sendMail).not.toHaveBeenCalled();
    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).toBeNull();
  });

  it('BCCs every user holding the Admin role, using their personal email addresses', async () => {
    await makeRole('Secretary', 'secretary@example.test');
    const adminRole = await makeRole('Admin', null);
    const admin1 = await createUser({ email: 'admin1@example.test' });
    const admin2 = await createUser({ email: 'admin2@example.test' });
    const now = new Date();
    await prisma.user_roles.create({ data: { user_id: admin1.id, role_id: adminRole.id, created_at: now, updated_at: now } });
    await prisma.user_roles.create({ data: { user_id: admin2.id, role_id: adminRole.id, created_at: now, updated_at: now } });
    const event = await makeEvent();
    const registrant = await createUser();
    await prisma.external_event_participants.create({
      data: { user_id: registrant.id, external_event_id: event.id, created_at: now, updated_at: now },
    });

    await sendEventRegistrationDigest();

    expect(sendMail).toHaveBeenCalledTimes(1);
    const bcc = vi.mocked(sendMail).mock.calls[0][0].bcc;
    expect(bcc?.split(',').sort()).toEqual(['admin1@example.test', 'admin2@example.test']);
  });

  it('does not send a duplicate copy to each admin when both Secretary and JuniorDeacon are configured', async () => {
    await makeRole('Secretary', 'secretary@example.test');
    await makeRole('JuniorDeacon', 'deacon@example.test');
    const adminRole = await makeRole('Admin', null);
    const admin = await createUser({ email: 'admin1@example.test' });
    const now = new Date();
    await prisma.user_roles.create({ data: { user_id: admin.id, role_id: adminRole.id, created_at: now, updated_at: now } });
    const event = await makeEvent();
    const registrant = await createUser();
    await prisma.external_event_participants.create({
      data: { user_id: registrant.id, external_event_id: event.id, created_at: now, updated_at: now },
    });

    await sendEventRegistrationDigest();

    // One combined send, not one per "to" recipient - otherwise the admin
    // in bcc would receive one copy per role recipient.
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0][0].to.split(',').sort()).toEqual(['deacon@example.test', 'secretary@example.test']);
    expect(vi.mocked(sendMail).mock.calls[0][0].bcc).toBe('admin1@example.test');
  });

  it('excludes deleted admin users from the BCC list and omits bcc entirely when no admins exist', async () => {
    await makeRole('Secretary', 'secretary@example.test');
    const adminRole = await makeRole('Admin', null);
    const deletedAdmin = await createUser({ email: 'gone@example.test', deleted: true });
    const now = new Date();
    await prisma.user_roles.create({ data: { user_id: deletedAdmin.id, role_id: adminRole.id, created_at: now, updated_at: now } });
    const event = await makeEvent();
    const registrant = await createUser();
    await prisma.external_event_participants.create({
      data: { user_id: registrant.id, external_event_id: event.id, created_at: now, updated_at: now },
    });

    await sendEventRegistrationDigest();

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0][0].bcc).toBeUndefined();
  });

  it('leaves rows pending for retry when sendMail rejects', async () => {
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    await makeRole('JuniorDeacon', 'schaffer@example.test');
    const event = await makeEvent();
    const user = await createUser();
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    vi.mocked(sendMail).mockRejectedValueOnce(new Error('SMTP timeout'));

    const result = await sendEventRegistrationDigest();
    expect(result.recipients).toEqual([]);

    // Critical: a transient send failure must not silently and permanently
    // drop the registration - notified_at must remain null so the next
    // nightly run retries it.
    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).toBeNull();

    vi.mocked(sendMail).mockClear().mockResolvedValue(undefined);
    const rerun = await sendEventRegistrationDigest();
    expect(rerun.eventCount).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const reloadedAfterRetry = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloadedAfterRetry?.notified_at).not.toBeNull();
  });

  it('marks a stray participant row whose event was deleted as notified without emailing it', async () => {
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    const event = await makeEvent();
    const user = await createUser();
    const participant = await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });
    await prisma.external_events.update({ where: { id: event.id }, data: { deleted: true } });

    const result = await sendEventRegistrationDigest();

    expect(result).toEqual({ recipients: [], eventCount: 0 });
    expect(sendMail).not.toHaveBeenCalled();
    const reloaded = await prisma.external_event_participants.findUnique({ where: { id: participant.id } });
    expect(reloaded?.notified_at).not.toBeNull();
  });

  it('groups each email by event, listing only that event\'s own registrants', async () => {
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    const eventA = await makeEvent({ title: 'Sommerfest' });
    const eventB = await makeEvent({ title: 'Winterfeier' });
    const userA = await createUser({ firstname: 'Anna', lastname: 'Adler' });
    const userB = await createUser({ firstname: 'Bernd', lastname: 'Berger' });
    await prisma.external_event_participants.create({
      data: { user_id: userA.id, external_event_id: eventA.id, created_at: new Date(), updated_at: new Date() },
    });
    await prisma.external_event_participants.create({
      data: { user_id: userB.id, external_event_id: eventB.id, created_at: new Date(), updated_at: new Date() },
    });

    const result = await sendEventRegistrationDigest();

    expect(result.eventCount).toBe(2);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [[call]] = vi.mocked(sendMail).mock.calls;
    const blocks = call.text.split('\n\n');
    const sommerfestBlock = blocks.find((b) => b.includes('Sommerfest'));
    const winterfeierBlock = blocks.find((b) => b.includes('Winterfeier'));
    expect(sommerfestBlock).toContain('Anna Adler');
    expect(sommerfestBlock).not.toContain('Bernd Berger');
    expect(winterfeierBlock).toContain('Bernd Berger');
    expect(winterfeierBlock).not.toContain('Anna Adler');
  });

  it('sends an English digest when language is configured to "en"', async () => {
    await appConfig.set('language', 'en');
    await makeRole('Secretary', 'schriftfuehrer@example.test');
    const event = await makeEvent({ title: 'Garden Party', host: 'Lodge X' });
    const user = await createUser({ firstname: 'Anna', lastname: 'Adler' });
    await prisma.external_event_participants.create({
      data: { user_id: user.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() },
    });

    await sendEventRegistrationDigest();

    expect(sendMail).toHaveBeenCalledTimes(1);
    const [[call]] = vi.mocked(sendMail).mock.calls;
    expect(call.subject).toBe('New event registrations');
    expect(call.text).toContain('Dear Brothers');
    expect(call.text).toContain('Garden Party on 2026-09-01 at Lodge X:');
  });
});

async function makeInternalEvent(overrides: Partial<{ title: string; location: string }> = {}) {
  const now = new Date();
  return prisma.events.create({
    data: {
      uuid: crypto.randomUUID(),
      title: overrides.title ?? 'Loge-Abend',
      location: overrides.location ?? 'Logenhaus',
      whole_day: false,
      date: new Date(Date.UTC(2026, 8, 1)),
      time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
      created_by_id: 1,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

describe('sendEventRegistrationDigest - internal events', () => {
  it('includes pending internal-event registrations in the same mail', async () => {
    const event = await makeInternalEvent();
    const user = await createUser({ firstname: 'Max', lastname: 'Mustermann' });
    await prisma.event_participants.create({ data: { event_id: event.id, user_id: user.id, created_at: new Date(), updated_at: new Date() } });
    await makeRole('Secretary', 'secretary@example.test');
    await makeRole('JuniorDeacon', 'deacon@example.test');

    const result = await sendEventRegistrationDigest();

    expect(result.eventCount).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const body = vi.mocked(sendMail).mock.calls[0][0].text;
    expect(body).toContain('Loge-Abend');
    expect(body).toContain('Max Mustermann');
  });

  it('combines internal and external registrations into one run', async () => {
    const internalEvent = await makeInternalEvent();
    const externalEvent = await makeEvent();
    const user = await createUser({ firstname: 'Max', lastname: 'Mustermann' });
    await prisma.event_participants.create({ data: { event_id: internalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() } });
    await prisma.external_event_participants.create({ data: { external_event_id: externalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() } });
    await makeRole('Secretary', 'secretary@example.test');
    await makeRole('JuniorDeacon', 'deacon@example.test');

    const result = await sendEventRegistrationDigest();

    expect(result.eventCount).toBe(2);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('marks an internal stray row (deleted event) notified immediately without sending', async () => {
    const event = await makeInternalEvent();
    const user = await createUser();
    const participant = await prisma.event_participants.create({ data: { event_id: event.id, user_id: user.id, created_at: new Date(), updated_at: new Date() } });
    await prisma.events.update({ where: { id: event.id }, data: { deleted: true } });

    const result = await sendEventRegistrationDigest();

    expect(result.eventCount).toBe(0);
    const updated = await prisma.event_participants.findUniqueOrThrow({ where: { id: participant.id } });
    expect(updated.notified_at).not.toBeNull();
  });

  it('leaves internal rows pending when sendMail throws', async () => {
    const event = await makeInternalEvent();
    const user = await createUser();
    const participant = await prisma.event_participants.create({ data: { event_id: event.id, user_id: user.id, created_at: new Date(), updated_at: new Date() } });
    await makeRole('Secretary', 'secretary@example.test');
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('smtp down'));

    await sendEventRegistrationDigest();

    const updated = await prisma.event_participants.findUniqueOrThrow({ where: { id: participant.id } });
    expect(updated.notified_at).toBeNull();
  });

  it('leaves BOTH internal and external pending rows untouched when sendMail throws', async () => {
    const internalEvent = await makeInternalEvent();
    const externalEvent = await makeEvent();
    const user = await createUser();
    const internalParticipant = await prisma.event_participants.create({
      data: { event_id: internalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() },
    });
    const externalParticipant = await prisma.external_event_participants.create({
      data: { external_event_id: externalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() },
    });
    await makeRole('Secretary', 'secretary@example.test');
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('smtp down'));

    await sendEventRegistrationDigest();

    const updatedInternal = await prisma.event_participants.findUniqueOrThrow({ where: { id: internalParticipant.id } });
    const updatedExternal = await prisma.external_event_participants.findUniqueOrThrow({ where: { id: externalParticipant.id } });
    expect(updatedInternal.notified_at).toBeNull();
    expect(updatedExternal.notified_at).toBeNull();
  });

  it('marks both internal and external rows notified once a mixed-registration send succeeds', async () => {
    const internalEvent = await makeInternalEvent();
    const externalEvent = await makeEvent();
    const user = await createUser();
    const internalParticipant = await prisma.event_participants.create({
      data: { event_id: internalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() },
    });
    const externalParticipant = await prisma.external_event_participants.create({
      data: { external_event_id: externalEvent.id, user_id: user.id, created_at: new Date(), updated_at: new Date() },
    });
    await makeRole('Secretary', 'secretary@example.test');

    await sendEventRegistrationDigest();

    const updatedInternal = await prisma.event_participants.findUniqueOrThrow({ where: { id: internalParticipant.id } });
    const updatedExternal = await prisma.external_event_participants.findUniqueOrThrow({ where: { id: externalParticipant.id } });
    expect(updatedInternal.notified_at).not.toBeNull();
    expect(updatedExternal.notified_at).not.toBeNull();
  });
});
