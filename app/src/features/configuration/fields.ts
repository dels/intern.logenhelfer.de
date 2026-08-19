import type { AppConfigValues } from '../../api/types';

export type FieldType = 'boolean' | 'integer' | 'string' | 'text' | 'enum';

// Which Settings tab a field's editor renders in. See
// docs/superpowers/plans/2026-07-17-settings-reorg.md's "Global Constraints"
// for the classification rationale - keep this list in sync with that plan
// if a new field's category isn't obvious from its name.
export type FieldCategory = 'funktionen' | 'konfiguration' | 'impressum' | 'sicherheit';

export interface AppConfigFieldDef {
  key: keyof AppConfigValues;
  type: FieldType;
  category: FieldCategory;
  /** Only meaningful when type === 'enum' — the exact set of values ConfigField renders as MenuItems (or radio options, see renderAs). */
  options?: string[];
  /** Byte-valued field shown to the user in MB; ConfigField converts to/from the underlying byte string. */
  unit?: 'mb';
  /** Only meaningful when type === 'enum' — renders as a RadioGroup instead of the default select dropdown. */
  renderAs?: 'radio';
  /** Hides this field unless the predicate (given the form's current, in-progress values) returns true. Absent means always visible. */
  visibleWhen?: (values: Partial<AppConfigValues>) => boolean;
}

// Shared, data-driven field list consumed by ConfigurationPage.tsx. Adding a
// new AppConfig-backed field to any Settings tab is a one-line addition
// here - it never requires new JSX in ConfigurationPage.tsx.
export const FIELDS: AppConfigFieldDef[] = [
  // Funktionen - "can users see/do X" toggles.
  { key: 'public_wp_available_to_anon_users', type: 'boolean', category: 'funktionen' },
  { key: 'working_plan_as_start_page', type: 'boolean', category: 'funktionen' },
  { key: 'archive', type: 'boolean', category: 'funktionen' },
  { key: 'show_admins', type: 'boolean', category: 'funktionen' },
  { key: 'users_can_view_statistics', type: 'boolean', category: 'funktionen' },
  { key: 'show_seeker_names_to_brothers', type: 'boolean', category: 'funktionen' },
  { key: 'notify_technical_contact_on_unknown_password_reset', type: 'boolean', category: 'funktionen' },
  { key: 'notify_user_on_login_activity', type: 'boolean', category: 'funktionen' },
  { key: 'birthday_calendar_available', type: 'boolean', category: 'funktionen' },
  {
    key: 'birthday_calendar_consent_mode',
    type: 'enum',
    category: 'funktionen',
    options: ['individual', 'blanket'],
    renderAs: 'radio',
    visibleWhen: (values) => values.birthday_calendar_available === true,
  },

  // Konfiguration - core identity fields plus other operational config.
  { key: 'domain', type: 'string', category: 'konfiguration' },
  { key: 'organisation', type: 'string', category: 'konfiguration' },
  { key: 'lodge', type: 'string', category: 'konfiguration' },
  { key: 'lodge_short', type: 'string', category: 'konfiguration' },
  { key: 'language', type: 'enum', category: 'konfiguration', options: ['de', 'en'] },
  { key: 'default_workingplan_timespan', type: 'integer', category: 'konfiguration' },
  { key: 'default_event_duration_minutes', type: 'integer', category: 'konfiguration' },
  { key: 'public_workingplan_html_timespan', type: 'integer', category: 'konfiguration' },
  { key: 'public_workingplan_ics_timespan', type: 'integer', category: 'konfiguration' },
  { key: 'default_event_location', type: 'string', category: 'konfiguration' },
  { key: 'user_change_notification_email', type: 'string', category: 'konfiguration' },
  { key: 'default_from_email', type: 'string', category: 'konfiguration' },
  { key: 'technical_contact_email', type: 'string', category: 'konfiguration' },
  { key: 'max_db_mem_size', type: 'string', category: 'konfiguration', unit: 'mb' },
  { key: 'max_upload_file_size', type: 'string', category: 'konfiguration', unit: 'mb' },
  { key: 'workingplan_footer', type: 'text', category: 'konfiguration' },
  { key: 'help', type: 'text', category: 'konfiguration' },
  { key: 'robots_txt', type: 'text', category: 'konfiguration' },

  // Impressum - legal notice / privacy notice content and the fields they're assembled from.
  { key: 'mvst_email', type: 'string', category: 'impressum' },
  { key: 'street', type: 'string', category: 'impressum' },
  { key: 'zip', type: 'string', category: 'impressum' },
  { key: 'location', type: 'string', category: 'impressum' },
  { key: 'content_responsible_name', type: 'string', category: 'impressum' },
  { key: 'technical_responsible_name', type: 'string', category: 'impressum' },
  { key: 'impressum', type: 'text', category: 'impressum' },
  { key: 'datenschutz', type: 'text', category: 'impressum' },

  // Sicherheit - MFA enforcement settings.
  { key: 'mfa_mode', type: 'enum', category: 'sicherheit', options: ['optional', 'mandatory'] },
  { key: 'mfa_enforce_for_officers', type: 'boolean', category: 'sicherheit' },
  { key: 'mfa_grace_period_days', type: 'integer', category: 'sicherheit' },
  { key: 'mfa_trusted_device_days', type: 'integer', category: 'sicherheit' },
];
