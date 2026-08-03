import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, MemoryRouter, Route, Routes, Link } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './AppShell';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import { routes } from '../routes';
import '../i18n';

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: true };
const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
  http.get('/api/v1/announcements', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/categories', () => HttpResponse.json({ rows: [], row_count: 0 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('shell shows navigation and marks the active page', async () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><RouterProvider router={router} /></AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByRole('link', { name: 'Übersicht' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Arbeitsplan' })).toBeInTheDocument();
});

function Trigger() {
  const { impersonate } = useAuth();
  return <button onClick={() => void impersonate('m1')}>trigger-impersonate</button>;
}

function renderShell() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="dashboard" element={<Trigger />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AppShell impersonation banner', () => {
  it('is absent for a normal session', async () => {
    renderShell();
    await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
    expect(screen.queryByText(/Ansicht als/)).not.toBeInTheDocument();
  });

  it('shows a banner with the target name while impersonating, and a working return button', async () => {
    server.use(
      http.post('/api/v1/members/m1/impersonate', () => HttpResponse.json({ access_token: 'target-tok', user: { id: 2, firstname: 'Target', lastname: 'Member' } })),
      http.get('/api/v1/me', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer target-tok'
          ? HttpResponse.json({ user: { id: 2, firstname: 'Target', lastname: 'Member', gdpr_accepted: true }, abilities: {} })
          : HttpResponse.json({ user: { id: 1, firstname: 'Max', lastname: 'Muster', gdpr_accepted: true }, abilities: { event: ['read'] } }),
      ),
    );

    renderShell();
    await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'trigger-impersonate' }));
    await waitFor(() => expect(screen.getByText('Ansicht als Target Member')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Zurück zu meinem Konto' }));
    await waitFor(() => expect(screen.queryByText(/Ansicht als/)).not.toBeInTheDocument());
  });

  it('shows an error alert instead of silently failing when ending impersonation fails', async () => {
    server.use(
      http.post('/api/v1/members/m1/impersonate', () => HttpResponse.json({ access_token: 'target-tok', user: { id: 2, firstname: 'Target', lastname: 'Member' } })),
      http.get('/api/v1/me', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer target-tok'
          ? HttpResponse.json({ user: { id: 2, firstname: 'Target', lastname: 'Member', gdpr_accepted: true }, abilities: {} })
          : HttpResponse.json({ user: { id: 1, firstname: 'Max', lastname: 'Muster', gdpr_accepted: true }, abilities: { event: ['read'] } }),
      ),
    );

    renderShell();
    await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'trigger-impersonate' }));
    await waitFor(() => expect(screen.getByText('Ansicht als Target Member')).toBeInTheDocument());

    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ error: 'internal' }, { status: 500 })),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zurück zu meinem Konto' }));
    // a failed "stop impersonating" must surface an error, not silently do nothing
    await waitFor(() => expect(screen.getByText(/GET \/api\/v1\/me/)).toBeInTheDocument());
  });
});

