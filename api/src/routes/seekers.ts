import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import type { addresses, seekers } from '../generated/prisma/client.js';

import { authenticateApiUser } from '../auth/middleware.js';
import type { AppAbility } from '../authz/ability.js';
import { prisma } from '../db.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';

/**
 * Port of rails-app/app/controllers/api/v1/seekers_controller.rb.
 *
 * Mounted (by a later integration step) at /api/v1/seekers. Applies its own
 * auth middleware rather than relying on global wiring - see the task's file
 * boundary note.
 */
export const seekersRouter = Router();

seekersRouter.use(authenticateApiUser);

// ---------------------------------------------------------------------------
// Constants ported 1:1 from rails-app/app/models/seeker.rb / address.rb and
// rails-app/app/controllers/api/v1/seekers_controller.rb.
// ---------------------------------------------------------------------------

const ADDRESSABLE_TYPE = 'Seeker';

const STATUS = {
  contacted: 0,
  visiting: 10,
  application_expected: 20,
  application_received: 30,
  ballotage_scheduled: 40,
  ready_for_admission: 50,
  admission_scheduled: 60,
  accepted: 100,
  declined: 1000,
} as const;

// Port of I18n's activerecord.seeker.status.* (rails-app/config/locales/de.yml).
const STATUS_LABEL: Record<number, string> = {
  [STATUS.contacted]: 'Neu',
  [STATUS.visiting]: 'Besuchend',
  [STATUS.application_expected]: 'Aufnahmeantrag erwartet',
  [STATUS.application_received]: 'Aufnahmeantrag vorliegend',
  [STATUS.ballotage_scheduled]: 'Kugelung terminiert',
  [STATUS.ready_for_admission]: 'Bereit für die Aufnahme',
  [STATUS.admission_scheduled]: 'Aufnahme terminiert',
  [STATUS.accepted]: 'Aufgenommen',
  [STATUS.declined]: 'Zurückgestellt/Abgelehnt',
};

const WAY_OF_CONTACT = {
  email: 10,
  phone: 20,
  fax: 30,
  mobile: 40,
  mail: 50,
  see_remarks: 100,
} as const;

// Port of I18n's activerecord.seeker.error.* (rails-app/config/locales/de.yml),
// keyed by the same WAY_OF_CONTACT values as Seeker#way_of_contact_validation.
const WAY_OF_CONTACT_ERROR: Record<number, string> = {
  [WAY_OF_CONTACT.email]: 'E-Mail angegeben, aber E-Mail nicht eingetragen.',
  [WAY_OF_CONTACT.phone]: 'Telefon, aber kein Telefon angegeben.',
  [WAY_OF_CONTACT.fax]: 'Fax, aber kein Fax angegeben.',
  [WAY_OF_CONTACT.mobile]: 'Mobiltelefon, aber kein Mobiltelefon angegeben.',
  [WAY_OF_CONTACT.mail]: 'Post, aber keine Adresse angegeben.',
  [WAY_OF_CONTACT.see_remarks]: 'Notizen angegeben aber keine Notizen vorhanden.',
};

