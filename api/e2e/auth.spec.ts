import { expect, request as playwrightRequest, test } from '@playwright/test';

import { SEED_USERS } from './fixtures.js';

// Full session lifecycle over REAL HTTP, against the real running server
// (see playwright.config.ts's main webServer) - not an in-process supertest
// mount like api/test/routes/session.test.ts. That file already covers the
// same behaviors at the request/unit level in detail (including a broader
// set of edge cases); this file's job is narrower and different in kind:
// prove the exact same guarantees survive a real TCP connection, real cookie
// transport, and a real separate server process - things an in-process
// mount can't get wrong the same way a real deployment could.

const MAIN_BASE_URL = 'http://127.0.0.1:4100';
const RATE_LIMIT_BASE_URL = 'http://127.0.0.1:4101';

const MEMBER = SEED_USERS.member;

/** Pulls a named cookie's raw value out of a Playwright response's raw Set-Cookie header(s). */
function extractCookieValue(setCookieHeaders: string[], name: string): string | undefined {
  for (const cookie of setCookieHeaders) {
    const pair = cookie.split(';')[0] ?? '';
    const [cookieName, value] = pair.split('=');
    if (cookieName === name) {
      return value;
    }
  }
  return undefined;
}

function setCookieHeadersOf(res: { headersArray(): { name: string; value: string }[] }): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value);
}

