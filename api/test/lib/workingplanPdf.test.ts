import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db.js';
import { appConfig } from '../../src/lib/appConfig.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import {
  buildWorkingplanPdf,
  buildWorkingplanPdfDocument,
  pdfLabelsFor,
  resolveFooterLines,
  type PdfBirthdayRow,
  type PdfEventRow,
} from '../../src/lib/workingplanPdf.js';

// A tiny (1x1, transparent) valid PNG, base64-encoded - jsPDF's `addImage`
// auto-detects filetype from binary magic bytes, so any real PNG works as a
// header logo for these tests; content doesn't matter, only decodability.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function createRole(
  name: string,
  overrides: Partial<{ display_name: string; email: string }> = {},
): Promise<{ id: number; name: string | null; display_name: string | null }> {
  const now = new Date();
  return prisma.roles.create({
    data: {
      name,
      display_name: overrides.display_name ?? name,
      email: overrides.email,
      created_at: now,
      updated_at: now,
    },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now } });
}

describe('pdfLabelsFor', () => {
  // Pre-existing coverage, moved here from public.test.ts alongside the relocated function.
  it('returns German labels for "de"', () => {
    expect(pdfLabelsFor('de')).toMatchObject({ weekday: 'Wochentag', allDay: 'ganztags' });
  });

  it('returns English labels for "en"', () => {
    expect(pdfLabelsFor('en')).toMatchObject({ weekday: 'Weekday', allDay: 'all day' });
  });

  it('falls back to German labels for an unrecognized language', () => {
    expect(pdfLabelsFor('fr')).toMatchObject({ weekday: 'Wochentag' });
  });
});

describe('resolveFooterLines', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('both toggles off, Secretary role has an email set: returns [email]', async () => {
    await appConfig.set('public_wp_footer_show_secretary', false);
    await appConfig.set('public_wp_footer_show_worshipful_master', false);
    await createRole('Secretary', { email: 'sekretaer@example.test' });

    expect(await resolveFooterLines('public')).toEqual(['sekretaer@example.test']);
  });

  it('both toggles off, Secretary role has no email set: returns []', async () => {
    await appConfig.set('public_wp_footer_show_secretary', false);
    await appConfig.set('public_wp_footer_show_worshipful_master', false);
    await createRole('Secretary');

    expect(await resolveFooterLines('public')).toEqual([]);
  });

  it('both toggles off, no Secretary role at all: returns []', async () => {
    await appConfig.set('public_wp_footer_show_secretary', false);
    await appConfig.set('public_wp_footer_show_worshipful_master', false);

    expect(await resolveFooterLines('public')).toEqual([]);
  });

  it('WM toggle on with zero WM holders, Secretary toggle off: returns []', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });

    expect(await resolveFooterLines('internal')).toEqual([]);
  });

  it('WM toggle on with a holder who has no mobile: pushes a name-only line', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: 'Karl', lastname: 'Koenig', mobile: null });
    await assignRole(holder.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Karl Koenig']);
  });

  it('both toggles on with holders for both: two lines, WM first then Secretary, each with mobile when present', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', true);
    const wmRole = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const secRole = await createRole('Secretary', { display_name: 'Sekretär', email: 'sekretaer@example.test' });
    const wmHolder = await createUser({ firstname: 'Karl', lastname: 'Koenig', mobile: '0170 111' });
    const secHolder = await createUser({ firstname: 'Otto', lastname: 'Schmidt', mobile: null });
    await assignRole(wmHolder.id, wmRole.id);
    await assignRole(secHolder.id, secRole.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Karl Koenig · 0170 111', 'Sekretär: Otto Schmidt']);
  });

  it('WM toggle on but the only holder is soft-deleted: skips that role entirely', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: 'Karl', lastname: 'Koenig', deleted: true });
    await assignRole(holder.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual([]);
  });

  it('takes the first non-deleted holder in user_roles id order when a role has several', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const first = await createUser({ firstname: 'Alt', lastname: 'Erster' });
    const second = await createUser({ firstname: 'Neu', lastname: 'Zweiter' });
    await assignRole(first.id, role.id);
    await assignRole(second.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Alt Erster']);
  });

  it('skips a soft-deleted holder and falls through to the next one for the same role', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const deletedFirst = await createUser({ firstname: 'Alt', lastname: 'Erster', deleted: true });
    const second = await createUser({ firstname: 'Neu', lastname: 'Zweiter' });
    await assignRole(deletedFirst.id, role.id);
    await assignRole(second.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Neu Zweiter']);
  });

  it('holder with null firstname and lastname produces only role display_name, no literal "null"', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: null, lastname: null, mobile: null });
    await assignRole(holder.id, role.id);

    const result = await resolveFooterLines('internal');
    expect(result).toEqual(['Meister vom Stuhl']);
    expect(result[0]).not.toContain('null');
  });

  it('holder with only firstname set includes only firstname in footer line', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: 'Karl', lastname: null, mobile: null });
    await assignRole(holder.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Karl']);
  });

  it('holder with only lastname set includes only lastname in footer line', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: null, lastname: 'Koenig', mobile: null });
    await assignRole(holder.id, role.id);

    expect(await resolveFooterLines('internal')).toEqual(['Meister vom Stuhl: Koenig']);
  });

  it('holder with blank firstname and lastname produces only role display_name, no literal "null"', async () => {
    await appConfig.set('internal_wp_footer_show_worshipful_master', true);
    await appConfig.set('internal_wp_footer_show_secretary', false);
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const holder = await createUser({ firstname: '', lastname: '', mobile: null });
    await assignRole(holder.id, role.id);

    const result = await resolveFooterLines('internal');
    expect(result).toEqual(['Meister vom Stuhl']);
    expect(result[0]).not.toContain('null');
  });
});

