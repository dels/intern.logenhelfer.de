import { describe, expect, it } from 'vitest';
import { buildMemberFormDefaults } from './memberFormDefaults';
import type { Member } from '../../api/types';

function memberFixture(overrides: Partial<Member> = {}): Member {
  return {
    uuid: 'm1',
    email: 'mm@example.org',
    firstname: 'Max',
    lastname: 'Mitglied',
    matriculation_number: 42,
    job_title: 'Zimmermann',
    mobile: '0151-0000000',
    date_of_birth: '1980-01-01',
    entered_apprentice_since: '2000-01-01',
    fellow_craft_since: '2001-01-01',
    master_mason_since: '2002-01-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    addresses: [],
    roles: [],
    role_ids: [1, 2],
    can_edit: true,
    can_destroy: true,
    can_impersonate: true,
    editable_fields: ['firstname'],
    mother_lodge: null,
    accepted_at: null,
    ...overrides,
  } as Member;
}

describe('buildMemberFormDefaults', () => {
  it('maps scalar fields and preserves role_ids', () => {
    const result = buildMemberFormDefaults(memberFixture());
    expect(result).toMatchObject({
      email: 'mm@example.org',
      firstname: 'Max',
      lastname: 'Mitglied',
      matriculation_number: 42,
      job_title: 'Zimmermann',
      mobile: '0151-0000000',
      date_of_birth: '1980-01-01',
      role_ids: [1, 2],
    });
  });

  it('maps each address, renaming street to street1', () => {
    const result = buildMemberFormDefaults(memberFixture({
      addresses: [{
        id: 7, type_of_address: 0, purpose: 'Privat', street: 'Teststr. 1',
        zip: '28203', city: 'Bremen', phone: '0421', fax: null, mobile: null, email: null,
      }],
    }));
    expect(result.addresses).toEqual([{
      id: 7, type_of_address: 0, purpose: 'Privat', street1: 'Teststr. 1',
      zip: '28203', city: 'Bremen', phone: '0421', fax: null, mobile: null, email: null,
    }]);
  });

  it('maps the top-level mobile scalar independently of any per-address mobile value', () => {
    // Regression guard: the top-level `mobile` (base-data, directly
    // editable) and each address's own `mobile` are two different source
    // fields (`member.mobile` vs. `address.mobile`) that must not get
    // conflated in this mapping - here they're deliberately given
    // different values to prove neither overwrites the other.
    const result = buildMemberFormDefaults(memberFixture({
      mobile: '0151-0000000',
      addresses: [{
        id: 7, type_of_address: 0, purpose: 'Privat', street: 'Teststr. 1',
        zip: '28203', city: 'Bremen', phone: '0421', fax: null, mobile: '0170-9999999', email: null,
      }],
    }));
    expect(result.mobile).toBe('0151-0000000');
    expect(result.addresses?.[0]?.mobile).toBe('0170-9999999');
  });

  it('defaults matriculation_number to undefined when absent, not null', () => {
    const result = buildMemberFormDefaults(memberFixture({ matriculation_number: null }));
    expect(result.matriculation_number).toBeUndefined();
  });
});
