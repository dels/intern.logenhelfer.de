import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import MemberForm from './MemberForm';
import type { MemberFormProps } from './MemberForm';
import '../../i18n';

const emptyValues = { firstname: '', lastname: '', email: '', date_of_birth: '', matriculation_number: undefined, job_title: '' };

const positionRolesFixture = [
  { id: 101, name: 'WorshipfulMaster', display_name: 'Meister vom Stuhl', email: null },
  { id: 102, name: 'Speaker', display_name: 'Redner', email: null },
];
const adminRolesFixture = [
  { id: 201, name: 'Secretary', display_name: 'Schriftführer', email: null },
  { id: 202, name: 'Treasurer', display_name: 'Schatzmeister', email: null },
];

// MSW v2 ignores query strings when matching a handler's path - registering
// separate handlers for '/api/v1/roles?scope=positions' and
// '...?scope=administrational' would collapse to the same '/api/v1/roles'
// path and always resolve to whichever handler was registered first. Branch
// on the parsed query param in a single handler instead.
const server = setupServer(
  http.get('/api/v1/roles', ({ request }) => {
    const scope = new URL(request.url).searchParams.get('scope');
    if (scope === 'positions') return HttpResponse.json({ rows: positionRolesFixture });
    if (scope === 'administrational') return HttpResponse.json({ rows: adminRolesFixture });
    return HttpResponse.json({ rows: [...positionRolesFixture, ...adminRolesFixture] });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// MemberForm now calls useRoles() (useQuery) for its role pickers, so every
// render needs a QueryClientProvider ancestor, not just the new tests.
function renderForm(props: MemberFormProps) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MemberForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MemberForm', () => {
  it('only renders job_title when editableFields is limited', () => {
    renderForm({
      defaultValues: emptyValues,
      editableFields: ['job_title'],
      onSubmit: vi.fn(),
      submitting: false,
    });
    expect(screen.getByLabelText(/Beruf/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/E-Mail/)).not.toBeInTheDocument();
  });

  it('renders all fields and submits them when editableFields is the full set', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: emptyValues,
      editableFields: ['email', 'firstname', 'lastname', 'date_of_birth', 'matriculation_number', 'job_title'],
      onSubmit,
      submitting: false,
    });
    await userEvent.type(screen.getByLabelText(/Vorname/), 'Max');
    await userEvent.type(screen.getByLabelText(/Nachname/), 'Mustermann');
    await userEvent.type(screen.getByLabelText(/E-Mail/), 'max@example.org');
    await userEvent.type(screen.getByLabelText(/Matrikelnummer/), '42');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ firstname: 'Max', lastname: 'Mustermann', email: 'max@example.org', matriculation_number: 42 });
  });

  it('renders and submits the degree dates when editable (regression: previously no field existed to fix a member missing entered_apprentice_since)', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max', lastname: 'Mustermann', email: 'max@example.org',
        entered_apprentice_since: '2010-05-01', fellow_craft_since: '', master_mason_since: '',
      },
      editableFields: ['job_title', 'entered_apprentice_since', 'fellow_craft_since', 'master_mason_since'],
      onSubmit,
      submitting: false,
    });

    expect(screen.getByLabelText(/Aufgenommen am/)).toHaveValue('2010-05-01');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ entered_apprentice_since: '2010-05-01' });
  });

  it('adds a new address row', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: { ...emptyValues, firstname: 'Max', lastname: 'Mustermann', email: 'max@example.org', addresses: [] },
      editableFields: ['job_title', 'addresses'],
      onSubmit,
      submitting: false,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Adresse hinzufügen' }));
    await userEvent.type(screen.getByLabelText(/Stadt/), 'Bremen');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      addresses: [expect.objectContaining({ city: 'Bremen' })],
    });
  });

  it('removes a persisted address by marking it _destroy, preserving its real id', async () => {
    // Regression test: useFieldArray's default keyName ("id") shadows a
    // real, persisted address's numeric id - MemberForm must use a
    // different keyName so the id submitted to the server is the real one,
    // not react-hook-form's own generated React key.
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        addresses: [{ id: 42, type_of_address: 0, purpose: 'Privat', city: 'Bremen' }],
      },
      editableFields: ['job_title', 'addresses'],
      onSubmit,
      submitting: false,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Adresse entfernen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      addresses: [expect.objectContaining({ id: 42, _destroy: true })],
    });
  });

  it('preserves a persisted address\'s real id when editing another field on it (sanity check, not a keyName regression guard)', async () => {
    // Unlike the remove test above, this does NOT exercise the keyName
    // id-shadowing bug: Controller-bound field edits (city here) write
    // directly into react-hook-form's internal form values by dot-path
    // name and never read/write through the `fields`/`update()` snapshot
    // where the shadowing occurred - only `update()` (used by the remove
    // button) rebuilds a row from that snapshot. This test still passes
    // identically with or without `keyName: '_key'` - kept as a general
    // correctness check, not proof against that specific bug class.
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        addresses: [{ id: 42, type_of_address: 0, purpose: 'Privat', city: 'Bremen' }],
      },
      editableFields: ['job_title', 'addresses'],
      onSubmit,
      submitting: false,
    });

    const cityField = screen.getByLabelText(/Stadt/);
    await userEvent.clear(cityField);
    await userEvent.type(cityField, 'Bremerhaven');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      addresses: [expect.objectContaining({ id: 42, city: 'Bremerhaven' })],
    });
  });

  it('lists the Bezeichnung (purpose) field before Adresstyp (type_of_address), matching the read view\'s purpose-first headline', async () => {
    renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat' }],
      },
      editableFields: ['job_title', 'addresses'],
      onSubmit: vi.fn(),
      submitting: false,
    });

    const purposeField = screen.getByLabelText('Bezeichnung');
    const typeField = screen.getByLabelText('Adresstyp');
    // eslint-disable-next-line no-bitwise
    expect(purposeField.compareDocumentPosition(typeField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows mother lodge and accepted-on fields when editable', async () => {
    renderForm({
      defaultValues: { mother_lodge: '', accepted_at: '', role_ids: [] },
      editableFields: ['mother_lodge', 'accepted_at'],
      onSubmit: vi.fn(),
      submitting: false,
    });
    expect(await screen.findByLabelText('Mutterloge')).toBeInTheDocument();
    expect(screen.getByLabelText('Angenommen am')).toBeInTheDocument();
  });

  it('hides mother lodge and accepted-on fields when not editable', () => {
    renderForm({
      defaultValues: {},
      editableFields: [],
      onSubmit: vi.fn(),
      submitting: false,
    });
    expect(screen.queryByLabelText('Mutterloge')).not.toBeInTheDocument();
  });

  it('shows position and admin-role pickers when editable, and submits selected role_ids', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: { role_ids: [] },
      editableFields: ['role_ids'],
      onSubmit,
      submitting: false,
    });
    const user = userEvent.setup();

    const positionsField = await screen.findByLabelText('Ämter');
    await user.click(positionsField);
    await user.click(await screen.findByText('Meister vom Stuhl'));

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    // Not toHaveBeenCalledWith(expect.objectContaining(...)) - react-hook-form's
    // handleSubmit invokes onSubmit with a second (SyntheticEvent) argument,
    // so an exact-args matcher like toHaveBeenCalledWith never matches here.
    // Every other test in this file already inspects mock.calls[0]?.[0]
    // for exactly this reason - follow that convention instead.
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ role_ids: expect.arrayContaining([expect.any(Number)]) });
  });

  it('selecting an admin role preserves an already-selected position role, and vice versa (shared role_ids array)', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: { role_ids: [] },
      editableFields: ['role_ids'],
      onSubmit,
      submitting: false,
    });
    const user = userEvent.setup();

    const positionsField = await screen.findByLabelText('Ämter');
    await user.click(positionsField);
    await user.click(await screen.findByText('Meister vom Stuhl'));

    const adminField = screen.getByLabelText('Verwaltungsrollen');
    await user.click(adminField);
    await user.click(await screen.findByText('Schriftführer'));

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      role_ids: expect.arrayContaining([101, 201]),
    });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = vi.fn();
    renderForm({
      defaultValues: emptyValues,
      editableFields: ['job_title'],
      onSubmit,
      submitting: false,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel instead of navigating when provided', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderForm({
      defaultValues: emptyValues,
      editableFields: ['job_title'],
      onSubmit,
      submitting: false,
      onCancel,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders a base-data mobile field independent of the per-address mobile fields, and submits the base field without resubmitting untouched addresses', async () => {
    // Regression guard for conflating the new top-level `mobile` scalar with
    // the pre-existing per-address `addresses.${index}.mobile` field - both
    // render with the same "Mobil" label text, so they're disambiguated here
    // by their `name` attribute rather than by label alone.
    //
    // Also the regression test for the final-review fix: editing ONLY the
    // base-data mobile field must NOT resubmit the (untouched) `addresses`
    // array - the backend's syncUserMobile runs whenever `addresses` is
    // present with length > 0 and would otherwise silently overwrite this
    // same-request direct `mobile` edit. See members.test.ts for the
    // matching backend-level coverage.
    const onSubmit = vi.fn();
    const { container } = renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        mobile: '0151-1111111',
        addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', mobile: '0170-2222222' }],
      },
      editableFields: ['job_title', 'mobile', 'addresses'],
      onSubmit,
      submitting: false,
    });

    const baseMobileInput = container.querySelector('input[name="mobile"]') as HTMLInputElement;
    const addressMobileInput = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
    expect(baseMobileInput).toBeInTheDocument();
    expect(addressMobileInput).toBeInTheDocument();
    expect(baseMobileInput).toHaveValue('0151-1111111');
    expect(addressMobileInput).toHaveValue('0170-2222222');

    await userEvent.clear(baseMobileInput);
    await userEvent.type(baseMobileInput, '0151-9999999');
    // Editing the base-data field must not touch the address field's value.
    expect(addressMobileInput).toHaveValue('0170-2222222');

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ mobile: '0151-9999999' });
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty('addresses');
  });

  it('editing an address field DOES resubmit addresses, even alongside an untouched base-data mobile field', async () => {
    // Inverse of the test above: a real address edit must keep triggering
    // the backend's sync-on-write behavior as designed.
    const onSubmit = vi.fn();
    const { container } = renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        mobile: '0151-1111111',
        addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', city: 'Bremen', mobile: '0170-2222222' }],
      },
      editableFields: ['job_title', 'mobile', 'addresses'],
      onSubmit,
      submitting: false,
    });

    const addressMobileInput = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
    await userEvent.clear(addressMobileInput);
    await userEvent.type(addressMobileInput, '0170-3333333');

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      mobile: '0151-1111111',
      addresses: [expect.objectContaining({ id: 1, mobile: '0170-3333333' })],
    });
  });

  it('does not render the base-data mobile field when not editable', () => {
    renderForm({
      defaultValues: emptyValues,
      editableFields: ['job_title'],
      onSubmit: vi.fn(),
      submitting: false,
    });
    expect(document.querySelector('input[name="mobile"]')).not.toBeInTheDocument();
  });

  it('shows a non-interactive info tooltip next to the base-data mobile field explaining it is normally derived from an address', async () => {
    renderForm({
      defaultValues: { ...emptyValues, mobile: '' },
      editableFields: ['job_title', 'mobile'],
      onSubmit: vi.fn(),
      submitting: false,
    });

    const infoIcon = screen.getByTestId('mobile-field-info-icon');
    // Plain style assertion, not a hover simulation - this must hold
    // regardless of whether the tooltip is currently shown.
    expect(getComputedStyle(infoIcon).cursor).toBe('default');

    await userEvent.hover(infoIcon);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(/Adresse/);
  });

  it('characterization: a second save in the SAME mounted instance still resubmits addresses left dirty by an earlier edit', async () => {
    // dirtyFields is computed against react-hook-form's mount-time
    // _defaultValues and nothing in MemberForm itself ever resets it after a
    // successful submit (see submitWithNormalizedDates's own comment for why
    // resetting inside the submit handler is deliberately NOT done - it
    // would also clear dirty state on a FAILED save, silently dropping a
    // real edit on retry). So within one mount, an earlier address edit
    // keeps `addresses` marked dirty forever, even across an unrelated
    // later save that only touches the base-data mobile field. This is not
    // a bug in MemberForm - every consumer is expected to unmount/remount
    // the form after a successful save to get fresh dirty-state (see
    // AccountPage.tsx's `key`-bump fix and AccountPage.test.tsx's matching
    // regression test for the one consumer where staying mounted across
    // saves is possible).
    const onSubmit = vi.fn();
    const { container } = renderForm({
      defaultValues: {
        ...emptyValues,
        firstname: 'Max',
        lastname: 'Mustermann',
        email: 'max@example.org',
        mobile: '0151-1111111',
        addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', mobile: '0170-2222222' }],
      },
      editableFields: ['job_title', 'mobile', 'addresses'],
      onSubmit,
      submitting: false,
    });

    const addressMobile = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
    await userEvent.clear(addressMobile);
    await userEvent.type(addressMobile, '0170-3333333');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const baseMobile = container.querySelector('input[name="mobile"]') as HTMLInputElement;
    await userEvent.clear(baseMobile);
    await userEvent.type(baseMobile, '0151-9999999');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));

    // Documents the actual (unfixed-at-this-layer) behavior: addresses is
    // still present on the second call, still carrying the FIRST edit's
    // value, unrelated to the second save's base-data mobile edit.
    expect(onSubmit.mock.calls[1]![0]).toHaveProperty('addresses');
    expect(onSubmit.mock.calls[1]![0]).toMatchObject({
      mobile: '0151-9999999',
      addresses: [expect.objectContaining({ mobile: '0170-3333333' })],
    });
  });

  it('remounting between saves (matching the AccountPage fix) genuinely resets dirty state, so a second save omits untouched addresses', async () => {
    // Pins the actual fix mechanism at this layer: unlike the
    // characterization test above, this simulates AccountPage's `key`-bump
    // by re-rendering MemberForm with a fresh key (and fresh defaultValues,
    // as AccountPage's remount also picks up post-save data) between the
    // two saves.
    const onSubmit = vi.fn();
    const firstDefaults = {
      ...emptyValues,
      firstname: 'Max',
      lastname: 'Mustermann',
      email: 'max@example.org',
      mobile: '0151-1111111',
      addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', mobile: '0170-2222222' }],
    };
    const queryClient = new QueryClient();
    const { container, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MemberForm
            key={0}
            defaultValues={firstDefaults}
            editableFields={['job_title', 'mobile', 'addresses']}
            onSubmit={onSubmit}
            submitting={false}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const addressMobile = container.querySelector('input[name="addresses.0.mobile"]') as HTMLInputElement;
    await userEvent.clear(addressMobile);
    await userEvent.type(addressMobile, '0170-3333333');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    // Remount with fresh defaultValues carrying the just-saved address
    // mobile forward - exactly what AccountPage's re-derived defaultValues
    // (built from the now-updated `member`) would look like post-save.
    const secondDefaults = {
      ...firstDefaults,
      addresses: [{ id: 1, type_of_address: 0, purpose: 'Privat', mobile: '0170-3333333' }],
    };
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MemberForm
            key={1}
            defaultValues={secondDefaults}
            editableFields={['job_title', 'mobile', 'addresses']}
            onSubmit={onSubmit}
            submitting={false}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const baseMobile = container.querySelector('input[name="mobile"]') as HTMLInputElement;
    await userEvent.clear(baseMobile);
    await userEvent.type(baseMobile, '0151-9999999');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));

    expect(onSubmit.mock.calls[1]![0]).not.toHaveProperty('addresses');
    expect(onSubmit.mock.calls[1]![0]).toMatchObject({ mobile: '0151-9999999' });
  });
});
