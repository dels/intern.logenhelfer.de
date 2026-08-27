import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { prisma } from '../db.js';
import { getBoolean } from './appConfig.js';
import { isPresent } from './userMobile.js';

/**
 * Shared, pure(-ish) working-plan PDF builder + footer-content resolution -
 * moved out of `routes/public.ts` (which owned it alone until now) so both
 * the public `GET /api/v1/public/workingplan.pdf` route and the new
 * authenticated internal `GET /api/v1/events/workingplan.pdf` route (Tasks 7
 * and 8) can share one implementation instead of forking it. `buildWorkingplanPdf`
 * itself takes fully-resolved data (logo bytes, lodge name, footer lines,
 * optional birthday rows) and does no DB access, so it stays unit-testable
 * without a DB; `resolveFooterLines` is the async piece that does the
 * officer/config lookups, kept separate on purpose.
 */

export interface PdfEventRow {
  date: string;
  time: string | null;
  whole_day: boolean | null;
  description: string | null;
}

export interface PdfBirthdayRow {
  lastname: string;
  firstname: string;
  date_of_birth: string;
  age: number | string;
}

export interface WorkingplanPdfOptions {
  logo: Buffer;
  lodgeName: string;
  /** 0-2 lines; empty means no footer is drawn at all. */
  footerLines: string[];
  /** Present only for the internal PDF's second page - omitted/empty means no second page. */
  birthdayRows?: PdfBirthdayRow[];
}

interface PdfLabels {
  locale: string;
  weekday: string;
  date: string;
  time: string;
  description: string;
  allDay: string;
}

/** Static (non-user-authored) PDF chrome in both supported languages — the row content itself (title/description) is admin/member-authored and not translated. */
const PDF_LABELS: Record<string, PdfLabels> = {
  de: { locale: 'de-DE', weekday: 'Wochentag', date: 'Datum', time: 'Uhrzeit', description: 'Beschreibung', allDay: 'ganztags' },
  en: { locale: 'en-US', weekday: 'Weekday', date: 'Date', time: 'Time', description: 'Description', allDay: 'all day' },
};

/** Exported standalone so its selection logic is unit-testable without rendering a full PDF (jsPDF's output isn't practically assertable in a unit test). */
export function pdfLabelsFor(language: string): PdfLabels {
  return PDF_LABELS[language] ?? PDF_LABELS.de!;
}

function pdfMonthLabel(dateStr: string, labels: PdfLabels): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(labels.locale, { month: 'long', year: 'numeric' });
}

