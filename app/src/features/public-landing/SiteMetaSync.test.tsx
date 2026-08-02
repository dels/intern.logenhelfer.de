import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SiteMetaSync from './SiteMetaSync';
import i18n from '../../i18n';

const server = setupServer(
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Zur Morgenröte', language: 'en' })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  document.title = 'Logenhelfer';
  document.documentElement.lang = 'de';
  void i18n.changeLanguage('de');
  document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());
});

function renderSync() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SiteMetaSync />
    </QueryClientProvider>,
  );
}

describe('SiteMetaSync', () => {
  it('sets document.title to the configured lodge name once loaded', async () => {
    renderSync();
    await waitFor(() => expect(document.title).toBe('Zur Morgenröte'));
  });

  it('sets <html lang> and i18next\'s active language to the configured language', async () => {
    renderSync();
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    await waitFor(() => expect(i18n.language).toBe('en'));
  });

  it('leaves the static defaults in place before the config has loaded', () => {
    server.use(http.get('/api/v1/public/landing', () => new Promise(() => {})));
    renderSync();
    expect(document.title).toBe('Logenhelfer');
    expect(document.documentElement.lang).toBe('de');
  });

  it('falls back to "Logenhelfer"/"de" when the config request fails', async () => {
    server.use(http.get('/api/v1/public/landing', () => new HttpResponse(null, { status: 500 })));
    renderSync();
    // No update should happen — assert the failure settles without throwing and defaults are untouched.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.title).toBe('Logenhelfer');
    expect(document.documentElement.lang).toBe('de');
  });

  it('falls back to "Logenhelfer"/"de" when lodge/language come back empty', async () => {
    server.use(http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: '' })));
    renderSync();
    await waitFor(() => expect(document.title).toBe('Logenhelfer'));
    expect(document.documentElement.lang).toBe('de');
  });

  it('creates/rewrites the favicon href when a custom logo is configured', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: 42 }),
      ),
    );
    renderSync();
    await waitFor(() => expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/api/v1/public/logo?v=42'));
  });

  it('does not touch the favicon when no custom logo is configured', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: null }),
      ),
    );
    renderSync();
    await waitFor(() => expect(document.title).toBe('Logenhelfer'));
    expect(document.querySelector('link[rel="icon"]')).toBeNull();
  });

  it('reverts the favicon back to /favicon.ico when a custom logo is reset within a live session', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: 42 }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <SiteMetaSync />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/api/v1/public/logo?v=42'));

    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: null }),
      ),
    );
    await queryClient.invalidateQueries({ queryKey: ['public-landing-config'] });

    await waitFor(() => expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.ico'));
  });
});
