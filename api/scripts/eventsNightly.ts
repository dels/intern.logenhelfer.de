import { fileURLToPath } from 'node:url';

import { prisma } from '../src/db.js';
import { sendEventRegistrationDigest } from '../src/lib/eventRegistrationDigest.js';
import { syncAllActiveIcsSources } from '../src/lib/externalEventIcsSync.js';
import { closeMailQueue } from '../src/lib/mailQueue.js';
import { fetchIcsUrlSafely } from '../src/lib/safeIcsFetch.js';

/**
 * Entry point for the nightly cron job (see this plan's crontab handoff,
 * final task). Syncs every active ICS source (via syncAllActiveIcsSources -
 * shared with the in-process auto-sync scheduler in icsSyncScheduler.ts, so
 * per-source error isolation is defined and tested once), then sends the
 * registration digest. Each source's sync failure is logged and skipped, not
 * fatal - one broken feed shouldn't block the digest email or other
 * sources' syncs.
 *
 * Exported (rather than only invoked at the bottom of this file) so
 * test/scripts/eventsNightly.test.ts can call it directly with
 * mocked sync/digest functions - see the `import.meta.url` guard below for
 * why this doesn't change the plain `node eventsNightly.js` CLI
 * behaviour.
 */
export async function main(): Promise<void> {
  const outcomes = await syncAllActiveIcsSources((source) => fetchIcsUrlSafely(source.url));
  for (const outcome of outcomes) {
    if (outcome.result) {
      console.log(
        `[events-nightly] ${outcome.source.name}: +${outcome.result.created} created, ~${outcome.result.updated} updated, -${outcome.result.removed} removed`,
      );
    } else {
      console.error(`[events-nightly] sync failed for source "${outcome.source.name}"`, outcome.error);
    }
  }

  const digest = await sendEventRegistrationDigest();
  console.log(`[events-nightly] digest: ${digest.eventCount} event(s), sent to ${digest.recipients.length} recipient(s)`);
}

// Only run when this file is executed directly (`node`/`tsx
// eventsNightly.ts`, e.g. via the `events:nightly` npm
// script the cron job invokes), not when imported by a test.
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main()
    .catch((err) => {
      console.error('[events-nightly] fatal error', err);
      process.exitCode = 1;
    })
    .finally(() => Promise.all([prisma.$disconnect(), closeMailQueue()]));
}