const TABLE_STYLES = { fontSize: 9 } as const;
const TABLE_HEAD_STYLES = { fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold' as const, lineWidth: 0.5 };
const TABLE_ALTERNATE_ROW_STYLES = { fillColor: [221, 221, 221] as [number, number, number] };

const HEADER_TOP_MARGIN_MM = 26;
const LOGO_SIZE_MM = 14;
const PAGE_SIDE_MARGIN_MM = 14;
const FOOTER_LINE_HEIGHT_MM = 4;

function drawHeader(doc: jsPDF, logo: Buffer, lodgeName: string): void {
  // jsPDF's addImage auto-detects the image filetype from the buffer's own
  // binary magic bytes (no `format` argument needed) - see this module's
  // own test fixture comment for why any real image works here.
  doc.addImage(logo, PAGE_SIDE_MARGIN_MM, 8, LOGO_SIZE_MM, LOGO_SIZE_MM);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(lodgeName, PAGE_SIDE_MARGIN_MM + LOGO_SIZE_MM + 4, 8 + LOGO_SIZE_MM / 2 + 2);
}

function drawFooter(doc: jsPDF, footerLines: string[]): void {
  if (footerLines.length === 0) {
    return;
  }
  const pageHeight = doc.internal.pageSize.getHeight();
  const startY = pageHeight - (footerLines.length - 1) * FOOTER_LINE_HEIGHT_MM - 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  footerLines.forEach((line, index) => {
    doc.text(line, PAGE_SIDE_MARGIN_MM, startY + index * FOOTER_LINE_HEIGHT_MM);
  });
}

function drawPageChrome(doc: jsPDF, options: WorkingplanPdfOptions): () => void {
  return () => {
    drawHeader(doc, options.logo, options.lodgeName);
    drawFooter(doc, options.footerLines);
  };
}

/**
 * Builds the working-plan jsPDF document itself (not yet serialized to
 * bytes) - exported alongside `buildWorkingplanPdf` purely so tests can
 * assert on structural properties via jsPDF's own API (e.g.
 * `getNumberOfPages()`) without parsing PDF bytes, which this codebase's
 * existing PDF tests have never attempted (jsPDF's binary output isn't
 * practically assertable). Nothing outside tests needs the raw document -
 * every real caller wants `buildWorkingplanPdf`'s `Buffer`.
 */
export function buildWorkingplanPdfDocument(rows: PdfEventRow[], language: string, options: WorkingplanPdfOptions): jsPDF {
  const labels = pdfLabelsFor(language);
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  let lastMonth = '';
  let lastDate = '';
  const body: string[][] = [];
  for (const row of rows) {
    const month = pdfMonthLabel(row.date, labels);
    if (month !== lastMonth) {
      body.push([`— ${month} —`, '', '', '']);
      lastMonth = month;
      lastDate = '';
    }
    const weekday = new Date(`${row.date}T00:00:00`).toLocaleDateString(labels.locale, { weekday: 'long' });
    const dateCell = row.date === lastDate ? '' : new Date(`${row.date}T00:00:00`).toLocaleDateString(labels.locale);
    lastDate = row.date;
    const timeCell = row.whole_day ? labels.allDay : (row.time ?? '');
    body.push([weekday, dateCell, timeCell, row.description ?? '']);
  }

  autoTable(doc, {
    head: [[labels.weekday, labels.date, labels.time, labels.description]],
    body,
    styles: TABLE_STYLES,
    headStyles: TABLE_HEAD_STYLES,
    alternateRowStyles: TABLE_ALTERNATE_ROW_STYLES,
    startY: HEADER_TOP_MARGIN_MM,
    margin: { top: HEADER_TOP_MARGIN_MM, bottom: options.footerLines.length > 0 ? 20 : 10 },
    didDrawPage: drawPageChrome(doc, options),
  });

  if (options.birthdayRows && options.birthdayRows.length > 0) {
    doc.addPage();
    autoTable(doc, {
      head: [['Nachname', 'Vorname', 'Geburtstag', 'Alter']],
      body: options.birthdayRows.map((row) => [
        row.lastname,
        row.firstname,
        new Date(`${row.date_of_birth}T00:00:00`).toLocaleDateString(labels.locale),
        String(row.age),
      ]),
      styles: TABLE_STYLES,
      headStyles: TABLE_HEAD_STYLES,
      alternateRowStyles: TABLE_ALTERNATE_ROW_STYLES,
      startY: HEADER_TOP_MARGIN_MM,
      margin: { top: HEADER_TOP_MARGIN_MM, bottom: options.footerLines.length > 0 ? 20 : 10 },
      didDrawPage: drawPageChrome(doc, options),
    });
  }

  return doc;
}

/** Server-side port of app/src/features/public-calendar/api.ts's downloadPublicWorkingplanPdf, so /arbeitsplan.pdf can be a stable, linkable URL instead of a client-side-only blob download. */
export function buildWorkingplanPdf(rows: PdfEventRow[], language: string, options: WorkingplanPdfOptions): Buffer {
  const doc = buildWorkingplanPdfDocument(rows, language, options);
  return Buffer.from(doc.output('arraybuffer'));
}

export type FooterPdfType = 'public' | 'internal';

const FOOTER_ROLE_ORDER = ['WorshipfulMaster', 'Secretary'] as const;

/**
 * Resolves the 0-2 footer lines for a working-plan PDF.
 *
 * When both `<pdfType>_wp_footer_show_secretary` and
 * `<pdfType>_wp_footer_show_worshipful_master` are off, falls back to the
 * Secretary role's static `email` (or no footer at all if that's unset) -
 * this mirrors the pre-existing behavior of always being able to reach the
 * lodge via the Secretary, even with no per-officer footer configured.
 * Otherwise, for each of WorshipfulMaster/Secretary (in that order) whose
 * toggle is on, resolves the role's first non-deleted holder
 * (`prisma.roles.findFirst` -> `prisma.user_roles.findMany` ->
 * `prisma.users.findFirst`, mirroring `members_of_council`'s loop in
 * `routes/members.ts`, but stopping at the first match) and pushes
 * `"<display_name>: <firstname> <lastname>"`, plus `" · <mobile>"` when the
 * holder has one. A role with no configured row, or with zero non-deleted
 * holders, contributes nothing (not an error).
 */
export async function resolveFooterLines(pdfType: FooterPdfType): Promise<string[]> {
  const showSecretary = await getBoolean(`${pdfType}_wp_footer_show_secretary`);
  const showWorshipfulMaster = await getBoolean(`${pdfType}_wp_footer_show_worshipful_master`);

  if (!showSecretary && !showWorshipfulMaster) {
    const role = await prisma.roles.findFirst({ where: { name: 'Secretary' } });
    return role?.email ? [role.email] : [];
  }

  const toggles: Record<(typeof FOOTER_ROLE_ORDER)[number], boolean> = {
    WorshipfulMaster: showWorshipfulMaster,
    Secretary: showSecretary,
  };

  const lines: string[] = [];
  for (const roleName of FOOTER_ROLE_ORDER) {
    if (!toggles[roleName]) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop -- at most two roles; each needs its own holder lookup.
    const role = await prisma.roles.findFirst({ where: { name: roleName } });
    if (!role) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop -- see above.
    const holderRoles = await prisma.user_roles.findMany({ where: { role_id: role.id }, orderBy: { id: 'asc' } });

    let holder: { firstname: string | null; lastname: string | null; mobile: string | null } | null = null;
    for (const holderRole of holderRoles) {
      if (!holderRole.user_id) continue;
      // eslint-disable-next-line no-await-in-loop -- one role can have several holders; stop at the first non-deleted one.
      const candidate = await prisma.users.findFirst({ where: { id: holderRole.user_id, deleted: false } });
      if (candidate) {
        holder = candidate;
        break;
      }
    }
    if (!holder) {
      continue;
    }

    // `role.display_name ?? ''` mirrors the same null-guard `members_of_council`
    // already applies to this nullable column (routes/members.ts's `role_display_name`).
    const holderName = [holder.firstname, holder.lastname].filter((v): v is string => isPresent(v)).join(' ');
    let line = holderName ? `${role.display_name ?? ''}: ${holderName}` : role.display_name ?? '';
    if (isPresent(holder.mobile)) {
      line += ` · ${holder.mobile}`;
    }
    lines.push(line);
  }

  return lines;
}
