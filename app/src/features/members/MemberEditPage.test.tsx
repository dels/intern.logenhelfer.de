import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import MemberEditPage from './MemberEditPage';
import { useMember, useUpdateMember } from './api';
import type { Member } from '../../api/types';
import '../../i18n';

// Regression coverage for: editing a member and saving wiped all of their
// roles. Root cause was MemberEditPage never seeding `role_ids` into the
// defaultValues it hands to MemberForm, even though Member (and the API)
// always carries it - react-hook-form then submits `role_ids: undefined`
// on save whenever the role pickers aren't touched.
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    useMember: vi.fn(),
    useUpdateMember: vi.fn(),
  };
});

const mockedUseMember = vi.mocked(useMember);
const mockedUseUpdateMember = vi.mocked(useUpdateMember);

// MemberForm renders real role-picker Autocompletes backed by useRoles()
// (a real useQuery call from ../categories/api), so it needs a working
// /api/v1/roles handler even though this test never touches those fields.
const server = setupServer(http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    uuid: 'm1',
    email: 'mm@example.org',
    firstname: 'Max',
    lastname: 'Mitglied',
    matriculation_number: 42,
    job_title: 'Zimmermann',
    mobile: null,
    date_of_birth: '1980-01-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    addresses: [],
    roles: [
      { display_name: 'Lehrling', kind: 'administrational' },
      { display_name: 'Schriftführer', kind: 'positions' },
    ],
    role_ids: [1, 2],
    can_edit: true,
    can_destroy: true,
    can_impersonate: true,
    editable_fields: ['firstname', 'role_ids'],
    mother_lodge: null,
    accepted_at: null,
    mfa_enabled: false,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/members/m1/edit']}>
        <Routes>
          <Route path="/members/:uuid/edit" element={<MemberEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MemberEditPage', () => {
  it("preserves the member's existing role_ids on save when the role fields are never touched (regression: previously omitted from defaultValues, wiping all roles on every save)", async () => {
    mockedUseMember.mockReturnValue({
      data: memberFixture(),
      isLoading: false,
    } as unknown as ReturnType<typeof useMember>);

    const mutate = vi.fn();
    mockedUseUpdateMember.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateMember>);

    renderPage();

    // Only edit an unrelated field - never touch the role pickers.
    await userEvent.type(await screen.findByLabelText(/Vorname/), 'imilian');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0]?.[0]).toMatchObject({ role_ids: [1, 2] });
  });
});
