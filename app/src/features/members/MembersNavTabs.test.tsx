import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import MembersNavTabs from './MembersNavTabs';
import '../../i18n';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/members" element={<MembersNavTabs />} />
        <Route path="/members/phone-list" element={<MembersNavTabs />} />
        <Route path="/members/birthday-list" element={<MembersNavTabs />} />
        <Route path="/members/council" element={<MembersNavTabs />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MembersNavTabs', () => {
  it('renders all four tabs with the correct labels', () => {
    renderAt('/members');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toBeInTheDocument();
  });

  it('marks the Members tab as selected when on /members', () => {
    renderAt('/members');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toHaveAttribute('aria-selected', 'false');
  });

  it('marks the Phone list tab as selected when on /members/phone-list', () => {
    renderAt('/members/phone-list');
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toHaveAttribute('aria-selected', 'false');
  });

  it('marks the Birthday list tab as selected when on /members/birthday-list', () => {
    renderAt('/members/birthday-list');
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the Council tab as selected when on /members/council', () => {
    renderAt('/members/council');
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to the phone list when its tab is clicked', async () => {
    renderAt('/members');
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Telefonliste' }));
    expect(await screen.findByRole('tab', { name: 'Telefonliste' })).toHaveAttribute('aria-selected', 'true');
  });
});