test.describe('session lifecycle (real HTTP, real cookie jar)', () => {
  test('login returns an access token and a real Set-Cookie refresh token', async ({ request }) => {
    const res = await request.post('/api/v1/session', {
      data: { email: MEMBER.email, password: MEMBER.password },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.user.email).toBe(MEMBER.email);

    const setCookies = setCookieHeadersOf(res);
    expect(setCookies.length).toBeGreaterThan(0);
    const refreshCookie = setCookies.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeTruthy();
    // httpOnly + path scoping, straight off the wire - not something an
    // in-process supertest mount's response object represents the same way.
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/v1\/session/i);
  });

  test('the access token authenticates GET /api/v1/me', async ({ request }) => {
    const login = await request.post('/api/v1/session', {
      data: { email: MEMBER.email, password: MEMBER.password },
    });
    const { access_token: accessToken } = await login.json();

    const me = await request.get('/api/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.user.email).toBe(MEMBER.email);
    expect(meBody.abilities).toBeTruthy();
  });

  test('refresh rotates the refresh token using the real cookie jar (no manual cookie handling)', async ({ request }) => {
    const login = await request.post('/api/v1/session', {
      data: { email: MEMBER.email, password: MEMBER.password },
    });
    const firstCookie = extractCookieValue(setCookieHeadersOf(login), 'refresh_token');
    expect(firstCookie).toBeTruthy();

    // No cookie set manually here - Playwright's `request` fixture is a real
    // cookie jar and resends what /session just set automatically, exactly
    // like a real browser/API client would.
    const refresh = await request.post('/api/v1/session/refresh');

    expect(refresh.status()).toBe(200);
    const refreshBody = await refresh.json();
    expect(refreshBody.access_token).toBeTruthy();

    const secondCookie = extractCookieValue(setCookieHeadersOf(refresh), 'refresh_token');
    expect(secondCookie).toBeTruthy();
    expect(secondCookie).not.toBe(firstCookie);
  });

  test('a replayed (already-rotated) refresh token is rejected - reuse detection', async ({ request }) => {
    const login = await request.post('/api/v1/session', {
      data: { email: MEMBER.email, password: MEMBER.password },
    });
    const originalRawToken = extractCookieValue(setCookieHeadersOf(login), 'refresh_token');
    expect(originalRawToken).toBeTruthy();

    // Rotate once via the jar - this consumes `originalRawToken` server-side.
    const rotated = await request.post('/api/v1/session/refresh');
    expect(rotated.status()).toBe(200);

    // Replay the now-stale, already-consumed cookie value directly, via a
    // brand-new bare context (empty jar) so nothing here is influenced by
    // whatever cookie the shared `request` fixture is currently holding -
    // this isolates the assertion to "does the server itself reject a
    // replayed raw token", the same way session.test.ts's bare
    // `request(app)` (as opposed to its `request.agent(app)`) does.
    const bare = await playwrightRequest.newContext({ baseURL: MAIN_BASE_URL });
    try {
      const replay = await bare.post('/api/v1/session/refresh', {
        headers: { Cookie: `refresh_token=${originalRawToken}` },
      });
      expect(replay.status()).toBe(401);
    } finally {
      await bare.dispose();
    }
  });

  test('logout clears the cookie and the old refresh token can no longer refresh', async ({ request }) => {
    const login = await request.post('/api/v1/session', {
      data: { email: MEMBER.email, password: MEMBER.password },
    });
    const rawToken = extractCookieValue(setCookieHeadersOf(login), 'refresh_token');
    expect(rawToken).toBeTruthy();

    const logout = await request.delete('/api/v1/session');
    expect(logout.status()).toBe(204);

    const clearCookie = setCookieHeadersOf(logout).find((c) => c.startsWith('refresh_token='));
    expect(clearCookie).toBeTruthy();
    // clearCookie() re-sends the cookie with an empty value and an
    // already-expired Max-Age/Expires - assert the value is cleared rather
    // than pinning the exact Max-Age Express emits.
    expect(clearCookie).toMatch(/^refresh_token=;/);

    // Via the jar: it now holds the cleared cookie (or none), so refresh
    // must fail.
    const afterLogoutViaJar = await request.post('/api/v1/session/refresh');
    expect(afterLogoutViaJar.status()).toBe(401);

    // And explicitly replay the pre-logout raw value via a bare context, to
    // prove the rejection is a real server-side revocation (DELETE
    // /api/v1/session revoking the whole refresh-token family), not merely
    // the client no longer holding the cookie.
    const bare = await playwrightRequest.newContext({ baseURL: MAIN_BASE_URL });
    try {
      const replay = await bare.post('/api/v1/session/refresh', {
        headers: { Cookie: `refresh_token=${rawToken}` },
      });
      expect(replay.status()).toBe(401);
    } finally {
      await bare.dispose();
    }
  });
});

test.describe('login rate limiting (real HTTP, real timing)', () => {
  // src/middleware/rateLimit.ts's createRateLimiter() is deliberately a
  // no-op (an effectively-infinite limit) whenever NODE_ENV==='test' - the
  // main e2e server (port 4100, used by every other test in this file and
  // in securityBoundaries.spec.ts) runs with NODE_ENV=test for exactly that
  // reason, so the limiter cannot be observed engaging there. Rather than
  // fighting that (deliberate, well-reasoned) design, playwright.config.ts
  // stands up a second, otherwise-identical server on port 4101 with
  // NODE_ENV='e2e-ratelimit' (anything other than the literal 'test') and a
  // low RATE_LIMIT_LOGIN_MAX override, solely for the test below.
  test('the main NODE_ENV=test server never 429s, no matter how many failed logins', async () => {
    const main = await playwrightRequest.newContext({ baseURL: MAIN_BASE_URL });
    try {
      let mainLast;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop -- deliberately sequential: each attempt must land before the next, to count against the same window.
        mainLast = await main.post('/api/v1/session', {
          data: { email: 'nobody@example.test', password: 'wrong' },
        });
      }
      expect(mainLast?.status()).toBe(401);
    } finally {
      await main.dispose();
    }
  });

  test('the dedicated rate-limited server 429s after repeated failed logins', async () => {
    // Regression test for a real bug this e2e layer caught: openapi.yaml's
    // POST /api/v1/session operation used to document only 200/400/401 - no
    // 429 - so once loginRateLimiter's handler called
    // `res.status(429).json({error:'too_many_requests'})`,
    // express-openapi-validator's response validator threw ("no schema
    // defined for status code '429'"), which apiErrorHandler's catch-all
    // turned into a 500. Fixed by adding a TooManyRequests response
    // component and referencing it from this operation (and
    // POST /api/v1/session/refresh, which the same limiter covers).

    const rateLimited = await playwrightRequest.newContext({ baseURL: RATE_LIMIT_BASE_URL });
    try {
      let last;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop -- see above.
        last = await rateLimited.post('/api/v1/session', {
          data: { email: 'nobody@example.test', password: 'wrong' },
        });
        if (last.status() !== 401) {
          break;
        }
      }

      expect(last?.status()).toBe(429);
      expect(await last?.json()).toEqual({ error: 'too_many_requests' });
    } finally {
      await rateLimited.dispose();
    }
  });
});