describe('AppShell sidebar sections', () => {
  it('hides the Konfiguration section entirely for a user with no gated abilities', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByText('Konfiguration')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Logen' })).not.toBeInTheDocument();
  });

  it('shows the Konfiguration section with only the items the user is entitled to', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { app_config: ['update'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Konfiguration')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Einstellungen' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Logen' })).not.toBeInTheDocument();
  });

  it('shows the external ICS calendars link only for users who can create external events, and unconditionally shows the external events link', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { external_event: ['create'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Externe Termine' })).toBeInTheDocument();
    expect(await screen.findByText('Konfiguration')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Externe ICS-Kalender' })).toBeInTheDocument();
  });

  it('hides the external ICS calendars link for a user without external_event.create, while still showing external events', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { external_event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Externe Termine' })).toBeInTheDocument();
    expect(screen.queryByText('Konfiguration')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Externe ICS-Kalender' })).not.toBeInTheDocument();
  });

  it('renders each visible category as its own nav item, and expands its directories on click', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { category: ['read'] } })),
      http.get('/api/v1/categories', () => HttpResponse.json({ rows: [{ slug: 'finanzen', name: 'Finanzen', description: null }], row_count: 1 })),
      http.get('/api/v1/directories', () => HttpResponse.json({ rows: [{ slug: 'rechnungen', name: 'Rechnungen', description: null }], row_count: 1 })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    const categoryLink = await screen.findByRole('link', { name: /Finanzen/ });
    expect(screen.getByText('Dateien')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Rechnungen' })).not.toBeInTheDocument();

    await userEvent.click(categoryLink);
    expect(await screen.findByRole('link', { name: 'Rechnungen' })).toHaveAttribute('href', '/categories/finanzen/directories/rechnungen');
  });

  it('shows a loading spinner in place of the directory list while a category is expanding', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { category: ['read'] } })),
      http.get('/api/v1/categories', () => HttpResponse.json({ rows: [{ slug: 'finanzen', name: 'Finanzen', description: null }], row_count: 1 })),
      http.get('/api/v1/directories', async () => {
        await delay(50);
        return HttpResponse.json({ rows: [{ slug: 'rechnungen', name: 'Rechnungen', description: null }], row_count: 1 });
      }),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    const categoryLink = await screen.findByRole('link', { name: /Finanzen/ });
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });

    await userEvent.click(categoryLink);
    // Clicking the category link both expands it and navigates to the
    // category detail page, whose own (unmocked) data fetch may also render
    // a progressbar in the main content area - scope to the sidebar so this
    // only asserts on the CategoryNavItem's own loading spinner.
    expect(within(nav).getByRole('progressbar')).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Rechnungen' })).not.toBeInTheDocument();

    await waitFor(() => expect(within(nav).getByRole('link', { name: 'Rechnungen' })).toBeInTheDocument());
    expect(within(nav).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('hides the Dateien section when there are no visible categories', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByText('Dateien')).not.toBeInTheDocument();
  });

  it('only keeps one category expanded at a time, collapsing the previous one when a new one opens', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { category: ['read'] } })),
      http.get('/api/v1/categories', () => HttpResponse.json({
        rows: [
          { slug: 'finanzen', name: 'Finanzen', description: null },
          { slug: 'archiv', name: 'Archiv', description: null },
        ],
        row_count: 2,
      })),
      http.get('/api/v1/directories', ({ request }) => {
        const categorySlug = new URL(request.url).searchParams.get('category_slug');
        if (categorySlug === 'archiv') {
          return HttpResponse.json({ rows: [{ slug: 'protokolle', name: 'Protokolle', description: null }], row_count: 1 });
        }
        return HttpResponse.json({ rows: [{ slug: 'rechnungen', name: 'Rechnungen', description: null }], row_count: 1 });
      }),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    const finanzenLink = await screen.findByRole('link', { name: /Finanzen/ });
    const archivLink = screen.getByRole('link', { name: /Archiv/ });

    await userEvent.click(finanzenLink);
    expect(await screen.findByRole('link', { name: 'Rechnungen' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Protokolle' })).not.toBeInTheDocument();

    await userEvent.click(archivLink);
    expect(await screen.findByRole('link', { name: 'Protokolle' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Rechnungen' })).not.toBeInTheDocument());
  });

  it('renders nothing for the categories section when there are no visible categories', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
      http.get('/api/v1/categories', () => HttpResponse.json({ rows: [], row_count: 0 })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    const nav = await screen.findByRole('navigation', { name: 'Hauptnavigation' });
    await waitFor(() => expect(within(nav).getByText('Max Muster')).toBeInTheDocument());

    // With no category rows and no gated abilities, the sidebar must contain
    // exactly the general-nav links - no category link, no Konfiguration
    // section, nothing extra rendered by an "empty" categories section.
    const linkNames = within(nav).getAllByRole('link').map((link) => link.textContent);
    expect(linkNames).toEqual(['Übersicht', 'Aktuelles', 'Arbeitsplan', 'Externe Termine', 'Mitglieder', 'Mein Konto']);
    expect(within(nav).queryByText('Konfiguration')).not.toBeInTheDocument();
  });

  it('shows the Statistiken nav link when the caller is granted Statistic index', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { statistic: ['index', 'file_stats'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Statistiken' })).toBeInTheDocument();
  });

  it('hides the Statistiken nav link when the Statistic index ability is absent (e.g. users_can_view_statistics disabled for a plain member)', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { statistic: [] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Statistiken' })).not.toBeInTheDocument();
  });
});

describe('AppShell Seekers nav gating', () => {
  it('shows the Seekers nav link when abilities.seeker includes read', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { seeker: ['read', 'create', 'update', 'destroy'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Suchende' })).toBeInTheDocument();
  });

  it('hides the Seekers nav link when abilities.seeker does not include read', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Suchende' })).not.toBeInTheDocument();
  });
});

function PageA() {
  return (
    <div>
      <p>Page A content</p>
      <Link to="/page-b">Go to B</Link>
    </div>
  );
}

function PageB() {
  return <p>Page B content</p>;
}

function renderScrollShell() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/page-a']}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="page-a" element={<PageA />} />
              <Route path="page-b" element={<PageB />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AppShell scroll containers', () => {
  it('resets the main content scroll position on navigation, without touching the sidebar scroll position', async () => {
    renderScrollShell();
    await screen.findByText('Page A content');

    const main = screen.getByRole('main');
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    // jsdom doesn't do real layout/scrolling, but it does let a plain
    // scrollTop assignment stick - simulate "sidebar scrolled down, then a
    // link near the bottom of a long nav list is clicked" without needing
    // real scroll geometry.
    main.scrollTop = 500;
    nav.scrollTop = 300;

    await userEvent.click(screen.getByRole('link', { name: 'Go to B' }));
    await screen.findByText('Page B content');

    expect(main.scrollTop).toBe(0);
    // No effect targets the sidebar - its scroll position must survive a
    // route change untouched (e.g. so an expanded category stays visible).
    expect(nav.scrollTop).toBe(300);
  });

  it('still resets the main content scroll position on navigation in the mobile (drawer) layout', async () => {
    const originalMatchMedia = window.matchMedia;
    // Force the mobile branch: useMediaQuery('up(md)') must report false so
    // AppShell renders the Drawer instead of the static sidebar. This fix is
    // primarily about the desktop static sidebar, but the main content's
    // scroll-reset effect targets the same <main> element regardless of
    // which nav branch is active, so it must keep working here too.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      renderScrollShell();
      await screen.findByText('Page A content');

      const main = screen.getByRole('main');
      main.scrollTop = 500;

      await userEvent.click(screen.getByRole('link', { name: 'Go to B' }));
      await screen.findByText('Page B content');

      expect(main.scrollTop).toBe(0);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});

describe('AppShell gdpr gate', () => {
  it('shows only the gdpr gate for a non-consenting user, hiding the sidebar and the routed page', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user: { ...user, gdpr_accepted: false }, abilities: { event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/members'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Datenschutzbestimmungen' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mitglieder' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Hauptnavigation' })).not.toBeInTheDocument();
  });

  it('does not gate an impersonating admin, even though the impersonated member has not accepted gdpr', async () => {
    server.use(
      http.post('/api/v1/members/m1/impersonate', () => HttpResponse.json({ access_token: 'target-tok', user: { id: 2, firstname: 'Target', lastname: 'Member' } })),
      http.get('/api/v1/me', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer target-tok'
          ? HttpResponse.json({ user: { id: 2, firstname: 'Target', lastname: 'Member', gdpr_accepted: false }, abilities: {} })
          : HttpResponse.json({ user, abilities: { event: ['read'] } }),
      ),
    );
    renderShell();
    await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'trigger-impersonate' }));
    await waitFor(() => expect(screen.getByText('Ansicht als Target Member')).toBeInTheDocument());

    expect(screen.queryByRole('heading', { name: 'Datenschutzbestimmungen' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'trigger-impersonate' })).toBeInTheDocument();
  });

  it('reveals the routed page again once the gate is accepted', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user: { ...user, gdpr_accepted: false }, abilities: { event: ['read'] } })),
      http.patch('/api/v1/me/gdpr_acceptance', () => HttpResponse.json({ user: { ...user, gdpr_accepted: true }, abilities: { event: ['read'] } })),
    );
    const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><RouterProvider router={router} /></AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Datenschutzbestimmungen' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Ich akzeptiere die Datenschutzvereinbarung' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Datenschutzbestimmungen' })).not.toBeInTheDocument();
  });
});

