import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiFetch, downloadFile, getMfaChallengeMethods, refreshSession, verifyMfaChallenge, ApiError, REQUEST_TIMEOUT_MS } from './client';
import { setAccessToken, startImpersonation, stopImpersonation, isImpersonating, onImpersonationEnded } from './token';
import { subscribe, resetServerStatus, reportFailure } from './serverStatus';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setAccessToken(null);
  // Belt-and-suspenders: if an impersonation test fails before its own cleanup
  // runs, this stops the listener/impersonation state from leaking into later
  // tests (which would otherwise fail confusingly far from the real cause).
  if (isImpersonating()) stopImpersonation();
  onImpersonationEnded(null);
});
afterAll(() => server.close());

test('sends the bearer token', async () => {
  setAccessToken('tok-1');
  server.use(
    http.get('/api/v1/me', ({ request }) => {
      expect(request.headers.get('Authorization')).toBe('Bearer tok-1');
      return HttpResponse.json({ user: { id: 1 }, abilities: {} });
    }),
  );
  await expect(apiFetch('/api/v1/me')).resolves.toMatchObject({ user: { id: 1 } });
});

test('on 401 it refreshes once and retries', async () => {
  setAccessToken('stale');
  let refreshed = false;
  server.use(
    http.get('/api/v1/me', ({ request }) =>
      request.headers.get('Authorization') === 'Bearer fresh'
        ? HttpResponse.json({ user: { id: 1 }, abilities: {} })
        : new HttpResponse(null, { status: 401 }),
    ),
    http.post('/api/v1/session/refresh', () => {
      refreshed = true;
      return HttpResponse.json({ access_token: 'fresh', user: { id: 1 } });
    }),
  );
  await expect(apiFetch('/api/v1/me')).resolves.toBeTruthy();
  expect(refreshed).toBe(true);
});

test('throws ApiError when refresh also fails', async () => {
  server.use(
    http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })),
    http.post('/api/v1/session/refresh', () => new HttpResponse(null, { status: 401 })),
  );
  await expect(apiFetch('/api/v1/me')).rejects.toThrowError(ApiError);
});

