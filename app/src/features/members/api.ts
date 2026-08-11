import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import { formatDate } from '../../utils/formatDate';
import type {
  Member, MemberInput, MemberList, PhoneList, PhoneListRow, BirthdayList, BirthdayListRow, CouncilList, CsvExportRow, CsvExportData,
  ExportRow, ExportData, NextMatriculationNumber,
} from '../../api/types';

export function useMembers(page: number, pageSize: number, sort: string, search: string) {
  return useQuery({
    queryKey: ['members', page, pageSize, sort, search],
    queryFn: () =>
      apiFetch<MemberList>(
        `/api/v1/members?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}&search=${encodeURIComponent(search)}`,
      ),
    // Without this, `data`/`row_count` collapse to undefined/0 while a new
    // page is in flight, and DataGrid's own row-count self-correction snaps
    // the page back to 0 mid-fetch - the first "next page" click appeared
    // to do nothing (only a second click "stuck").
    placeholderData: keepPreviousData,
  });
}

export function useMember(uuid: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['members', uuid],
    queryFn: () => apiFetch<Member>(`/api/v1/members/${uuid}`),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: MemberInput) => apiFetch<Member>('/api/v1/members', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useNextMatriculationNumber() {
  return useQuery({
    queryKey: ['members', 'next-matriculation-number'],
    queryFn: () => apiFetch<NextMatriculationNumber>('/api/v1/members/next_matriculation_number'),
  });
}

export function useUpdateMember(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: MemberInput) => apiFetch<Member>(`/api/v1/members/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/members/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useResetMemberMfa() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/members/${uuid}/mfa/reset`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('members.mfaResetSuccess'));
    },
  });
}

