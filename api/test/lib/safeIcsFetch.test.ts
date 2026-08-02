import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// assertSafeIcsUrl/fetchIcsUrlSafely resolve hostnames via node:dns/promises'
// lookup - mocked here so tests are deterministic and don't depend on real
// network/DNS access (can't rely on a fake test hostname actually resolving
// to a controlled address).
const dnsLookupMock = vi.fn();
vi.mock('node:dns/promises', () => ({ lookup: dnsLookupMock }));

const { assertSafeIcsUrl, fetchIcsUrlSafely } = await import('../../src/lib/safeIcsFetch.js');

beforeEach(() => {
  dnsLookupMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('assertSafeIcsUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeIcsUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(assertSafeIcsUrl('gopher://internal.example.test/')).rejects.toThrow();
    expect(dnsLookupMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid URL', async () => {
    await expect(assertSafeIcsUrl('not a url')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to a loopback address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(assertSafeIcsUrl('http://internal.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to a private (RFC1918) address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '10.1.2.3', family: 4 }]);
    await expect(assertSafeIcsUrl('http://internal.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to a link-local address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    await expect(assertSafeIcsUrl('http://metadata.example.test/latest/meta-data/')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to an IPv6 loopback address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '::1', family: 6 }]);
    await expect(assertSafeIcsUrl('http://internal6.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to an IPv6 link-local address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: 'fe80::1', family: 6 }]);
    await expect(assertSafeIcsUrl('http://internal6.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to an IPv6 unique-local address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: 'fd00::1', family: 6 }]);
    await expect(assertSafeIcsUrl('http://internal6.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects a hostname that resolves to an IPv4-mapped IPv6 private address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '::ffff:10.0.0.5', family: 6 }]);
    await expect(assertSafeIcsUrl('http://internal6.example.test/cal.ics')).rejects.toThrow();
  });

  it('rejects when ANY resolved address (of several) is private, even if others are public', async () => {
    dnsLookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);
    await expect(assertSafeIcsUrl('http://mixed.example.test/cal.ics')).rejects.toThrow();
  });

  it('accepts a hostname that resolves to a normal public-looking address', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const parsed = await assertSafeIcsUrl('https://public.example.test/cal.ics');
    expect(parsed).toBeInstanceOf(URL);
    expect(parsed.hostname).toBe('public.example.test');
    expect(dnsLookupMock).toHaveBeenCalledWith('public.example.test', { all: true });
  });

  // CIDR boundary regression tests: isBlockedAddress's range checks were
  // manually verified correct by a reviewer, but nothing pinned the exact
  // boundaries down. Each pair below straddles a range edge to prove the
  // check is exact, not off-by-one in either direction.
  describe('IPv4 CIDR boundaries', () => {
    const expectAllowed = async (address: string) => {
      dnsLookupMock.mockResolvedValue([{ address, family: 4 }]);
      await expect(assertSafeIcsUrl(`http://boundary.example.test/cal.ics`)).resolves.toBeInstanceOf(URL);
    };
    const expectBlocked = async (address: string) => {
      dnsLookupMock.mockResolvedValue([{ address, family: 4 }]);
      await expect(assertSafeIcsUrl(`http://boundary.example.test/cal.ics`)).rejects.toThrow();
    };

    it('172.16.0.0/12: allows just below, blocks the lower bound', async () => {
      await expectAllowed('172.15.255.255');
      await expectBlocked('172.16.0.0');
    });

    it('172.16.0.0/12: blocks the upper bound, allows just above', async () => {
      await expectBlocked('172.31.255.255');
      await expectAllowed('172.32.0.0');
    });

    it('169.254.0.0/16: allows just below, blocks the lower bound', async () => {
      await expectAllowed('169.253.255.255');
      await expectBlocked('169.254.0.0');
    });

    it('169.254.0.0/16: blocks the upper bound, allows just above', async () => {
      await expectBlocked('169.254.255.255');
      await expectAllowed('169.255.0.0');
    });

    it('10.0.0.0/8: allows just below, blocks the lower bound', async () => {
      await expectAllowed('9.255.255.255');
      await expectBlocked('10.0.0.0');
    });

    it('10.0.0.0/8: blocks the upper bound, allows just above', async () => {
      await expectBlocked('10.255.255.255');
      await expectAllowed('11.0.0.0');
    });

    it('192.168.0.0/16: allows just below, blocks the lower bound', async () => {
      await expectAllowed('192.167.255.255');
      await expectBlocked('192.168.0.0');
    });

    it('192.168.0.0/16: blocks the upper bound, allows just above', async () => {
      await expectBlocked('192.168.255.255');
      await expectAllowed('192.169.0.0');
    });
  });

  describe('IPv6 CIDR boundaries', () => {
    const expectAllowed = async (address: string) => {
      dnsLookupMock.mockResolvedValue([{ address, family: 6 }]);
      await expect(assertSafeIcsUrl(`http://boundary6.example.test/cal.ics`)).resolves.toBeInstanceOf(URL);
    };
    const expectBlocked = async (address: string) => {
      dnsLookupMock.mockResolvedValue([{ address, family: 6 }]);
      await expect(assertSafeIcsUrl(`http://boundary6.example.test/cal.ics`)).rejects.toThrow();
    };

    it('fc00::/7: just outside (below) is allowed, just inside is blocked', async () => {
      await expectAllowed('fbff::1'); // 0xfbff < 0xfc00
      await expectBlocked('fc00::1'); // lower bound of fc00::/7
    });

    it('fc00::/7: upper bound (fdff) is blocked, just outside (above) is allowed', async () => {
      await expectBlocked('fdff::1'); // upper bound of fc00::/7 (fc00-fdff)
      await expectAllowed('fe00::1'); // 0xfe00 is outside fc00::/7 and below fe80::/10
    });

    it('fe80::/10: just outside (below) is allowed, just inside is blocked', async () => {
      await expectAllowed('fe7f::1'); // 0xfe7f < 0xfe80
      await expectBlocked('fe80::1'); // lower bound of fe80::/10
    });

    it('fe80::/10: upper bound (febf) is blocked, just outside (above) is allowed', async () => {
      await expectBlocked('febf::1'); // upper bound of fe80::/10 (fe80-febf)
      await expectAllowed('fec0::1'); // 0xfec0 is outside fe80::/10
    });
  });
});

describe('fetchIcsUrlSafely', () => {
  it('returns the response body text on a safe 2xx fetch', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchMock = vi.fn().mockResolvedValue(new Response('BEGIN:VCALENDAR\nEND:VCALENDAR', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const text = await fetchIcsUrlSafely('https://public.example.test/cal.ics');
    expect(text).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
    expect(fetchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ redirect: 'manual' }));
  });

  it('throws with the status on a non-2xx, non-redirect response', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })));

    await expect(fetchIcsUrlSafely('https://public.example.test/cal.ics')).rejects.toThrow('ICS fetch failed: 404');
  });

  it('rejects when a redirect chain resolves to a private address', async () => {
    dnsLookupMock.mockImplementation(async (hostname: string) => {
      if (hostname === 'public.example.test') return [{ address: '93.184.216.34', family: 4 }];
      if (hostname === 'internal.example.test') return [{ address: '169.254.169.254', family: 4 }];
      throw new Error(`unexpected lookup for ${hostname}`);
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: 'http://internal.example.test/latest/meta-data/' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchIcsUrlSafely('https://public.example.test/cal.ics')).rejects.toThrow();
    // Only the initial hop's fetch should happen - the redirect target is
    // validated (and rejected) before it's ever followed.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('follows a bounded number of safe redirects and rejects once the max is exceeded', async () => {
    dnsLookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchMock = vi.fn().mockImplementation(async (input: URL | string) => {
      const url = typeof input === 'string' ? input : input.toString();
      const hopMatch = /\/hop(\d+)$/.exec(url);
      const hop = hopMatch ? Number(hopMatch[1]) : 0;
      return new Response(null, { status: 302, headers: { Location: `https://public.example.test/hop${hop + 1}` } });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchIcsUrlSafely('https://public.example.test/hop0')).rejects.toThrow(/redirect/i);
    // 1 initial fetch + 5 allowed redirect-follow fetches = 6 total fetches
    // before the 6th redirect response is rejected for exceeding the cap.
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  // DNS-rebinding fix regression test: a naive fix could pin the connection
  // for the *first* hop only and call it done, leaving every redirect target
  // just as vulnerable to rebinding as before the fix. Prove each hop - the
  // initial request AND every redirect follow-up - gets its own freshly
  // built dispatcher (undici Agent instance pinned to that hop's just-
  // validated addresses), not the first hop's dispatcher reused throughout.
  it('re-pins the connection for every hop of a redirect chain, not just the first', async () => {
    dnsLookupMock.mockImplementation(async (hostname: string) => {
      if (hostname === 'public.example.test') return [{ address: '93.184.216.34', family: 4 }];
      if (hostname === 'hop1.example.test') return [{ address: '93.184.216.35', family: 4 }];
      if (hostname === 'hop2.example.test') return [{ address: '93.184.216.36', family: 4 }];
      throw new Error(`unexpected lookup for ${hostname}`);
    });

    const seenDispatchers: unknown[] = [];
    const fetchMock = vi.fn().mockImplementation(async (input: URL | string, init?: RequestInit) => {
      seenDispatchers.push(init?.dispatcher);
      const url = typeof input === 'string' ? input : input.toString();
      if (url === 'https://public.example.test/cal.ics') {
        return new Response(null, { status: 302, headers: { Location: 'https://hop1.example.test/cal.ics' } });
      }
      if (url === 'https://hop1.example.test/cal.ics') {
        return new Response(null, { status: 302, headers: { Location: 'https://hop2.example.test/cal.ics' } });
      }
      return new Response('BEGIN:VCALENDAR\nEND:VCALENDAR', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const text = await fetchIcsUrlSafely('https://public.example.test/cal.ics');
    expect(text).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');

    // One dispatcher per hop (initial + 2 redirects).
    expect(seenDispatchers).toHaveLength(3);
    for (const dispatcher of seenDispatchers) {
      expect(dispatcher).toBeDefined();
    }
    // Every hop got its OWN dispatcher instance - not the first hop's
    // dispatcher reused for later hops (which would fail to re-pin).
    expect(new Set(seenDispatchers).size).toBe(3);
    // Each hop's DNS lookup happened - confirming re-validation (and thus
    // re-pinning, since the dispatcher is built from that lookup's result)
    // occurred per hop rather than only up front.
    expect(dnsLookupMock).toHaveBeenCalledWith('public.example.test', { all: true });
    expect(dnsLookupMock).toHaveBeenCalledWith('hop1.example.test', { all: true });
    expect(dnsLookupMock).toHaveBeenCalledWith('hop2.example.test', { all: true });
  });
});
