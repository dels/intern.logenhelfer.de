import { fetchIcsUrlSafely } from './safeIcsFetch.js';
import { syncAllActiveIcsSources } from './externalEventIcsSync.js';

const DEFAULT_INTERVAL_HOURS = 24;

export function resolveIntervalHours(): number {
  const raw = process.env.ICS_SYNC_INTERVAL_HOURS;
  if (raw === undefined || raw === '') return DEFAULT_INTERVAL_HOURS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_INTERVAL_HOURS : parsed;
}

async function runIcsAutoSync(): Promise<void> {
  const outcomes = await syncAllActiveIcsSources((source) => fetchIcsUrlSafely(source.url));
  for (const outcome of outcomes) {
    if (outcome.result) {
      console.log(
        `[ics-auto-sync] ${outcome.source.name}: +${outcome.result.created} created, ~${outcome.result.updated} updated, -${outcome.result.removed} removed`,
      );
    } else {
      console.error(`[ics-auto-sync] sync failed for source "${outcome.source.name}"`, outcome.error);
    }
  }
}

/**
 * Starts the in-process background auto-sync for every active ICS source,
 * on the interval configured by `ICS_SYNC_INTERVAL_HOURS` (default 24h) -
 * called once from index.ts at server boot, never from app.ts, so importing
 * app.ts in tests doesn't start a timer or touch the network. No-ops under
 * NODE_ENV=test for the same reason, and also under `ICS_SYNC_DISABLED=true`
 * for e2e webServer instances that can't use NODE_ENV=test themselves (e.g.
 * api/playwright.config.ts's rate-limit server, which needs a non-'test'
 * NODE_ENV to exercise the real throttle) but still shouldn't fire live
 * network syncs during CI.
 *
 * ponytail: no persisted last-run timestamp, so a restart re-syncs shortly
 * after boot rather than resuming a prior schedule - fine here since syncs
 * are idempotent upserts on small feeds; add bookkeeping only if restart
 * frequency vs. feed size ever makes that redundant work matter. The initial
 * sync is delayed (not fired synchronously at boot) so bin/deploy-to's
 * short-lived smoke-test containers - which hit the same shared DB but are
 * usually torn down within seconds of passing their healthcheck - don't
 * trigger a redundant sync as a side effect of every deploy.
 */
const INITIAL_SYNC_DELAY_MS = 30_000;

export function startIcsAutoSync(): void {
  if (process.env.NODE_ENV === 'test' || process.env.ICS_SYNC_DISABLED === 'true') return;

  const intervalMs = resolveIntervalHours() * 60 * 60 * 1000;

  const initialTimer = setTimeout(() => {
    runIcsAutoSync().catch((err) => console.error('[ics-auto-sync] fatal error during initial sync', err));
  }, INITIAL_SYNC_DELAY_MS);
  initialTimer.unref();

  const timer = setInterval(() => {
    runIcsAutoSync().catch((err) => console.error('[ics-auto-sync] fatal error during scheduled sync', err));
  }, intervalMs);
  timer.unref();
}