export function usePhoneList(page: number, pageSize: number, sort = 'lastname') {
  return useQuery({
    queryKey: ['members', 'phone-list', page, pageSize, sort],
    queryFn: () => apiFetch<PhoneList>(`/api/v1/members/phone_list?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useBirthdayList(page: number, pageSize: number, sort = 'date_of_birth') {
  return useQuery({
    queryKey: ['members', 'birthday-list', page, pageSize, sort],
    queryFn: () => apiFetch<BirthdayList>(`/api/v1/members/birthday_list?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}`),
  });
}

export function useCouncilList() {
  return useQuery({
    queryKey: ['members', 'council-list'],
    queryFn: () => apiFetch<CouncilList>('/api/v1/members/members_of_council'),
  });
}

async function fetchAllCsvExportRows(): Promise<CsvExportRow[]> {
  const rows: CsvExportRow[] = [];
  let page = 0;
  const perPage = 100;
  for (;;) {
    const data = await apiFetch<CsvExportData>(`/api/v1/members/csv_export_data?page=${page}&per_page=${perPage}`);
    rows.push(...data.rows);
    if (rows.length >= data.row_count || data.rows.length === 0) break;
    page += 1;
  }
  return rows;
}

function triggerDownload(content: BlobPart, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function csvLine(row: CsvExportRow): string {
  const priv = row.addresses.find((a) => a.type_of_address === 0);
  const bsns = row.addresses.find((a) => a.type_of_address === 1);
  return [
    `${row.lastname ?? ''}`, `; ${row.firstname ?? ''}`, `;${row.email ?? ''}`, '; ',
    priv?.street1 ?? '', '; ', priv?.street2 ?? '', '; ', priv?.street3 ?? '', '; ', priv?.zip ?? '', '; ', priv?.city ?? '', ';', priv?.email ?? '', ';',
    bsns?.street1 ?? '', '; ', bsns?.street2 ?? '', '; ', bsns?.street3 ?? '', '; ', bsns?.zip ?? '', '; ', bsns?.city ?? '', '; ', bsns?.email ?? '', ';\n',
  ].join('');
}

export function vcardFor(row: CsvExportRow): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'CLASS:CONFIDENTIAL', 'CHARSET=utf-8'];
  lines.push(`N:${row.lastname ?? ''}; ${row.firstname ?? ''}`);
  lines.push(`FN:${row.fullname}`);
  if (row.date_of_birth) lines.push(`BDAY:${row.date_of_birth}`);
  for (const addr of row.addresses) {
    if (addr.phone) lines.push(`TEL;TYPE=voice,${addr.vcf_type}:${addr.phone}`);
    if (addr.mobile) lines.push(`TEL;TYPE=voice,cell,${addr.vcf_type}:${addr.mobile}`);
    if (addr.fax) lines.push(`TEL;TYPE=fax,${addr.vcf_type}:${addr.fax}`);
    if (addr.street) lines.push(`ADR;TYPE=postal,parcel,${addr.vcf_type}:;;${addr.street};${addr.city ?? ''};;${addr.zip ?? ''};`);
    if (addr.remarks) lines.push(`NOTE:${addr.remarks}`);
  }
  lines.push('EMAIL;TYPE=INTERNET:' + (row.email ?? ''));
  lines.push('END:VCARD');
  return `${lines.join('\n')}\n`;
}

export async function downloadMembersCsv() {
  const rows = await fetchAllCsvExportRows();
  triggerDownload(rows.map(csvLine).join(''), 'text/csv', `${new Date().toISOString().slice(0, 10)}-Mitglieder.csv`);
}

export async function downloadMembersVcf() {
  const rows = await fetchAllCsvExportRows();
  triggerDownload(rows.map(vcardFor).join(''), 'text/x-vcard', `${new Date().toISOString().slice(0, 10)}-Mitglieder.vcf`);
}

async function buildPdf(headers: string[], rows: (string | number | null)[][]): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map((cell) => (cell ?? '').toString())),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [221, 221, 221] },
  });
  return doc.output('blob');
}

async function fetchAllPhoneListRows(): Promise<PhoneListRow[]> {
  const rows: PhoneListRow[] = [];
  let page = 0;
  const perPage = 100;
  for (;;) {
    const data = await apiFetch<PhoneList>(`/api/v1/members/phone_list?page=${page}&per_page=${perPage}`);
    rows.push(...data.rows);
    if (rows.length >= data.row_count || data.rows.length === 0) break;
    page += 1;
  }
  return rows;
}

async function fetchAllBirthdayListRows(): Promise<BirthdayListRow[]> {
  const rows: BirthdayListRow[] = [];
  let page = 0;
  const perPage = 100;
  for (;;) {
    const data = await apiFetch<BirthdayList>(`/api/v1/members/birthday_list?page=${page}&per_page=${perPage}`);
    rows.push(...data.rows);
    if (rows.length >= data.row_count || data.rows.length === 0) break;
    page += 1;
  }
  return rows;
}

// Correction (verified against apiFetch): the body must be real JSON, not
// URLSearchParams. apiFetch always sets Content-Type: application/json
// unless init.body is a FormData instance, so a URLSearchParams body would
// be sent as a form-urlencoded string under a JSON content-type header -
// Rails would fail to parse `params[:kind]` correctly. This also matches
// Task 2's OpenAPI documentation of this endpoint's requestBody as
// application/json.
async function recordExport(kind: 'members_list' | 'birthday_list' | 'phone_list') {
  await apiFetch<void>('/api/v1/members/record_export', { method: 'POST', body: JSON.stringify({ kind }) });
}

// Distinguishes "the PDF downloaded fine but the audit-log call failed"
// from any earlier failure (fetch/build/encrypt), so the UI can show an
// accurate message rather than implying the download itself failed. Only
// downloadMembersListPdf (the compliance-sensitive, encrypted
// member-directory export) throws this - phone/birthday list PDFs and the
// CSV/vCard exports keep their existing fire-and-forget recordExport
// pattern, out of scope for this fix.
export class RecordExportFailedError extends Error {
  constructor() {
    super('record_export failed after a successful download');
    this.name = 'RecordExportFailedError';
  }
}

// PhoneListRow/BirthdayListRow (already-shipped JSON shapes) do not include
// academic_title, unlike the legacy phone_list PDF's first column. Rather
// than adding a field to those existing, already-reviewed endpoints, the
// title column is left blank here - a deliberate, minor omission (see task
// report).
export async function downloadPhoneListPdf() {
  const rows = await fetchAllPhoneListRows();
  const blob = await buildPdf(
    ['Titel', 'Name', 'Telefon', 'Fax', 'Mobil'],
    rows.map((r) => ['', `${r.lastname}, ${r.firstname}`, r.phone, r.fax, r.mobile]),
  );
  triggerDownload(blob, 'application/pdf', `${new Date().toISOString().slice(0, 10)}-Telefonliste.pdf`);
  await recordExport('phone_list');
}

async function fetchAllExportRows(): Promise<ExportRow[]> {
  const rows: ExportRow[] = [];
  let page = 0;
  const perPage = 100;
  for (;;) {
    const data = await apiFetch<ExportData>(`/api/v1/members/export_data?page=${page}&per_page=${perPage}`);
    rows.push(...data.rows);
    if (rows.length >= data.row_count || data.rows.length === 0) break;
    page += 1;
  }
  return rows;
}

export function addressBlock(addr: ExportRow['business_address']): string {
  if (!addr) return '-';
  const lines: string[] = [addr.street];
  if (addr.zip || addr.city) lines.push(`${addr.zip ?? ''} ${addr.city ?? ''}`.trim());
  if (addr.phone) lines.push(`Tel: ${addr.phone}`);
  if (addr.mobile) lines.push(`Mobil: ${addr.mobile}`);
  if (addr.fax) lines.push(`Fax: ${addr.fax}`);
  if (addr.email) lines.push(`E-Mail: ${addr.email}`);
  return lines.join('\n');
}

// Owner password: deliberately a random value, NOT the same as the user
// password (unlike a first-draft reading of the reference implementation,
// which passed the user password for both). This matches the legacy Prawn
// behavior (`owner_password: :random`) - the exporting member choosing the
// user/open password should not also determine the owner/permissions
// password. Verified empirically (see task report) that
// @pdfsmaller/pdf-encrypt-lite's encryptPDF() hardcodes the /P permissions
// entry to "all allowed" (0xFFFFFFFC) regardless of what's passed as
// ownerPassword, so this library cannot actually enforce print/copy/edit
// restrictions the way legacy Prawn did either way - but using a random,
// unguessable owner password still avoids the strictly-worse posture of a
// user-guessable owner secret, and costs nothing to do correctly.
export async function downloadMembersListPdf(password: string) {
  const rows = await fetchAllExportRows();
  const blob = await buildPdf(
    ['MNr.', 'Name', 'Beruf', 'Grad', 'Aufg. am', 'Ang. am', 'Geburtstag', 'beruflich', 'privat', 'Ämter'],
    rows.map((r) => [
      r.matriculation_number, r.fullname_with_title, r.job_title, r.num_degree,
      formatDate(r.entered_apprentice_since, 'de-DE'), formatDate(r.accepted_at, 'de-DE') || '-', formatDate(r.date_of_birth, 'de-DE'),
      addressBlock(r.business_address), addressBlock(r.private_address),
      r.positions.join('\n'),
    ]),
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
  const encrypted = await encryptPDF(bytes, password, crypto.randomUUID());
  // encryptPDF's return type is typed against `ArrayBufferLike` (which
  // includes SharedArrayBuffer), not the `ArrayBuffer` that BlobPart
  // requires - copy into a plain ArrayBuffer-backed Uint8Array to satisfy
  // triggerDownload's type without weakening it for the other call sites.
  triggerDownload(new Uint8Array(encrypted), 'application/pdf', `${new Date().toISOString().slice(0, 10)}-Mitgliederverzeichnis.pdf`);
  try {
    await recordExport('members_list');
  } catch {
    // The file already downloaded above - only the audit-log call failed.
    // Rethrow as a distinct error so the caller can show a message that
    // doesn't imply the download itself failed (see RecordExportFailedError).
    throw new RecordExportFailedError();
  }
}

export async function downloadBirthdayListPdf() {
  const rows = await fetchAllBirthdayListRows();
  const blob = await buildPdf(
    ['Titel', 'Nachname', 'Vorname', 'Geburtstag', '25. Jubiläum', '40. Jubiläum'],
    rows.map((r) => ['', r.lastname, r.firstname, formatDate(r.date_of_birth, 'de-DE'), formatDate(r.twentyfifth_jubilee, 'de-DE'), formatDate(r.fortieth_jubilee, 'de-DE')]),
  );
  triggerDownload(blob, 'application/pdf', `${new Date().toISOString().slice(0, 10)}-Geburtstagsliste.pdf`);
  await recordExport('birthday_list');
}
