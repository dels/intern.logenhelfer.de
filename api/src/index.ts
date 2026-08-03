import { app } from './app.js';
import { syncAdminAccountFromEnv } from './lib/adminAccount.js';
import { resetAndSeedDemoData } from './lib/demoSeed.js';
import { startIcsAutoSync } from './lib/icsSyncScheduler.js';
import { ensureLogoSeeded } from './lib/logoStore.js';

// Placeholder default, distinct from Rails (9876) and the frontend's dev
// port (5173). Matches app/vite.config.ts's existing '/api' proxy default
// (http://localhost:3000) so `pnpm dev` works without extra env config.
// Finalized when docker-compose is updated for this service.
const PORT = Number(process.env.PORT ?? 3000);

await syncAdminAccountFromEnv();
await resetAndSeedDemoData();
await ensureLogoSeeded();

app.listen(PORT, () => {
  console.log(`api listening on port ${PORT}`);
  startIcsAutoSync();
});
