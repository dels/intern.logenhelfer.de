import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Breadcrumbs from './Breadcrumbs';
import { BreadcrumbProvider, useSetBreadcrumb } from './BreadcrumbContext';
import '../i18n';

function renderAt(path: string) {
  cleanup();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BreadcrumbProvider>
        <Breadcrumbs />
      </BreadcrumbProvider>
    </MemoryRouter>,
  );
}

test('dashboard shows a single, non-linked Home crumb', () => {
  renderAt('/dashboard');
  expect(screen.getByText('Übersicht')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('a section index route shows only the section label, no leading Übersicht crumb', () => {
  renderAt('/members');
  // members is the current page here, so it's the only crumb, non-linked
  expect(screen.getByText('Mitglieder')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Mitglieder' })).not.toBeInTheDocument();
  expect(screen.queryByText('Übersicht')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByText('Neues Mitglied')).not.toBeInTheDocument();
  expect(screen.queryByText('Bearbeiten')).not.toBeInTheDocument();
});

test('another section\'s own index route (events) also shows only its label, no Übersicht crumb', () => {
  renderAt('/events');
  expect(screen.getByText('Arbeitsplan')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Arbeitsplan' })).not.toBeInTheDocument();
  expect(screen.queryByText('Übersicht')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('a detail route shows only the linked Section crumb, no Übersicht prefix', () => {
  renderAt('/members/member-1');
  expect(screen.queryByText('Übersicht')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.queryByText('Neues Mitglied')).not.toBeInTheDocument();
  expect(screen.queryByText('Bearbeiten')).not.toBeInTheDocument();
});

test('the phone list route shows its own distinguishing third crumb', () => {
  renderAt('/members/phone-list');
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.getByText('Telefonliste')).toBeInTheDocument();
  expect(screen.queryByText('Neues Mitglied')).not.toBeInTheDocument();
});

test('the birthday list route shows its own distinguishing third crumb', () => {
  renderAt('/members/birthday-list');
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.getByText('Geburtstagsliste')).toBeInTheDocument();
});

test('the council route shows its own distinguishing third crumb', () => {
  renderAt('/members/council');
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.getByText('Beamtenrat')).toBeInTheDocument();
});

test('a "new" route shows Section(linked)/create-label, no Übersicht prefix', () => {
  renderAt('/members/new');
  expect(screen.queryByText('Übersicht')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.getByText('Neues Mitglied')).toBeInTheDocument();
});

test('an "edit" route shows the three-crumb trail ending in the edit label', () => {
  renderAt('/members/member-1/edit');
  expect(screen.getByRole('link', { name: 'Mitglieder' })).toHaveAttribute('href', '/members');
  expect(screen.getByText('Bearbeiten')).toBeInTheDocument();
});

test('directories and files roll up into the Categories section', () => {
  renderAt('/directories/finanzen');
  expect(screen.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');

  renderAt('/files/file-1');
  expect(screen.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');
});

test('a nested "new" route uses the nested feature\'s own create label, not the parent segment\'s', () => {
  renderAt('/categories/finanzen/directories/new');
  expect(screen.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');
  expect(screen.getByText('Neuer Ordner')).toBeInTheDocument();

  renderAt('/lodges/loge-1/officers/new');
  expect(screen.getByRole('link', { name: 'Logen' })).toHaveAttribute('href', '/lodges');
  expect(screen.getByText('Neuer Amtsträger')).toBeInTheDocument();
});

test('officers roll up into the Lodges section', () => {
  renderAt('/officers/officer-1/edit');
  expect(screen.getByRole('link', { name: 'Logen' })).toHaveAttribute('href', '/lodges');
  expect(screen.getByText('Bearbeiten')).toBeInTheDocument();
});

test('an unknown route falls back to a single linked Home crumb', () => {
  renderAt('/something-unmapped');
  expect(screen.getByRole('link', { name: 'Übersicht' })).toHaveAttribute('href', '/dashboard');
});

function RegisteringPage({ items }: { items: { label: string; to?: string }[] }) {
  useSetBreadcrumb(items);
  return null;
}

test('a page-registered breadcrumb trail overrides the generic URL-derived fallback', () => {
  cleanup();
  render(
    <MemoryRouter initialEntries={['/categories/finanzen/directories/protokolle']}>
      <BreadcrumbProvider>
        <RegisteringPage items={[
          { label: 'Übersicht', to: '/dashboard' },
          { label: 'Finanzen', to: '/categories/finanzen' },
          { label: 'Protokolle' },
        ]} />
        <Breadcrumbs />
      </BreadcrumbProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Finanzen' })).toHaveAttribute('href', '/categories/finanzen');
  expect(screen.getByText('Protokolle')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Kategorien' })).not.toBeInTheDocument();
});
