import { app } from './app.js';
import { syncAdminAccountFromEnv } from './lib/adminAccount.js';
import { resetAndSeedDemoData } from './lib/demoSeed.js';
import { startIcsAutoSync } from './lib/icsSyncScheduler.js';
import { startMailWorker, stopMailWorker } from './lib/mailWorker.js';

// Placeholder default, distinct from Rails (9876) and the frontend's dev
// port (5173). Matches app/vite.config.ts's existing '/api' proxy default
// (http://localhost:3000) so `pnpm dev` works without extra env config.
// Finalized when docker-compose is updated for this service.
const PORT = Number(process.env.PORT ?? 3000);

await syncAdminAccountFromEnv();
await resetAndSeedDemoData();

const server = app.listen(PORT, () => {
  console.log(`api listening on port ${PORT}`);
  startIcsAutoSync();
  startMailWorker();
});

// Minimal graceful shutdown: stopMailWorker() was exported and unit-tested
// but never actually called in production before this - there was no
// SIGTERM/SIGINT handler at all. Not a broader graceful-shutdown framework,
// just wiring the mail worker's own shutdown function to something real.
function shutdown(signal: NodeJS.Signals): void {
  console.log(`[index] received ${signal}, shutting down`);
  void stopMailWorker().finally(() => {
    server.close(() => process.exit(0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
