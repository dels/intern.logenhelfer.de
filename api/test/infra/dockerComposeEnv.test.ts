import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Regression test for a real 2026-08-01 production bug: MFA_ENCRYPTION_KEY
// was present and correctly auto-provisioned/pushed into every environment's
// local .env.<env> (bin/deploy-to's own job) but was never added to
// infra/docker-compose.production.yml's `api` service `environment:` block -
// so it never actually reached the deployed container's process env at all.
// Compose's `--env-file` only feeds `${VAR}` substitution *inside the compose
// file itself*; a var missing from the service's own `environment:` block is
// simply never injected into the container, no matter how correct the
// pushed .env.<env> file is. This was invisible to bin/test-gate (its e2e
// step only runs app's Playwright suite, never a real TOTP enrollment
// end-to-end) and only surfaced via a live `docker inspect`/`docker exec
// printenv` check against a real deployed container on `next`.
//
// This test can't run a real docker-compose resolution (no docker available
// in the unit-test sandbox), so it does a targeted structural check instead:
// every var this app's runtime code requires via `process.env.X` (throwing
// or misbehaving if unset) must appear as a key inside the `api` service's
// `environment:` block in the production compose file. It's intentionally a
// plain-text/line-based check, not a full YAML parse, to avoid adding a new
// parser dependency for one small structural assertion.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPOSE_PATH = path.resolve(__dirname, '../../../infra/docker-compose.production.yml');

/** Extracts the `environment:` block's own key names for a given top-level service. */
function apiServiceEnvironmentKeys(composeYaml: string, service: string): string[] {
  const lines = composeYaml.split('\n');
  const serviceStart = lines.findIndex((line) => line === `  ${service}:`);
  if (serviceStart === -1) {
    throw new Error(`service "${service}" not found in ${COMPOSE_PATH}`);
  }
  // The service block ends at the next line that starts a new top-level
  // service (two-space indent, non-comment) or at EOF.
  const serviceEnd = lines
    .slice(serviceStart + 1)
    .findIndex((line) => /^ {2}\S/.test(line));
  const serviceLines = lines.slice(serviceStart + 1, serviceEnd === -1 ? undefined : serviceStart + 1 + serviceEnd);

  const envStart = serviceLines.findIndex((line) => line === '    environment:');
  if (envStart === -1) {
    throw new Error(`service "${service}" has no top-level "environment:" block in ${COMPOSE_PATH}`);
  }
  const envEnd = serviceLines.slice(envStart + 1).findIndex((line) => /^ {4}\S/.test(line));
  const envLines = serviceLines.slice(envStart + 1, envEnd === -1 ? undefined : envStart + 1 + envEnd);

  return envLines
    .map((line) => /^ {6}([A-Z0-9_]+):/.exec(line)?.[1])
    .filter((key): key is string => Boolean(key));
}

describe('infra/docker-compose.production.yml: api service environment', () => {
  const composeYaml = readFileSync(COMPOSE_PATH, 'utf8');
  const keys = apiServiceEnvironmentKeys(composeYaml, 'api');

  // Every var api/src actually reads via process.env.X and throws/misbehaves
  // without (not every optional/default-able one - e.g. RATE_LIMIT_* has
  // safe defaults elsewhere and isn't required here).
  it.each(['DATABASE_URL', 'JWT_SECRET', 'MFA_ENCRYPTION_KEY'])(
    'passes %s through to the container (present in the environment: block)',
    (requiredVar) => {
      expect(keys).toContain(requiredVar);
    },
  );
});

// Regression test for a real 2026-08-01 production (prod) outage: edge's
// ACTIVE_APP_UPSTREAM had a silent default (`${ACTIVE_APP_UPSTREAM:-app}`).
// "app" is never a valid container name under blue/green (real names are
// always `<container>-blue`/`-green`), so a container recreate that resolved
// this default baked in a guaranteed-wrong upstream and crash-looped with no
// hint at the right value. Fixed by making it a required (`:?`) var, same
// tier as DATABASE_URL/JWT_SECRET above - this test guards against someone
// reverting that back to a silent `:-` default.
describe('infra/docker-compose.production.yml: edge service environment', () => {
  const composeYaml = readFileSync(COMPOSE_PATH, 'utf8');
  const keys = apiServiceEnvironmentKeys(composeYaml, 'edge');

  it('requires ACTIVE_APP_UPSTREAM (present in the environment: block)', () => {
    expect(keys).toContain('ACTIVE_APP_UPSTREAM');
  });

  it('has no safe default for ACTIVE_APP_UPSTREAM - must use the required (":?") form, not ":-"', () => {
    const line = composeYaml
      .split('\n')
      .find((l) => /^\s*ACTIVE_APP_UPSTREAM:\s*\$\{ACTIVE_APP_UPSTREAM/.test(l));
    expect(line).toBeDefined();
    expect(line).toMatch(/\$\{ACTIVE_APP_UPSTREAM:\?/);
    expect(line).not.toMatch(/\$\{ACTIVE_APP_UPSTREAM:-/);
  });
});