test('a 401 on a session endpoint does not trigger a refresh-retry', async () => {
  let refreshCalled = false;
  server.use(
    http.post('/api/v1/session', () => new HttpResponse(null, { status: 401 })),
    http.post('/api/v1/session/refresh', () => {
      refreshCalled = true;
      return HttpResponse.json({ access_token: 'fresh', user: { id: 1 } });
    }),
  );
  await expect(
    apiFetch('/api/v1/session', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', password: 'wrong' }) }),
  ).rejects.toThrowError(ApiError);
  expect(refreshCalled).toBe(false);
});

test('ApiError captures the parsed JSON error body', async () => {
  server.use(
    http.get('/api/v1/me', () =>
      HttpResponse.json({ error: 'validation_failed', details: { email: ['is invalid'] } }, { status: 422 }),
    ),
  );
  await expect(apiFetch('/api/v1/me')).rejects.toMatchObject({
    status: 422,
    body: { error: 'validation_failed', details: { email: ['is invalid'] } },
  });
});

test('a 401 while impersonating ends impersonation instead of silently refreshing past it', async () => {
  setAccessToken('admin-tok');
  startImpersonation('target-tok');
  let notified = false;
  onImpersonationEnded(() => { notified = true; });

  server.use(
    http.get('/api/v1/me', ({ request }) =>
      request.headers.get('Authorization') === 'Bearer fresh'
        ? HttpResponse.json({ user: { id: 1 }, abilities: {} })
        : new HttpResponse(null, { status: 401 }),
    ),
    http.post('/api/v1/session/refresh', () => HttpResponse.json({ access_token: 'fresh', user: { id: 1 } })),
  );

  await expect(apiFetch('/api/v1/me')).resolves.toBeTruthy();

  expect(notified).toBe(true);
  expect(isImpersonating()).toBe(false);
  onImpersonationEnded(null);
});

describe('downloadFile', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    // restoreAllMocks (rather than each spy's own mockRestore) guarantees
    // cleanup even if an assertion above throws mid-test - a leaked spy on
    // HTMLAnchorElement.prototype.click would otherwise silently corrupt
    // click-count assertions in whichever test runs next.
    vi.restoreAllMocks();
  });

  test('fetches the blob and triggers an anchor click with the given filename', async () => {
    server.use(
      http.get('/api/v1/attached_files/file-1/download', () => new HttpResponse('file contents', {
        headers: { 'Content-Type': 'application/pdf' },
      })),
    );

    // Capture the blob passed to createObjectURL from inside the mock
    // implementation itself - reading it back out of `spy.mock.calls` later
    // stringifies to "[object Blob]" instead of preserving the live Blob.
    let capturedBlob: Blob | undefined;
    createObjectURLSpy.mockImplementation((obj: Blob) => {
      capturedBlob = obj;
      return 'blob:mock-url';
    });

    await downloadFile('/api/v1/attached_files/file-1/download', 'protokoll.pdf');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(await capturedBlob?.text()).toBe('file contents');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    // The anchor that was clicked is the one carrying our download attributes -
    // asserting via `this` on the mocked prototype method confirms it's a real
    // <a href=blob:... download=...> rather than some other anchor on the page.
    const clickedAnchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(clickedAnchor.download).toBe('protokoll.pdf');
    expect(clickedAnchor.href).toBe('blob:mock-url');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  test('on 401 it refreshes once and retries before downloading', async () => {
    let refreshed = false;
    server.use(
      http.get('/api/v1/attached_files/file-1/download', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh'
          ? new HttpResponse('ok')
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post('/api/v1/session/refresh', () => {
        refreshed = true;
        return HttpResponse.json({ access_token: 'fresh', user: { id: 1 } });
      }),
    );
    setAccessToken('stale');

    await downloadFile('/api/v1/attached_files/file-1/download', 'a.pdf');

    expect(refreshed).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test('throws ApiError and does not attempt a download when the request fails', async () => {
    server.use(
      http.get('/api/v1/attached_files/missing/download', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
    );

    await expect(downloadFile('/api/v1/attached_files/missing/download', 'a.pdf')).rejects.toMatchObject({
      status: 404,
      body: { error: 'not_found' },
    });
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test('a 401 while impersonating ends impersonation instead of silently refreshing past it', async () => {
    setAccessToken('admin-tok');
    startImpersonation('target-tok');
    let notified = false;
    onImpersonationEnded(() => { notified = true; });

    server.use(
      http.get('/api/v1/attached_files/file-1/download', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh'
          ? new HttpResponse('ok')
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post('/api/v1/session/refresh', () => HttpResponse.json({ access_token: 'fresh', user: { id: 1 } })),
    );

    await downloadFile('/api/v1/attached_files/file-1/download', 'a.pdf');

    expect(notified).toBe(true);
    expect(isImpersonating()).toBe(false);
    onImpersonationEnded(null);
  });
});

describe('mfa pending-token requests', () => {
  // Both requests below must authenticate with the mfa_pending_token argument,
  // never a stored real access token - see AuthProvider.tsx's mfaPendingFetch
  // comment (in client.ts) for why apiFetch's normal header-merge order can't
  // be trusted for this: it spreads getAccessToken() LAST, which would
  // silently clobber an explicit Authorization header. Priming a stale real
  // token here reproduces exactly the scenario that bug would hit.
  test('getMfaChallengeMethods sends the pending token, not a stored access token', async () => {
    setAccessToken('stale-real-token');
    server.use(
      http.get('/api/v1/mfa/challenge/methods', ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer ptok');
        return HttpResponse.json({ methods: ['totp', 'email'] });
      }),
    );
    await expect(getMfaChallengeMethods('ptok')).resolves.toEqual({ methods: ['totp', 'email'] });
  });

  test('verifyMfaChallenge sends the pending token (not a stored access token) and posts the input', async () => {
    setAccessToken('stale-real-token');
    server.use(
      http.post('/api/v1/mfa/challenge/verify', async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer ptok');
        expect(await request.json()).toEqual({ method: 'totp', code: '123456', remember_device: false });
        return HttpResponse.json({ access_token: 'full-tok', user: { id: 1 } });
      }),
    );
    await expect(verifyMfaChallenge('ptok', { method: 'totp', code: '123456', remember_device: false }))
      .resolves.toMatchObject({ access_token: 'full-tok' });
  });

  test('verifyMfaChallenge throws ApiError on a 401 (wrong code)', async () => {
    server.use(http.post('/api/v1/mfa/challenge/verify', () => new HttpResponse(null, { status: 401 })));
    await expect(verifyMfaChallenge('ptok', { method: 'totp', code: '000000', remember_device: false }))
      .rejects.toThrowError(ApiError);
  });
});

describe('serverStatus integration', () => {
  afterEach(() => resetServerStatus());

  test('reportFailure fires on a raw network error', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.error()));
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(apiFetch('/api/v1/me')).rejects.toThrow();

    expect(states).toEqual([false, true]);
  });

  test('reportFailure fires on a 5xx response', async () => {
    server.use(http.get('/api/v1/me', () => new HttpResponse(null, { status: 500 })));
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(apiFetch('/api/v1/me')).rejects.toThrowError(ApiError);

    expect(states).toEqual([false, true]);
  });

  test('reportSuccess fires on a normal 2xx response', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: {} })));
    reportFailure(); // start from "down" so reportSuccess is a real, observable transition
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await apiFetch('/api/v1/me');

    expect(states).toEqual([true, false]); // initial replay of "down", then flips to "up"
  });

  test('a real 401/404 flips server-down back to up (connectivity restored) without re-flipping it back down for the 404 itself', async () => {
    server.use(http.get('/api/v1/me', () => new HttpResponse(null, { status: 404 })));
    reportFailure(); // start from "down"
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(apiFetch('/api/v1/me')).rejects.toThrowError(ApiError);

    expect(states).toEqual([true, false]); // flips to "up" on the received response, stays up (no re-flip for the 404 status itself)
  });

  // refreshSession() is called directly (not just indirectly via apiFetch's
  // own 401-retry) by AuthProvider's cold-boot bootstrap effect (Task 4's
  // sub-fix (a)) - on that path it is the *only* request made when there's
  // no session to restore, so it must signal serverStatus itself rather than
  // relying on a `/me` call that may never happen. Mirrors the equivalent
  // apiFetch-level assertions above.
  test('refreshSession reports failure on a raw network error', async () => {
    server.use(http.post('/api/v1/session/refresh', () => HttpResponse.error()));
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(refreshSession()).resolves.toBe(false);

    expect(states).toEqual([false, true]);
  });

  test('refreshSession reports failure on a 5xx response', async () => {
    server.use(http.post('/api/v1/session/refresh', () => new HttpResponse(null, { status: 500 })));
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(refreshSession()).resolves.toBe(false);

    expect(states).toEqual([false, true]);
  });

  test('refreshSession reports success on a normal 200 response', async () => {
    server.use(http.post('/api/v1/session/refresh', () => HttpResponse.json({ access_token: 'fresh', user: { id: 1 } })));
    reportFailure(); // start from "down" so reportSuccess is a real, observable transition
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(refreshSession()).resolves.toBe(true);

    expect(states).toEqual([true, false]);
  });

  test('refreshSession flips server-down back to up on a 401 (no/expired session cookie) without re-flipping it back down for the 401 itself', async () => {
    server.use(http.post('/api/v1/session/refresh', () => new HttpResponse(null, { status: 401 })));
    reportFailure(); // start from "down"
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    await expect(refreshSession()).resolves.toBe(false);

    expect(states).toEqual([true, false]);
  });
});