const SORTABLE_COLUMNS = ['firstname', 'lastname', 'source', 'status', 'updated_at'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT: SortableColumn = 'lastname';

/**
 * `contact_value` isn't a real `seekers` column - it's derived from the
 * seeker's `preferred_way_of_contact` plus a joined `addresses` row (see
 * `contactValueFor` below), so a DB-level `orderBy` can't reach it. Like
 * statistics.ts's `downloads`/`file_stats` reports, sorting by it means
 * fetching every matching seeker (+ addresses), sorting/paginating in JS,
 * instead of pushing pagination down to Prisma.
 */
function isContactValueSort(raw: unknown): boolean {
  const value = typeof raw === 'string' ? raw : '';
  return (value.startsWith('-') ? value.slice(1) : value) === 'contact_value';
}

function contactValueComparator(raw: unknown): (a: { contact_value: string | null }, b: { contact_value: string | null }) => number {
  const desc = typeof raw === 'string' && raw.startsWith('-');
  return (a, b) => {
    const av = a.contact_value;
    const bv = b.contact_value;
    let cmp: number;
    if (av === null) cmp = bv === null ? 0 : 1;
    else if (bv === null) cmp = -1;
    else cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  };
}

// Port of Address::RE_DIAL_NUMBER (rails-app/app/models/address.rb).
const RE_DIAL_NUMBER = /^\+\d{1,4}\s\([^0]\d{1,5}\)\s[\d\s]*-?\s?\d+$/;

// German attribute labels, ported from rails-app/config/locales/de.yml's
// activerecord.attributes.seeker / activerecord.attributes.address, used to
// build the same "<Label> <message>" full_messages Rails' errors.full_messages
// produces (format: '%{attribute} %{message}').
const SEEKER_LABELS = {
  firstname: 'Vorname',
  lastname: 'Nachname',
  source: 'Quelle',
  status: 'Status',
  preferred_way_of_contact: 'Kontaktieren über',
} as const;

const ADDRESS_LABELS = {
  purpose: 'Art',
  type_of_address: 'Zweck',
  phone: 'Telefon',
  fax: 'Fax',
  mobile: 'Mobil',
} as const;

const BLANK = 'muss ausgefüllt werden';
const NOT_A_NUMBER = 'ist keine Zahl';
const INVALID = 'ist nicht gültig';

// ---------------------------------------------------------------------------
// Request-shape types (mirrors seeker_params' whitelist in the Rails
// controller - only these keys are ever read off the request body).
// ---------------------------------------------------------------------------

interface SeekerInputFields {
  firstname?: string | null;
  lastname?: string | null;
  source?: string | null;
  invite?: boolean | null;
  status?: number | null;
  preferred_way_of_contact?: number | null;
  notes?: string | null;
}

interface AddressInputFields {
  type_of_address?: number | null;
  purpose?: string | null;
  street1?: string | null;
  street2?: string | null;
  street3?: string | null;
  zip?: string | null;
  city?: string | null;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;
  remarks?: string | null;
}

const SEEKER_FIELD_KEYS: readonly (keyof SeekerInputFields)[] = [
  'firstname',
  'lastname',
  'source',
  'invite',
  'status',
  'preferred_way_of_contact',
  'notes',
];

const ADDRESS_FIELD_KEYS: readonly (keyof AddressInputFields)[] = [
  'type_of_address',
  'purpose',
  'street1',
  'street2',
  'street3',
  'zip',
  'city',
  'phone',
  'fax',
  'mobile',
  'email',
  'remarks',
];

/**
 * Picks only the whitelisted keys that were *actually present* in the raw
 * body (own-property check, not just !== undefined) - this is what lets a
 * PATCH merge (`{ ...current, ...extracted }`) behave like Rails'
 * `assign_attributes`: an omitted key leaves the current value alone, while
 * an explicit `null` overwrites it.
 */
function extractFields<T>(body: unknown, keys: readonly (keyof T)[]): Partial<T> {
  if (typeof body !== 'object' || body === null) {
    return {};
  }
  const result: Partial<T> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      result[key] = (body as Record<string, unknown>)[key as string] as T[typeof key];
    }
  }
  return result;
}

/** Rails' `all_blank?` for reject_if - nil/'' are blank, 0/false are not. */
function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function isBlankAddress(address: Partial<AddressInputFields>): boolean {
  return ADDRESS_FIELD_KEYS.every((key) => isBlank(address[key]));
}

function currentSeekerFields(seeker: seekers): SeekerInputFields {
  return {
    firstname: seeker.firstname,
    lastname: seeker.lastname,
    source: seeker.source,
    invite: seeker.invite,
    status: seeker.status,
    preferred_way_of_contact: seeker.preferred_way_of_contact,
    notes: seeker.notes,
  };
}

function currentAddressFields(address: addresses | null): AddressInputFields {
  if (!address) {
    return {};
  }
  return {
    type_of_address: address.type_of_address,
    purpose: address.purpose,
    street1: address.street1,
    street2: address.street2,
    street3: address.street3,
    zip: address.zip,
    city: address.city,
    phone: address.phone,
    fax: address.fax,
    mobile: address.mobile,
    email: address.email,
    remarks: address.remarks,
  };
}

