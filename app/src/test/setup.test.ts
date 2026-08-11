import { getConfig } from '@testing-library/dom';

// Regression guard for the 2026-08-11 deploy-gate flake (see setup.ts's
// comment): asyncUtilTimeout must stay above the 1000ms default, or
// findByRole/waitFor calls that wait on a real dynamic import + auth
// bootstrap (e.g. routes.test.tsx) go back to flaking under bin/test-gate's
// full-suite CPU contention.
it('keeps the async query timeout raised above testing-library\'s 1000ms default', () => {
  expect(getConfig().asyncUtilTimeout).toBeGreaterThanOrEqual(5000);
});
