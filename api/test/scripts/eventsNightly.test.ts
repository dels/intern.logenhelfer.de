import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';

// Mock the two functions the nightly orchestrator calls out to - this test
// is only about main()'s own orchestration (call syncAllActiveIcsSources,
// log its outcomes, then send the digest), not about per-source
// sync/error-isolation (test/lib/externalEventIcsSync.test.ts) or ICS
// parsing/email content (test/lib/eventRegistrationDigest.test.ts). Mocking
// syncAllActiveIcsSources itself (rather than syncExternalEventIcsSource,
// which it calls internally) is required here - vi.mock can't make one
// function of a module call a mocked sibling export from the same module,
// since same-module calls resolve via the module's own internal binding,
// not the externally re-exported object.
vi.mock('../../src/lib/externalEventIcsSync.js', () => ({ syncAllActiveIcsSources: vi.fn() }));
vi.mock('../../src/lib/eventRegistrationDigest.js', () => ({ sendEventRegistrationDigest: vi.fn() }));

const { syncAllActiveIcsSources } = await import('../../src/lib/externalEventIcsSync.js');
const { sendEventRegistrationDigest } = await import('../../src/lib/eventRegistrationDigest.js');
const { main } = await import('../../scripts/eventsNightly.js');

async function makeSourceUser(): Promise<number> {
  const now = new Date();
  const user = await prisma.users.create({ data: { email: `nightly-${Date.now()}-${Math.random()}@example.test`, created_at: now, updated_at: now } });
  return user.id;
}

async function makeSource(name: string, createdById: number) {
  const now = new Date();
  return prisma.external_event_ics_sources.create({
    data: {
      uuid: crypto.randomUUID(),
      name,
      url: `https://example.test/${encodeURIComponent(name)}.ics`,
      created_by_id: createdById,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

beforeEach(async () => {
  await resetDb();
  vi.mocked(syncAllActiveIcsSources).mockReset();
  vi.mocked(sendEventRegistrationDigest).mockReset();
});

describe('eventsNightly main()', () => {
  it('syncs every active source (via syncAllActiveIcsSources) and still sends the digest when all syncs succeed', async () => {
    const createdById = await makeSourceUser();
    await makeSource('Loge A', createdById);

    vi.mocked(syncAllActiveIcsSources).mockResolvedValue([
      { source: { id: 1, name: 'Loge A' }, result: { created: 1, updated: 0, removed: 0 } },
    ]);
    vi.mocked(sendEventRegistrationDigest).mockResolvedValue({ recipients: ['schriftfuehrer@example.test'], eventCount: 1 });

    await expect(main()).resolves.toBeUndefined();

    expect(syncAllActiveIcsSources).toHaveBeenCalledTimes(1);
    expect(syncAllActiveIcsSources).toHaveBeenCalledWith(expect.any(Function));
    expect(sendEventRegistrationDigest).toHaveBeenCalledTimes(1);
  });

  it('isolates one source\'s sync failure: the digest still sends, and main() doesn\'t reject', async () => {
    const createdById = await makeSourceUser();
    await makeSource('Loge A', createdById);
    await makeSource('Loge B (broken feed)', createdById);

    vi.mocked(syncAllActiveIcsSources).mockResolvedValue([
      { source: { id: 1, name: 'Loge A' }, result: { created: 1, updated: 0, removed: 0 } },
      { source: { id: 2, name: 'Loge B (broken feed)' }, error: new Error('feed unreachable') },
    ]);
    vi.mocked(sendEventRegistrationDigest).mockResolvedValue({ recipients: [], eventCount: 0 });

    // A per-source failure (already isolated inside syncAllActiveIcsSources)
    // must not make main() itself throw or skip the digest send.
    await expect(main()).resolves.toBeUndefined();

    expect(syncAllActiveIcsSources).toHaveBeenCalledTimes(1);
    expect(sendEventRegistrationDigest).toHaveBeenCalledTimes(1);
  });

  it('lets a genuinely fatal error (e.g. the digest send itself failing outright) propagate out of main()', async () => {
    const createdById = await makeSourceUser();
    await makeSource('Loge A', createdById);

    vi.mocked(syncAllActiveIcsSources).mockResolvedValue([]);
    vi.mocked(sendEventRegistrationDigest).mockRejectedValue(new Error('DB connection lost'));

    await expect(main()).rejects.toThrow('DB connection lost');
  });
});