// ---------------------------------------------------------------------------
// Validation, ported from Seeker's presence/way_of_contact_validation and
// Address's presence/numericality/format validations. Rails only re-validates
// the nested Address when accepts_nested_attributes_for actually assigned it
// (i.e. an `address` key was sent and wasn't all-blank) - `validateAddressFields`
// threads that same condition through.
// ---------------------------------------------------------------------------

function wayOfContactSatisfied(wayOfContact: number, address: AddressInputFields): boolean {
  switch (wayOfContact) {
    case WAY_OF_CONTACT.email:
      return !isBlank(address.email);
    case WAY_OF_CONTACT.phone:
      return !isBlank(address.phone);
    case WAY_OF_CONTACT.fax:
      return !isBlank(address.fax);
    case WAY_OF_CONTACT.mobile:
      return !isBlank(address.mobile);
    case WAY_OF_CONTACT.mail:
      return addressFieldsToString(address) !== '';
    case WAY_OF_CONTACT.see_remarks:
      return !isBlank(address.remarks);
    default:
      return true;
  }
}

function addressFieldsToString(address: AddressInputFields): string {
  const street = [address.street1, address.street2, address.street3]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join('\n')
    .trim();
  if (street === '') {
    return '';
  }
  return [street, `${address.zip ?? ''} ${address.city ?? ''}`].join(', ');
}

interface ValidationInput {
  seeker: SeekerInputFields;
  address: AddressInputFields;
  validateAddressFields: boolean;
}

/**
 * Returns Rails-style full_messages ("<Label> <message>") for every failed
 * validation, or [] if valid. Port of Seeker's validates_presence_of +
 * way_of_contact_validation, plus Address's own presence/numericality/format
 * validations (only run when validateAddressFields is true - see the
 * has_one_address module-doc comment above).
 */
