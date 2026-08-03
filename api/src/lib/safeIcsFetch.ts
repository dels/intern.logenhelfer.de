import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { Agent } from 'undici';

/**
 * SSRF guard for externalEventIcsSources.ts: an admin-supplied "ICS calendar
 * URL" is fetched server-side on-demand (POST /:uuid/sync). Without
 * validation, that URL is a direct pivot into the app server's internal
 * network (cloud metadata endpoints, localhost admin ports, other internal
 * services) - the fetch's timing/status alone is a usable oracle even before
 * the response is parsed as ICS. This module is the single place that
 * decides whether a target address is safe to reach, both at creation time
 * (fast admin feedback) and at every actual fetch (the real enforcement
 * boundary, since DNS can change between the two).
 */

const MAX_REDIRECTS = 5;

type IPv4Octets = [number, number, number, number];

function isIPv4Blocked([a, b, c, d]: IPv4Octets): boolean {
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 0 && b === 0 && c === 0 && d === 0) return true; // 0.0.0.0/32 unspecified
  return false;
}

function parseIPv4(address: string): IPv4Octets | null {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number(p));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return octets as IPv4Octets;
}

/**
 * Checks a resolved address (IPv4 or IPv6, as returned by dns.lookup) against
 * loopback/link-local/private/unspecified ranges. IPv4-mapped IPv6 addresses
 * (::ffff:x.x.x.x) are unwrapped and checked as their embedded IPv4 address,
 * since they'd otherwise sail through the IPv6-only checks below.
 */
function isBlockedAddress(address: string): boolean {
  const lower = address.toLowerCase();

  const ipv4Mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  const embeddedIPv4 = ipv4Mapped?.[1];
  if (embeddedIPv4) {
    const octets = parseIPv4(embeddedIPv4);
    return octets ? isIPv4Blocked(octets) : true; // unparseable embedded address - fail closed
  }

  const ipv4 = parseIPv4(lower);
  if (ipv4) return isIPv4Blocked(ipv4);

  if (lower === '::1') return true; // loopback
  if (lower === '::') return true; // unspecified

  // fe80::/10 (link-local) and fc00::/7 (unique local) are both fully
  // determined by the first 16-bit group (10 and 7 bits fit within it).
  // Parse it numerically rather than string-prefix-matching, since the
  // canonical textual form Node returns has no leading zeros (e.g. "fe80",
  // not "0fe80"), which a fixed-width prefix check would mis-handle.
  const firstGroupText = lower.split(':', 1)[0] ?? '';
  if (/^[0-9a-f]{1,4}$/.test(firstGroupText)) {
    const firstGroup = Number.parseInt(firstGroupText, 16);
    if (firstGroup >= 0xfe80 && firstGroup <= 0xfebf) return true; // fe80::/10
    if (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) return true; // fc00::/7
  }

  return false;
}

interface ValidatedIcsUrl {
  url: URL;
  /** Every address `url`'s hostname resolved to, already checked safe. */
  addresses: string[];
}

/**
 * Does the actual work behind `assertSafeIcsUrl`, but also hands back the
 * resolved addresses so callers that go on to make the real connection (see
 * `createPinnedDispatcher` below) can pin it to exactly what was validated,
 * instead of letting a second, independent DNS resolution happen at connect
 * time - which is what a DNS-rebinding attack (a short-TTL record that
 * answers differently for the check than for the real connection) needs to
 * slip a private/loopback address past this check.
 */