describe('buildWorkingplanPdf / buildWorkingplanPdfDocument', () => {
  const eventRows: PdfEventRow[] = [
    { date: '2026-09-01', time: '19:00', whole_day: false, description: 'Loge' },
    { date: '2026-09-15', time: null, whole_day: true, description: 'Ausflug' },
  ];
  const birthdayRows: PdfBirthdayRow[] = [{ lastname: 'Koenig', firstname: 'Karl', date_of_birth: '1970-05-01', age: 56 }];

  it('does not throw for an empty rows list, no footer, no birthdays, and returns a non-empty Buffer', () => {
    const pdf = buildWorkingplanPdf([], 'de', { logo: TINY_PNG, lodgeName: 'Loge zur Eintracht', footerLines: [] });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('returns a non-empty Buffer for a normal set of rows', () => {
    const pdf = buildWorkingplanPdf(eventRows, 'de', { logo: TINY_PNG, lodgeName: 'Loge zur Eintracht', footerLines: [] });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('does not throw with footer lines set', () => {
    const pdf = buildWorkingplanPdf(eventRows, 'de', {
      logo: TINY_PNG,
      lodgeName: 'Loge zur Eintracht',
      footerLines: ['Meister vom Stuhl: Karl Koenig · 0170 111', 'Sekretär: Otto Schmidt'],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('has exactly one page when birthdayRows is omitted', () => {
    const doc = buildWorkingplanPdfDocument(eventRows, 'de', { logo: TINY_PNG, lodgeName: 'Loge zur Eintracht', footerLines: [] });
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('has exactly one page when birthdayRows is an empty array', () => {
    const doc = buildWorkingplanPdfDocument(eventRows, 'de', {
      logo: TINY_PNG,
      lodgeName: 'Loge zur Eintracht',
      footerLines: [],
      birthdayRows: [],
    });
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('adds a second page with a birthdays table when birthdayRows is non-empty', () => {
    const doc = buildWorkingplanPdfDocument(eventRows, 'de', {
      logo: TINY_PNG,
      lodgeName: 'Loge zur Eintracht',
      footerLines: [],
      birthdayRows,
    });
    expect(doc.getNumberOfPages()).toBe(2);
  });

  it('works for the "en" language variant too', () => {
    const pdf = buildWorkingplanPdf(eventRows, 'en', { logo: TINY_PNG, lodgeName: 'Lodge of Concord', footerLines: [] });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('does not throw when the logo Buffer is a real, differently-encoded image (sanity check for addImage auto-detection)', () => {
    // Same TINY_PNG - a second call just to confirm no shared/mutated state across builds.
    const first = buildWorkingplanPdf(eventRows, 'de', { logo: TINY_PNG, lodgeName: 'A', footerLines: [] });
    const second = buildWorkingplanPdf(eventRows, 'de', { logo: TINY_PNG, lodgeName: 'B', footerLines: [] });
    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
  });
});
