import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import EventForm from './EventForm';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/events/defaults', () => HttpResponse.json({ location: null, duration_minutes: 60 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderForm(props: Partial<ComponentProps<typeof EventForm>> = {}) {
  const queryClient = new QueryClient();
  const onSubmit = props.onSubmit ?? vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventForm
          defaultValues={{ title: 'Alt', date: '2026-08-01', time: '19:00', whole_day: false }}
          submitting={false}
          {...props}
          onSubmit={onSubmit}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onSubmit };
}

describe('EventForm', () => {
  it('calls onSubmit with the edited title', async () => {
    const { onSubmit } = renderForm();
    const titleInput = screen.getByLabelText(/Titel/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Neu');
    await userEvent.click(screen.getByRole('button', { name: /Speichern/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Neu' }), expect.anything());
  });

  it('blocks submission when time is empty and whole_day is unchecked', async () => {
    const { onSubmit } = renderForm({ defaultValues: { title: 'Ohne Zeit', date: '2026-08-01', whole_day: false } });
    await userEvent.click(screen.getByRole('button', { name: /Speichern/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows submission without a time when whole_day is checked', async () => {
    const { onSubmit } = renderForm({ defaultValues: { title: 'Ganztags', date: '2026-08-01', whole_day: true } });
    await userEvent.click(screen.getByRole('button', { name: /Speichern/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ganztags' }), expect.anything());
  });

  it('shows the submitError message when the API rejects the submission', () => {
    renderForm({ submitError: 'Zeit muss ausgefüllt werden' });
    expect(screen.getByText('Zeit muss ausgefüllt werden')).toBeInTheDocument();
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const { onSubmit } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fills end time from the default duration when end time was empty', async () => {
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.type(beginInput, '2000');
    await userEvent.tab();
    await waitFor(() => expect(screen.getByLabelText(/Ende/i)).toHaveValue('21:00'));
  });

  it('shifts an already-filled end time by the same delta the begin time moved, preserving duration', async () => {
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '20:00', end_time: '22:00', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.clear(beginInput);
    await userEvent.type(beginInput, '2030');
    await userEvent.tab();
    await waitFor(() => expect(screen.getByLabelText(/Ende/i)).toHaveValue('22:30'));
  });

  it('never changes begin time when end time is edited', async () => {
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '20:00', end_time: '22:00', whole_day: false } });
    const endInput = screen.getByLabelText(/Ende/i);
    await userEvent.click(endInput);
    await userEvent.clear(endInput);
    await userEvent.type(endInput, '2300');
    await userEvent.tab();
    expect(screen.getByLabelText(/Beginn/i)).toHaveValue('20:00');
  });

  it('wraps end time past midnight when the shifted duration crosses into the next day', async () => {
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '22:00', end_time: '', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.clear(beginInput);
    await userEvent.type(beginInput, '2330');
    await userEvent.tab();
    await waitFor(() => expect(screen.getByLabelText(/Ende/i)).toHaveValue('00:30'));
  });

  it('does not shift end time from an empty prior begin value when end time is already filled', async () => {
    // Regression: prevBegin can legitimately be '' (begin was empty at focus time),
    // which differs from newBegin but is not a real prior duration to preserve.
    // Feeding '' into the shift computation would produce a 'NaN:NaN' end time.
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '', end_time: '22:00', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.type(beginInput, '2000');
    await userEvent.tab();
    expect(screen.getByLabelText(/Ende/i)).toHaveValue('22:00');
  });

  it('does not fill or shift end time when begin time is blurred without changing', async () => {
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '20:00', end_time: '', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.tab();
    expect(screen.getByLabelText(/Ende/i)).toHaveValue('');
  });

  it('uses the fetched duration_minutes from the defaults endpoint, not the hardcoded fallback', async () => {
    server.use(
      http.get('/api/v1/events/defaults', () => HttpResponse.json({ location: null, duration_minutes: 90 })),
    );
    renderForm({ defaultValues: { title: 'Alt', date: '2026-08-01', time: '', whole_day: false } });
    const beginInput = screen.getByLabelText(/Beginn/i);
    await userEvent.click(beginInput);
    await userEvent.type(beginInput, '2000');
    await userEvent.tab();
    await waitFor(() => expect(screen.getByLabelText(/Ende/i)).toHaveValue('21:30'));
  });
});