async function resolveAndValidate(url: string): Promise<ValidatedIcsUrl> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Ungültige URL: ${url}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Nicht erlaubtes URL-Protokoll: ${parsed.protocol}`);
  }

  const resolved = await lookup(parsed.hostname, { all: true });
  const addresses: string[] = [];
  for (const { address } of resolved) {
    if (isBlockedAddress(address)) {
      throw new Error(`URL löst auf eine nicht erlaubte Adresse auf: ${address}`);
    }
    addresses.push(address);
  }

  if (addresses.length === 0) {
    throw new Error(`URL löst auf keine Adresse auf: ${url}`);
  }

  return { url: parsed, addresses };
}

/**
 * Validates that `url` is http(s) and every address its hostname currently
 * resolves to is a public, routable address - not loopback/private/
 * link-local/unspecified. Returns the parsed URL so callers don't have to
 * re-parse it. Throws a plain Error on any violation (invalid URL, wrong
 * scheme, or a blocked resolved address).
 */
export async function assertSafeIcsUrl(url: string): Promise<URL> {
  const { url: parsed } = await resolveAndValidate(url);
  return parsed;
}

/**
 * Builds a custom `dns.lookup`-shaped function that ignores whatever the
 * hostname would actually resolve to right now, and always answers with the
 * already-validated `addresses` instead. Handed to undici's `Agent` via its
 * `connect.lookup` option, this is what pins the TCP connection to the
 * address(es) `resolveAndValidate` checked - closing the TOCTOU gap where
 * `fetch()`'s own independent DNS resolution (which happens right before it
 * connects) could see a different, attacker-controlled answer than the one
 * validated a moment earlier (classic DNS-rebinding SSRF bypass).
 *
 * Mirrors `dns.lookup`'s callback contract: with `options.all` set (which is
 * what undici/Node's connect logic requests by default), the callback takes
 * an array of `{ address, family }`; otherwise a single address/family pair.
 */
function pinnedLookup(addresses: string[]) {
  const resolved: LookupAddress[] = addresses.map((address) => ({
    address,
    family: address.includes(':') ? 6 : 4,
  }));

  return (
    _hostname: string,
    options: { all?: boolean } | undefined,
    callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
  ): void => {
    const [first] = resolved;
    if (!first) {
      // Unreachable in practice - resolveAndValidate never returns an empty
      // `addresses` list - but fail closed with a dns.lookup-shaped error
      // rather than throwing synchronously into undici's connect internals.
      const error = new Error('No validated address available to pin') as NodeJS.ErrnoException;
      error.code = 'ENOTFOUND';
      callback(error, '');
      return;
    }
    if (options?.all) {
      callback(null, resolved);
      return;
    }
    callback(null, first.address, first.family);
  };
}

/**
 * Creates a single-use undici `Agent` whose connections for this request are
 * pinned to `addresses` (see `pinnedLookup`). The original hostname is still
 * sent as-is for the TCP `host`/TLS `servername` (undici's connector derives
 * both from the request URL, not from the resolved address), so SNI and
 * certificate hostname verification keep working normally - only the actual
 * DNS resolution step is overridden.
 *
 * The `dispatcher` it returns is passed as-is to the ambient global
 * `fetch()` below (not undici's own exported `fetch`, which
 * safeIcsFetch.test.ts's `vi.stubGlobal('fetch', ...)` mocking can't
 * intercept). Cast through `unknown` at that call site: @types/node's
 * global fetch typing no longer exposes a `dispatcher` option on
 * `RequestInit` at all (it now models only the WHATWG fetch spec's
 * standard surface, not Node/undici-specific extensions), while this
 * `Agent`'s real shape is exactly what Node's built-in fetch (itself
 * undici under the hood) expects at runtime - this is a real, verified
 * interop gap between the ambient type and the runtime behavior, not a
 * correctness issue - verified end-to-end (custom `connect.lookup`
 * actually overriding the connection target for Node's built-in fetch)
 * with a standalone script against this exact Node/undici version before
 * writing this.
 *
 * Exported (only) so `safeIcsFetch.integration.test.ts` can drive it against
 * a real local server with the real global `fetch` - see that file for why
 * `fetchIcsUrlSafely` itself can't be used for that regression test (its own
 * `resolveAndValidate` call rejects loopback/private addresses outright, so
 * it can never be pointed at a local test server).
 */
export function createPinnedDispatcher(addresses: string[]): Agent {
  return new Agent({ connect: { lookup: pinnedLookup(addresses) } });
}

/**
 * Fetches `url` as ICS text, guarding against SSRF both up front and across
 * every hop of a redirect chain (an initial check passing doesn't stop a
 * server from 302-ing to an internal address afterwards). `redirect:
 * 'manual'` (supported by Node's built-in undici-backed fetch) stops the
 * runtime from following redirects itself, so each hop's target gets
 * re-validated - and its connection re-pinned via a fresh `createPinnedDispatcher`
 * call - before it's followed.
 */
export async function fetchIcsUrlSafely(url: string): Promise<string> {
  let target = await resolveAndValidate(url);

  for (let redirectCount = 0; ; redirectCount += 1) {
    const dispatcher = createPinnedDispatcher(target.addresses);
    try {
      // Deliberately the ambient global `fetch` (not undici's own exported
      // one) - safeIcsFetch.test.ts mocks network behavior via
      // vi.stubGlobal('fetch', ...), which only intercepts this global,
      // not a separately-imported undici fetch reference. @types/node's
      // global fetch typing no longer exposes a `dispatcher` option on
      // RequestInit at all (it now models only the WHATWG fetch spec's
      // standard surface, not Node/undici-specific extensions), so the
      // whole options object is cast through `unknown` rather than the
      // (now-nonexistent) `RequestInit['dispatcher']` property - same real
      // shape at runtime, undici's own Agent (see createPinnedDispatcher's
      // comment above).
      // eslint-disable-next-line no-await-in-loop -- each hop's target depends on the previous response's Location header.
      const response = await fetch(target.url, {
        redirect: 'manual',
        dispatcher,
      } as unknown as RequestInit);

      if (response.status >= 300 && response.status < 400) {
        if (redirectCount >= MAX_REDIRECTS) {
          throw new Error(`ICS fetch failed: too many redirects (> ${MAX_REDIRECTS})`);
        }
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`ICS fetch failed: ${response.status} redirect without Location header`);
        }
        const nextUrl = new URL(location, target.url);
        // eslint-disable-next-line no-await-in-loop -- must validate (and re-pin) before following.
        target = await resolveAndValidate(nextUrl.toString());
        continue;
      }

      if (!response.ok) throw new Error(`ICS fetch failed: ${response.status}`);
      // eslint-disable-next-line no-await-in-loop -- terminal case, single await.
      return await response.text();
    } finally {
      // eslint-disable-next-line no-await-in-loop -- this hop is done (either we're moving to the next one or returning); release its pinned connection.
      await dispatcher.close();
    }
  }
}