function validateSeeker({ seeker, address, validateAddressFields }: ValidationInput): string[] {
  const errors: string[] = [];

  if (isBlank(seeker.firstname)) errors.push(`${SEEKER_LABELS.firstname} ${BLANK}`);
  if (isBlank(seeker.lastname)) errors.push(`${SEEKER_LABELS.lastname} ${BLANK}`);
  if (isBlank(seeker.source)) errors.push(`${SEEKER_LABELS.source} ${BLANK}`);
  if (seeker.status === null || seeker.status === undefined) errors.push(`${SEEKER_LABELS.status} ${BLANK}`);

  if (validateAddressFields) {
    if (isBlank(address.purpose)) errors.push(`${ADDRESS_LABELS.purpose} ${BLANK}`);

    // NOTE: Address#validates_numericality_of :type_of_address in the Rails
    // source passes `:greater_or_equal => 0, :less_or_equal => 3` - neither
    // key matches ActiveModel::Validations::NumericalityValidator's real
    // range options (`greater_than_or_equal_to`/`less_than_or_equal_to`), and
    // ActiveModel doesn't raise on an unrecognized validator option, so this
    // is a dead/no-op range check in the actual running app: only "must be a
    // number" is ever enforced, 0-3 never is. Flagged as a likely bug in the
    // Rails source (see this port's task report) - replicated as-is (numeric
    // check only, no range) rather than "fixing" behavior a drop-in
    // replacement must match exactly.
    if (address.type_of_address === null || address.type_of_address === undefined) {
      errors.push(`${ADDRESS_LABELS.type_of_address} ${BLANK}`);
      errors.push(`${ADDRESS_LABELS.type_of_address} ${NOT_A_NUMBER}`);
    } else if (!Number.isFinite(address.type_of_address)) {
      errors.push(`${ADDRESS_LABELS.type_of_address} ${NOT_A_NUMBER}`);
    }

    for (const field of ['phone', 'fax', 'mobile'] as const) {
      const value = address[field];
      if (!isBlank(value) && typeof value === 'string' && !RE_DIAL_NUMBER.test(value)) {
        errors.push(`${ADDRESS_LABELS[field]} ${INVALID}`);
      }
    }
  }

  if (seeker.preferred_way_of_contact !== null && seeker.preferred_way_of_contact !== undefined) {
    const message = WAY_OF_CONTACT_ERROR[seeker.preferred_way_of_contact];
    if (message && !wayOfContactSatisfied(seeker.preferred_way_of_contact, address)) {
      errors.push(`${SEEKER_LABELS.preferred_way_of_contact} ${message}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// JSON shaping, ported from seeker_summary_json/seeker_json/address_json/
// contact_value_for/address_json in the Rails controller.
// ---------------------------------------------------------------------------

/**
 * Port of Address#purpose - for type_of_address private(0)/business(1), the
 * getter overrides the stored column value with the translated label; only
 * other(2) or a blank type_of_address returns the raw stored value.
 */
function addressPurpose(address: addresses): string | null {
  if (address.type_of_address === 0) return 'Privat';
  if (address.type_of_address === 1) return 'Geschäftlich';
  return address.purpose;
}

function addressStreet(address: addresses): string {
  return [address.street1, address.street2, address.street3]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join('\n')
    .trim();
}

function addressJson(address: addresses): Record<string, unknown> {
  return {
    id: address.id,
    type_of_address: address.type_of_address,
    purpose: addressPurpose(address),
    street: addressStreet(address),
    zip: address.zip,
    city: address.city,
    phone: address.phone,
    fax: address.fax,
    mobile: address.mobile,
    email: address.email,
  };
}

function contactValueFor(seeker: seekers, address: addresses | undefined): string | null {
  if (seeker.preferred_way_of_contact === null || seeker.preferred_way_of_contact === undefined) {
    return null;
  }
  if (!address) {
    return null;
  }
  switch (seeker.preferred_way_of_contact) {
    case WAY_OF_CONTACT.email:
      return address.email ?? null;
    case WAY_OF_CONTACT.phone:
      return address.phone ?? null;
    case WAY_OF_CONTACT.fax:
      return address.fax ?? null;
    case WAY_OF_CONTACT.mobile:
      return address.mobile ?? null;
    case WAY_OF_CONTACT.mail: {
      const value = addressFieldsToString(currentAddressFields(address));
      return value === '' ? null : value;
    }
    case WAY_OF_CONTACT.see_remarks:
      return address.remarks ?? null;
    default:
      return null;
  }
}

function seekerSummaryJson(seeker: seekers, address: addresses | undefined): Record<string, unknown> {
  return {
    uuid: seeker.uuid,
    firstname: seeker.firstname,
    lastname: seeker.lastname,
    source: seeker.source,
    status: seeker.status,
    status_label: seeker.status !== null && seeker.status !== undefined ? (STATUS_LABEL[seeker.status] ?? '') : '',
    contact_value: contactValueFor(seeker, address),
    updated_at: seeker.updated_at.toISOString(),
  };
}

function seekerJson(seeker: seekers, address: addresses, ability: AppAbility | undefined): Record<string, unknown> {
  const json: Record<string, unknown> = {
    ...seekerSummaryJson(seeker, address),
    invite: seeker.invite,
    preferred_way_of_contact: seeker.preferred_way_of_contact,
    address: addressJson(address),
    created_at: seeker.created_at.toISOString(),
  };
  if (ability?.can('update', 'Seeker')) {
    json.notes = seeker.notes;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Query helpers.
// ---------------------------------------------------------------------------

function filterWhere(filter: unknown): Record<string, unknown> {
  switch (filter) {
    case 'accepted':
      return { status: STATUS.accepted };
    case 'inactive':
      return { invite: false, status: { notIn: [STATUS.declined, STATUS.accepted] } };
    case 'declined':
      return { status: STATUS.declined };
    default:
      return { invite: true, status: { notIn: [STATUS.declined, STATUS.accepted] } };
  }
}

/** Port of `params.fetch(key, default).to_i` - invalid numeric strings become 0, a missing key becomes `fallback`. */
function toI(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string') {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Port of SeekersController#sort_clause. Note the direction is derived from
 * whether the *raw* sort param started with '-', independent of whether the
 * field itself is recognized - an invalid field falls back to the default
 * sort column but keeps whatever direction the raw param implied.
 */
function sortClause(raw: unknown): { field: SortableColumn; direction: 'asc' | 'desc' } {
  const value = typeof raw === 'string' ? raw : '';
  const desc = value.startsWith('-');
  // The frontend's Status column is keyed `status_label` (the human-readable
  // string it displays) but that's a pure function of the real `status`
  // column - sorting by `status` produces the identical row order.
  const field = (desc ? value.slice(1) : value).replace(/^status_label$/, 'status');
  const resolved = (SORTABLE_COLUMNS as readonly string[]).includes(field) ? (field as SortableColumn) : DEFAULT_SORT;
  return { field: resolved, direction: desc ? 'desc' : 'asc' };
}

async function loadAddressMap(seekerIds: number[]): Promise<Map<number, addresses>> {
  if (seekerIds.length === 0) {
    return new Map();
  }
  const rows = await prisma.addresses.findMany({
    where: { addressable_type: ADDRESSABLE_TYPE, addressable_id: { in: seekerIds }, deleted: false },
  });
  const map = new Map<number, addresses>();
  for (const row of rows) {
    if (row.addressable_id !== null) {
      map.set(row.addressable_id, row);
    }
  }
  return map;
}

async function loadAddressForSeeker(seekerId: number): Promise<addresses | null> {
  return prisma.addresses.findFirst({
    where: { addressable_id: seekerId, addressable_type: ADDRESSABLE_TYPE, deleted: false },
  });
}

/**
 * Gates GET /api/v1/seekers/names. Mirrors statistics.ts's
 * statisticsViewingAllowedForCaller: a caller who already holds full Seeker
 * read access (Admin/WorshipfulMaster/MemberOfCouncil - the only roles
 * granting 'index'/'manage' on Seeker, see authz/ability.ts) always uses the
 * full GET /api/v1/seekers endpoint instead, so this reduced view is never
 * granted to them regardless of the AppConfig flag - this is what excludes
 * the Worshipful Master without a role-name-specific check. Everyone else
 * (plain Brothers, who otherwise have zero Seeker access) gets this view
 * only when show_seeker_names_to_brothers is enabled.
 */
async function seekerNamesListAllowedForCaller(ability: AppAbility): Promise<boolean> {
  if (ability.can('index', 'Seeker')) {
    return false;
  }
  return (await appConfig.get('show_seeker_names_to_brothers')) === true;
}

async function findSeekerOr404(uuidParam: string): Promise<seekers> {
  const seeker = await prisma.seekers.findFirst({ where: { uuid: uuidParam, deleted: false } });
  if (!seeker) {
    throw ApiError.notFound();
  }
  return seeker;
}

async function generateUniqueUuid(): Promise<string> {
  for (;;) {
    const candidate = randomUUID();
    // eslint-disable-next-line no-await-in-loop -- collision is astronomically unlikely; this loop runs once in practice.
    const existing = await prisma.seekers.findFirst({ where: { uuid: candidate } });
    if (!existing) {
      return candidate;
    }
  }
}

// ---------------------------------------------------------------------------
// Routes.
// ---------------------------------------------------------------------------

seekersRouter.get('/', async (req, res) => {
  if (!req.ability?.can('index', 'Seeker')) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const where = { deleted: false, ...filterWhere(req.query.filter) };

  const page = Math.max(toI(req.query.page, 0), 0);
  const perPage = clamp(toI(req.query.per_page, 25), 1, 100);

  if (isContactValueSort(req.query.sort)) {
    const all = await prisma.seekers.findMany({ where });
    const addressMap = await loadAddressMap(all.map((seeker) => seeker.id));
    const rows = all
      .map((seeker) => seekerSummaryJson(seeker, addressMap.get(seeker.id)) as { contact_value: string | null })
      .sort(contactValueComparator(req.query.sort));

    res.json({ rows: rows.slice(page * perPage, page * perPage + perPage), row_count: rows.length });
    return;
  }

  const { field, direction } = sortClause(req.query.sort);

  const [rows, rowCount] = await Promise.all([
    prisma.seekers.findMany({
      where,
      orderBy: { [field]: direction },
      skip: page * perPage,
      take: perPage,
    }),
    prisma.seekers.count({ where }),
  ]);

  const addressMap = await loadAddressMap(rows.map((seeker) => seeker.id));

  res.json({
    rows: rows.map((seeker) => seekerSummaryJson(seeker, addressMap.get(seeker.id))),
    row_count: rowCount,
  });
});

seekersRouter.post('/', async (req, res) => {
  if (!req.ability?.can('create', 'Seeker')) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const body: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const seekerFields = extractFields<SeekerInputFields>(body, SEEKER_FIELD_KEYS);
  const addressFields = extractFields<AddressInputFields>(body.address, ADDRESS_FIELD_KEYS);
  const addressProvided = Object.keys(addressFields).length > 0 && !isBlankAddress(addressFields);

  if (seekerFields.status === STATUS.declined) {
    seekerFields.invite = false;
  }

  const errors = validateSeeker({ seeker: seekerFields, address: addressFields, validateAddressFields: addressProvided });
  if (errors.length > 0) {
    throw ApiError.unprocessable(errors.join(', '));
  }

  const uuid = await generateUniqueUuid();
  const now = new Date();

  const { seeker, addressRow } = await prisma.$transaction(async (tx) => {
    const createdSeeker = await tx.seekers.create({
      data: {
        firstname: seekerFields.firstname ?? null,
        lastname: seekerFields.lastname ?? null,
        source: seekerFields.source ?? null,
        invite: seekerFields.invite ?? null,
        status: seekerFields.status ?? null,
        preferred_way_of_contact: seekerFields.preferred_way_of_contact ?? null,
        notes: seekerFields.notes ?? null,
        uuid,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    const createdAddress = await tx.addresses.create({
      data: {
        addressable_id: createdSeeker.id,
        addressable_type: ADDRESSABLE_TYPE,
        type_of_address: addressFields.type_of_address ?? null,
        // Omitted (not explicit null) so the DB's `purpose` default
        // ("geschäftlich") applies, same as Address.new leaving an
        // unassigned attribute at its column default.
        ...(addressFields.purpose !== undefined ? { purpose: addressFields.purpose } : {}),
        street1: addressFields.street1 ?? null,
        street2: addressFields.street2 ?? null,
        street3: addressFields.street3 ?? null,
        zip: addressFields.zip ?? null,
        city: addressFields.city ?? null,
        phone: addressFields.phone ?? null,
        fax: addressFields.fax ?? null,
        mobile: addressFields.mobile ?? null,
        email: addressFields.email ?? null,
        remarks: addressFields.remarks ?? null,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    return { seeker: createdSeeker, addressRow: createdAddress };
  });

  res.status(201).json(seekerJson(seeker, addressRow, req.ability));
});

// Registered before '/:uuid' - Express matches routes in registration
// order, so 'names' would otherwise be swallowed by the ':uuid' param route.
seekersRouter.get('/names', async (req, res) => {
  if (!req.ability || !(await seekerNamesListAllowedForCaller(req.ability))) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const rows = await prisma.seekers.findMany({
    where: { deleted: false, ...filterWhere('active') },
    orderBy: { lastname: 'asc' },
    select: { firstname: true, lastname: true },
  });

  res.json({ rows, row_count: rows.length });
});

seekersRouter.get('/:uuid', async (req, res) => {
  const seeker = await findSeekerOr404(req.params.uuid);

  if (!req.ability?.can('show', 'Seeker')) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const address = await loadAddressForSeeker(seeker.id);
  if (!address) {
    // Defensive only - every seeker created/updated through this router
    // always has an address row (see the has_one_address module comment
    // above). A seeker with no address row at all indicates a data
    // integrity problem, not a normal-flow 404/403 case.
    throw new Error(`seeker ${seeker.uuid} has no address row`);
  }

  res.json(seekerJson(seeker, address, req.ability));
});

seekersRouter.patch('/:uuid', async (req, res) => {
  const seeker = await findSeekerOr404(req.params.uuid);

  if (!req.ability?.can('update', 'Seeker')) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const body: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const seekerPatch = extractFields<SeekerInputFields>(body, SEEKER_FIELD_KEYS);
  const addressPatch = extractFields<AddressInputFields>(body.address, ADDRESS_FIELD_KEYS);
  const addressProvided = Object.keys(addressPatch).length > 0 && !isBlankAddress(addressPatch);

  const existingAddress = await loadAddressForSeeker(seeker.id);

  const mergedSeeker: SeekerInputFields = { ...currentSeekerFields(seeker), ...seekerPatch };
  if (mergedSeeker.status === STATUS.declined) {
    mergedSeeker.invite = false;
  }

  const mergedAddress: AddressInputFields = { ...currentAddressFields(existingAddress), ...addressPatch };

  const errors = validateSeeker({ seeker: mergedSeeker, address: mergedAddress, validateAddressFields: addressProvided });
  if (errors.length > 0) {
    throw ApiError.unprocessable(errors.join(', '));
  }

  const now = new Date();

  const { seeker: updatedSeeker, addressRow } = await prisma.$transaction(async (tx) => {
    const updatedSeekerRow = await tx.seekers.update({
      where: { id: seeker.id },
      data: {
        firstname: mergedSeeker.firstname ?? null,
        lastname: mergedSeeker.lastname ?? null,
        source: mergedSeeker.source ?? null,
        invite: mergedSeeker.invite ?? null,
        status: mergedSeeker.status ?? null,
        preferred_way_of_contact: mergedSeeker.preferred_way_of_contact ?? null,
        notes: mergedSeeker.notes ?? null,
        updated_at: now,
      },
    });

    let updatedAddress: addresses;
    if (existingAddress) {
      updatedAddress = addressProvided
        ? await tx.addresses.update({
            where: { id: existingAddress.id },
            data: {
              type_of_address: mergedAddress.type_of_address ?? null,
              purpose: mergedAddress.purpose ?? null,
              street1: mergedAddress.street1 ?? null,
              street2: mergedAddress.street2 ?? null,
              street3: mergedAddress.street3 ?? null,
              zip: mergedAddress.zip ?? null,
              city: mergedAddress.city ?? null,
              phone: mergedAddress.phone ?? null,
              fax: mergedAddress.fax ?? null,
              mobile: mergedAddress.mobile ?? null,
              email: mergedAddress.email ?? null,
              remarks: mergedAddress.remarks ?? null,
              updated_at: now,
            },
          })
        : existingAddress;
    } else {
      updatedAddress = await tx.addresses.create({
        data: {
          addressable_id: seeker.id,
          addressable_type: ADDRESSABLE_TYPE,
          type_of_address: mergedAddress.type_of_address ?? null,
          ...(mergedAddress.purpose !== undefined ? { purpose: mergedAddress.purpose } : {}),
          street1: mergedAddress.street1 ?? null,
          street2: mergedAddress.street2 ?? null,
          street3: mergedAddress.street3 ?? null,
          zip: mergedAddress.zip ?? null,
          city: mergedAddress.city ?? null,
          phone: mergedAddress.phone ?? null,
          fax: mergedAddress.fax ?? null,
          mobile: mergedAddress.mobile ?? null,
          email: mergedAddress.email ?? null,
          remarks: mergedAddress.remarks ?? null,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });
    }

    return { seeker: updatedSeekerRow, addressRow: updatedAddress };
  });

  res.json(seekerJson(updatedSeeker, addressRow, req.ability));
});

seekersRouter.delete('/:uuid', async (req, res) => {
  const seeker = await findSeekerOr404(req.params.uuid);

  if (!req.ability?.can('destroy', 'Seeker')) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  await prisma.seekers.update({ where: { id: seeker.id }, data: { deleted: true, updated_at: new Date() } });
  res.status(204).send();
});
