import { createServer } from 'node:http';
import type { Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPinnedDispatcher } from '../../src/lib/safeIcsFetch.js';

/**
 * Real-network regression test for the DNS-rebinding pin (see
 * `safeIcsFetch.ts`'s `createPinnedDispatcher`/`pinnedLookup`).
 *
 * Every other test in `safeIcsFetch.test.ts` stubs the global `fetch`, which
 * proves the module CONSTRUCTS the right `undici.Agent`/`connect.lookup` and
 * passes it as `dispatcher` - but never proves Node's real `fetch`/undici
 * internals actually HONOR that dispatcher's `connect.lookup` instead of
 * falling back to real DNS resolution. A future Node or undici version bump
 * could silently break the pinning while every one of those mocked tests
 * stays green. This test closes that gap with no `fetch` mock at all: it
 * starts a real local HTTP server and uses the REAL global `fetch` to reach
 * it, landing there only because `connect.lookup` was overridden - the
 * request URL's hostname (`pinned-test.invalid`) is an IANA-reserved TLD
 * that can never resolve via real DNS, so there is no other way the
 * connection could land on our server.
 *
 * This deliberately does NOT go through `fetchIcsUrlSafely`/
 * `assertSafeIcsUrl`: those call `resolveAndValidate`, whose `isBlockedAddress`
 * check rejects loopback/private/link-local addresses outright (that's the
 * SSRF guard working as intended) - so there is no address this test could
 * pin to that both (a) `resolveAndValidate` would accept and (b) this test
 * could actually bind a local listener on. Exercising `createPinnedDispatcher`
 * directly against the real `fetch`/undici stack is the correct scope for
 * this specific regression: it is the exact piece `fetchIcsUrlSafely` builds
 * and hands to `fetch` (see `safeIcsFetch.ts` line ~209-218), so proving undici
 * honors it here proves it for every caller.
 */
describe('createPinnedDispatcher (real fetch, real local server, no mocks)', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('PINNED-OK');
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('expected server to bind to an ephemeral TCP port');
    }
    port = address.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('real fetch() connects to the pinned address, not real DNS, for a hostname real DNS can never resolve', async () => {
    const dispatcher = createPinnedDispatcher(['127.0.0.1']);
    try {
      const response = await fetch(`http://pinned-test.invalid:${port}/`, {
        redirect: 'manual',
        dispatcher: dispatcher as unknown as NonNullable<RequestInit['dispatcher']>,
      });
      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toBe('PINNED-OK');
    } finally {
      await dispatcher.close();
    }
  });
});
