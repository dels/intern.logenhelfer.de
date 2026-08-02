import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, screen } from '@testing-library/react';
import { act, createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { csvLine, vcardFor, addressBlock, useCreateMember, useUpdateMember, useDeleteMember } from './api';
import type { CsvExportRow, ExportRow, Member } from '../../api/types';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    uuid: 'm1',
    email: 'mm@example.org',
    firstname: 'Max',
    lastname: 'Mitglied',
    matriculation_number: 42,
    job_title: 'Zimmermann',
    date_of_birth: '1980-01-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    addresses: [],
    roles: [],
    role_ids: [],
    can_edit: true,
    can_destroy: true,
    can_impersonate: true,
    editable_fields: ['firstname'],
    mother_lodge: null,
    accepted_at: null,
    mfa_enabled: false,
    ...overrides,
  };
}

const server = setupServer(
  http.post('/api/v1/members', () => HttpResponse.json(memberFixture())),
  http.patch('/api/v1/members/:uuid', () => HttpResponse.json(memberFixture())),
  http.delete('/api/v1/members/:uuid', () => new HttpResponse(null, { status: 204 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function toastWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, createElement(ToastProvider, null, children));
}

type Address = CsvExportRow['addresses'][number];

function csvExportRow(overrides: Partial<CsvExportRow> = {}): CsvExportRow {
  return {
    uuid: 'u-1',
    lastname: 'Muster',
    firstname: 'Max',
    fullname: 'Max Muster',
    email: 'max@example.org',
    date_of_birth: null,
    addresses: [],
    ...overrides,
  };
}

function fullAddress(overrides: Partial<Address> = {}): Address {
  return {
    type_of_address: 0,
    vcf_type: 'HOME',
    street1: 'Musterstr. 1',
    street2: null,
    street3: null,
    street: 'Musterstr. 1',
    zip: '12345',
    city: 'Musterstadt',
    phone: '0123456',
    fax: '040-1',
    mobile: '0170123456',
    email: 'max@example.org',
    remarks: null,
    ...overrides,
  };
}

describe('csvLine', () => {
  it('prints the correct lastname/firstname/email when present', () => {
    const line = csvLine(csvExportRow());
    expect(line).toContain('Muster; Max;max@example.org;');
    expect(line).not.toContain('null');
  });

  it('leaves lastname/firstname blank instead of printing "null" when absent', () => {
    const line = csvLine(csvExportRow({ lastname: null, firstname: null }));
    expect(line).not.toContain('null');
    expect(line.startsWith('; ;')).toBe(true);
  });
});

describe('vcardFor', () => {
  it('prints the correct N/FN/address fields when present', () => {
    const vcf = vcardFor(csvExportRow({ addresses: [fullAddress()] }));
    expect(vcf).toContain('N:Muster; Max');
    expect(vcf).toContain('FN:Max Muster');
    expect(vcf).toContain('ADR;TYPE=postal,parcel,HOME:;;Musterstr. 1;Musterstadt;;12345;');
    expect(vcf).not.toContain('null');
  });

  it('leaves N blank and omits unset address components instead of printing "null" when lastname/firstname/city/zip are absent', () => {
    const vcf = vcardFor(csvExportRow({
      lastname: null,
      firstname: null,
      addresses: [fullAddress({ zip: null, city: null, phone: null, fax: null, mobile: null })],
    }));
    expect(vcf).not.toContain('null');
    expect(vcf).toContain('N:; ');
    expect(vcf).toContain('ADR;TYPE=postal,parcel,HOME:;;Musterstr. 1;;;;');
  });
});

describe('addressBlock', () => {
  const full: ExportRow['business_address'] = {
    street: 'Musterstr. 1', zip: '12345', city: 'Musterstadt', phone: '0123456', fax: '040-1', mobile: '0170123456', email: 'max@example.org',
  };

  it('prints every field with the correct value when all are present', () => {
    expect(addressBlock(full)).toBe('Musterstr. 1\n12345 Musterstadt\nTel: 0123456\nMobil: 0170123456\nFax: 040-1\nE-Mail: max@example.org');
  });

  it('returns "-" when the address itself is absent', () => {
    expect(addressBlock(null)).toBe('-');
  });

  it('omits every null field entirely instead of printing "null"', () => {
    const block = addressBlock({ street: 'Musterstr. 1', zip: null, city: null, phone: null, fax: null, mobile: null, email: null });
    expect(block).not.toContain('null');
    expect(block).toBe('Musterstr. 1');
  });

  it('includes the zip/city line when only one of the two is present, without the word null', () => {
    const block = addressBlock({ street: 'Musterstr. 1', zip: '12345', city: null, phone: null, fax: null, mobile: null, email: null });
    expect(block).not.toContain('null');
    expect(block).toBe('Musterstr. 1\n12345');
  });
});

describe('members api toasts', () => {
  it('shows a success toast after creating a member', async () => {
    const { result } = renderHook(() => useCreateMember(), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate({ firstname: 'Max', lastname: 'Mitglied' });
    });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a member', async () => {
    const { result } = renderHook(() => useUpdateMember('m1'), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate({ job_title: 'Zimmermann' });
    });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a member', async () => {
    const { result } = renderHook(() => useDeleteMember(), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate('m1');
    });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
