import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import MemberAccordionList from './MemberAccordionList';
import type { Member, MemberSummary } from '../../api/types';
import '../../i18n';

function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    uuid: 'm1', email: 'mm@example.org', firstname: 'Max', lastname: 'Mitglied',
    matriculation_number: 42, job_title: 'Zimmermann', date_of_birth: '1980-01-01',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    addresses: [], roles: [], role_ids: [],
    can_edit: true, can_destroy: true, can_impersonate: true, editable_fields: ['job_title'],
    mother_lodge: null, accepted_at: null, mfa_enabled: false,
    ...overrides,
  } as Member;
}

function summaryFixture(overrides: Partial<MemberSummary> = {}): MemberSummary {
  return {
    uuid: 'm1', firstname: 'Max', lastname: 'Mitglied', can_edit: true, can_destroy: true, mfa_enabled: false,
    ...overrides,
  } as MemberSummary;
}

// Mutable, not a fixed fixture - the GET handler must reflect whatever the
// PATCH handler last saved, or the "saves and shows the updated value" test
// below would see stale data on the post-save refetch that invalidateQueries
// triggers (a static GET response would silently un-fix that regression).
let currentJobTitle = 'Zimmermann';

const server = setupServer(
  http.get('/api/v1/members/m1', () => HttpResponse.json(memberFixture({ job_title: currentJobTitle }))),
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })),
  http.patch('/api/v1/members/m1', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    currentJobTitle = body.job_title as string;
    return HttpResponse.json(memberFixture({ job_title: currentJobTitle }));
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  currentJobTitle = 'Zimmermann';
});
afterAll(() => server.close());

function renderList(members: MemberSummary[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MemberAccordionList members={members} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function expandRow() {
  await userEvent.click(screen.getByRole('button', { name: 'Max Mitglied' }));
  await screen.findByText('mm@example.org');
}

describe('MemberAccordionList', () => {
  it('does not show an edit button while the row is collapsed', () => {
    renderList([summaryFixture()]);
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
  });

  it('shows an edit button in the expanded body when the member can be edited', async () => {
    renderList([summaryFixture()]);
    await expandRow();
    expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
  });

  it('renders the accordion summary as a single, unmodified toggle control with no nested interactive elements (regression: invalid button-in-button a11y structure)', async () => {
    renderList([summaryFixture()]);
    const summaryButton = screen.getByRole('button', { name: 'Max Mitglied' });
    expect(within(summaryButton).queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not show an edit button when the member cannot be edited', async () => {
    renderList([summaryFixture({ can_edit: false })]);
    await expandRow();
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
  });

  it('shows a filled shield icon in the collapsed row summary (visible without expanding) when the member has MFA enabled', () => {
    renderList([summaryFixture({ mfa_enabled: true })]);
    const icon = screen.getByTestId('ShieldIcon');
    expect(icon).toHaveAttribute('aria-label', 'Zwei-Faktor-Authentifizierung aktiv');
    expect(screen.queryByTestId('ShieldOutlinedIcon')).not.toBeInTheDocument();
  });

  it('shows an outlined shield icon in the collapsed row summary when the member does not have MFA enabled', () => {
    renderList([summaryFixture({ mfa_enabled: false })]);
    const icon = screen.getByTestId('ShieldOutlinedIcon');
    expect(icon).toHaveAttribute('aria-label', 'Zwei-Faktor-Authentifizierung nicht eingerichtet');
    expect(screen.queryByTestId('ShieldIcon')).not.toBeInTheDocument();
  });

  it('does not show the MFA shield icon when the member cannot be edited (same gate as the edit button)', () => {
    renderList([summaryFixture({ can_edit: false, mfa_enabled: true })]);
    expect(screen.queryByTestId('ShieldIcon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ShieldOutlinedIcon')).not.toBeInTheDocument();
  });

  it('switches the accordion body to an editable form in place, without navigating away', async () => {
    renderList([summaryFixture()]);
    await expandRow();
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));

    expect(await screen.findByLabelText('Beruf')).toBeInTheDocument();
    // MemberDetails' plain-text rendering of job_title is gone - it's now a form field's value, not text content.
    expect(screen.queryByText('Zimmermann')).not.toBeInTheDocument();
  });

  it('reverts to the read-only view without saving when Cancel is clicked', async () => {
    renderList([summaryFixture()]);
    await expandRow();
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await screen.findByLabelText('Beruf');

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(await screen.findByText('Zimmermann')).toBeInTheDocument();
    expect(screen.queryByLabelText('Beruf')).not.toBeInTheDocument();
    // Toggling edit off must not also collapse the accordion - the row's
    // other details, and the edit button itself, should still be visible.
    expect(screen.getByText('mm@example.org')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
  });

  it('saves the edit and reverts to the updated read-only view on success', async () => {
    renderList([summaryFixture()]);
    await expandRow();
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const jobTitleField = await screen.findByLabelText('Beruf');
    await userEvent.clear(jobTitleField);
    await userEvent.type(jobTitleField, 'Steinmetz');

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(screen.queryByLabelText('Beruf')).not.toBeInTheDocument());
    expect(await screen.findByText('Steinmetz')).toBeInTheDocument();
  });

  it('stays in edit mode and shows the error when saving fails', async () => {
    server.use(
      http.patch('/api/v1/members/m1', () => HttpResponse.json({ error: 'validation_failed', detail: 'Beruf ist ungültig' }, { status: 422 })),
    );
    renderList([summaryFixture()]);
    await expandRow();
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    const jobTitleField = await screen.findByLabelText('Beruf');
    await userEvent.clear(jobTitleField);
    await userEvent.type(jobTitleField, 'Steinmetz');

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByText('Beruf ist ungültig')).toBeInTheDocument();
    // The form must not close/revert on failure - the whole point of
    // gating setIsEditing(false) behind onSuccess (see MemberAccordionList.tsx).
    expect(screen.getByLabelText('Beruf')).toBeInTheDocument();
  });
});