describe('AppShell mobile drawer auto-close', () => {
  function forceMobile() {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    return () => { window.matchMedia = originalMatchMedia; };
  }

  it('closes the drawer after clicking a plain nav link', async () => {
    const restore = forceMobile();
    try {
      const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
      render(
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider><RouterProvider router={router} /></AuthProvider>
        </QueryClientProvider>,
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Menü öffnen' }));
      const eventsLink = await screen.findByRole('link', { name: 'Arbeitsplan' });
      await userEvent.click(eventsLink);
      await waitFor(() => expect(screen.queryByRole('link', { name: 'Arbeitsplan' })).not.toBeInTheDocument());
    } finally {
      restore();
    }
  });

  it('closes the drawer when a category header is clicked (it navigates too, so treat it like any other link), and also when a leaf directory link inside is clicked', async () => {
    const restore = forceMobile();
    try {
      server.use(
        http.get('/api/v1/me', () => HttpResponse.json({ user, abilities: { category: ['read'] } })),
        http.get('/api/v1/categories', () => HttpResponse.json({ rows: [{ slug: 'finanzen', name: 'Finanzen', description: null }], row_count: 1 })),
        http.get('/api/v1/directories', () => HttpResponse.json({ rows: [{ slug: 'rechnungen', name: 'Rechnungen', description: null }], row_count: 1 })),
      );
      const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
      render(
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider><RouterProvider router={router} /></AuthProvider>
        </QueryClientProvider>,
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Menü öffnen' }));
      const categoryLink = await screen.findByRole('link', { name: /Finanzen/ });
      await userEvent.click(categoryLink);
      // The header both expands the category (state persists in AppShell,
      // independent of the Drawer mounting/unmounting) and navigates, so the
      // drawer must close immediately - same as any other nav link.
      // Check that the category header link itself (Finanzen) is gone, which
      // unmounts synchronously with the drawer, proving it actually closed.
      await waitFor(() => expect(screen.queryByRole('link', { name: /Finanzen/ })).not.toBeInTheDocument());
      // Also verify Rechnungen is gone (proves drawer stays closed even once async
      // directories fetch resolves).
      await waitFor(() => expect(screen.queryByRole('link', { name: 'Rechnungen' })).not.toBeInTheDocument());

      // Reopening the drawer: the category is still expanded from before, so
      // its leaf link is immediately available - clicking it must also close.
      await userEvent.click(await screen.findByRole('button', { name: 'Menü öffnen' }));
      const directoryLink = await screen.findByRole('link', { name: 'Rechnungen' });
      await userEvent.click(directoryLink);
      await waitFor(() => expect(screen.queryByRole('link', { name: 'Rechnungen' })).not.toBeInTheDocument());
    } finally {
      restore();
    }
  });
});