describe('request timeout', () => {
  // Reproduces the real-world "server outage" symptom this guards against:
  // a connection that hangs (accepted, never responds - e.g. a degraded
  // upstream) rather than cleanly refusing. Before this timeout existed,
  // apiFetch's underlying fetch() would just wait forever, so none of the
  // app's existing error handling/ServerStatusBanner ever fired and the
  // user saw an indefinitely stuck spinner with no explanation.
  beforeEach(() => {
    vi.useFakeTimers();
    resetServerStatus();
  });
  afterEach(() => vi.useRealTimers());

  test('a hanging request eventually rejects instead of waiting forever', async () => {
    server.use(http.get('/api/v1/me', () => new Promise(() => {})));

    const pending = apiFetch('/api/v1/me');
    // Attach a rejection handler synchronously so the timer-advance below
    // doesn't race an "unhandled rejection" before the assertion attaches.
    const assertion = expect(pending).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await assertion;
  });

  test('a hanging request flips the server-status banner to down', async () => {
    server.use(http.get('/api/v1/me', () => new Promise(() => {})));
    const states: boolean[] = [];
    subscribe((down) => states.push(down));

    const pending = apiFetch('/api/v1/me').catch(() => {});
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await pending;

    expect(states).toEqual([false, true]);
  });
});
