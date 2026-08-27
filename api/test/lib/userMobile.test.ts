import { describe, expect, it } from 'vitest';

import { computeUserMobile, isPresent } from '../../src/lib/userMobile.js';
import type { MobileCandidateAddress } from '../../src/lib/userMobile.js';

const ADDRESS_TYPE_PRIVATE = 0;
const ADDRESS_TYPE_BUSINESS = 1;

/** Minimal valid candidate with sane defaults, only overriding what a test cares about. */
function address(overrides: Partial<MobileCandidateAddress> & { id: number }): MobileCandidateAddress {
  return {
    type_of_address: null,
    mobile: null,
    deleted: false,
    ...overrides,
  };
}

describe('computeUserMobile', () => {
  it('prefers the private address mobile even when a business address also has one', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '0170 111' }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: '0170 222' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 111');
  });

  it('falls back to the business address mobile when the private address has none', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: null }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: '0170 222' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 222');
  });

  it('falls back to any other address type when neither private nor business has a mobile', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: null }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: null }),
      address({ id: 3, type_of_address: null, mobile: '0170 333' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 333');
  });

  it('returns null when no address has a mobile', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: null }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: null }),
    ];
    expect(computeUserMobile(addresses)).toBeNull();
  });

  it('returns null for an empty address list', () => {
    expect(computeUserMobile([])).toBeNull();
  });

  it('ignores addresses marked deleted, even a private one that would otherwise win', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '0170 111', deleted: true }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: '0170 222' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 222');
  });

  it('treats a null `deleted` as not-deleted (nullable Boolean? column)', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '0170 111', deleted: null }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 111');
  });

  it('treats a blank-string mobile as absent, matching isPresent() semantics', () => {
    const addresses = [
      address({ id: 1, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '   ' }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_BUSINESS, mobile: '0170 222' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 222');
  });

  it('picks the lowest id among multiple private addresses with a mobile', () => {
    const addresses = [
      address({ id: 5, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '0170 555' }),
      address({ id: 2, type_of_address: ADDRESS_TYPE_PRIVATE, mobile: '0170 222' }),
    ];
    expect(computeUserMobile(addresses)).toBe('0170 222');
  });
});

describe('isPresent', () => {
  it('is false for undefined, null, and blank/whitespace strings', () => {
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent('')).toBe(false);
    expect(isPresent('   ')).toBe(false);
  });

  it('is true for a non-blank string', () => {
    expect(isPresent('0170 111')).toBe(true);
  });
});
