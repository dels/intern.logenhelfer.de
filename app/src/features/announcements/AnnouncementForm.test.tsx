import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import AnnouncementForm from './AnnouncementForm';
import '../../i18n';

function renderForm(onSubmit = vi.fn()) {
  render(
    <MemoryRouter>
      <AnnouncementForm defaultValues={{ title: '', message_body: '' }} onSubmit={onSubmit} submitting={false} />
    </MemoryRouter>,
  );
  return onSubmit;
}

describe('AnnouncementForm', () => {
  it('submits the entered title and message body', async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Wichtige Mitteilung');
    await userEvent.type(screen.getByLabelText(/Text/), 'Hallo an alle');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ title: 'Wichtige Mitteilung', message_body: 'Hallo an alle' });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
