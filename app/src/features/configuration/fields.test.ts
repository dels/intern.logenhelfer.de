import { describe, expect, it } from 'vitest';
import { FIELDS } from './fields';

describe('FIELDS', () => {
  it('classifies every field into exactly one of the Settings-tab categories', () => {
    for (const field of FIELDS) {
      expect(['funktionen', 'konfiguration', 'impressum', 'sicherheit']).toContain(field.category);
    }
  });

  it('groups every boolean toggle under Funktionen, and only booleans', () => {
    const funktionen = FIELDS.filter((f) => f.category === 'funktionen');
    const funktionenKeys = funktionen.map((f) => f.key);
    expect(funktionenKeys).toEqual(
      expect.arrayContaining(['working_plan_as_start_page', 'public_wp_available_to_anon_users', 'show_admins']),
    );
    for (const field of funktionen) {
      expect(field.type).toBe('boolean');
    }
  });

  it('groups Domain, Vereinsname, Loge, Abkürzung, Sprache and default event duration under Konfiguration', () => {
    const konfigurationKeys = FIELDS.filter((f) => f.category === 'konfiguration').map((f) => f.key);
    expect(konfigurationKeys).toEqual(expect.arrayContaining([
      'domain', 'organisation', 'lodge', 'lodge_short', 'language', 'default_event_duration_minutes',
    ]));
  });

  it('gives the language field exactly the "de"/"en" options ConfigField can render', () => {
    const languageField = FIELDS.find((f) => f.key === 'language');
    expect(languageField?.type).toBe('enum');
    expect(languageField?.options).toEqual(['de', 'en']);
  });

  it('gives max_upload_file_size the same byte-to-MB unit treatment as max_db_mem_size', () => {
    const field = FIELDS.find((f) => f.key === 'max_upload_file_size');
    expect(field).toEqual({ key: 'max_upload_file_size', type: 'string', category: 'konfiguration', unit: 'mb' });
  });

  it('groups the legal-notice text and its source fields under Impressum', () => {
    const impressumKeys = FIELDS.filter((f) => f.category === 'impressum').map((f) => f.key);
    expect(impressumKeys).toEqual(expect.arrayContaining(['impressum', 'mvst_email', 'zip', 'location']));
  });

  it('groups the four MFA settings under Sicherheit', () => {
    const sicherheitKeys = FIELDS.filter((f) => f.category === 'sicherheit').map((f) => f.key);
    expect(sicherheitKeys).toEqual(expect.arrayContaining([
      'mfa_mode', 'mfa_enforce_for_officers', 'mfa_grace_period_days', 'mfa_trusted_device_days',
    ]));
  });

  it('gives the mfa_mode field exactly the "optional"/"mandatory" options ConfigField can render', () => {
    const mfaModeField = FIELDS.find((f) => f.key === 'mfa_mode');
    expect(mfaModeField?.type).toBe('enum');
    expect(mfaModeField?.options).toEqual(['optional', 'mandatory']);
  });

  it('has no duplicate keys and covers every field the single-page ConfigurationPage previously rendered', () => {
    const keys = FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    // arrayContaining (not toHaveLength) on purpose: the parallel
    // statistics-reorg plan may append a 24th field
    // (users_can_view_statistics) to FIELDS. This check must keep passing
    // either way - a length assertion would force that plan's executor to
    // also edit this test, which is exactly the cross-plan coupling the
    // shared-array design is meant to avoid.
    expect(keys).toEqual(expect.arrayContaining([
      'public_wp_available_to_anon_users', 'working_plan_as_start_page', 'archive', 'show_admins',
      'domain', 'organisation', 'lodge', 'lodge_short', 'default_workingplan_timespan',
      'public_workingplan_html_timespan', 'public_workingplan_ics_timespan', 'default_event_location',
      'user_change_notification_email', 'default_from_email', 'technical_contact_email', 'max_db_mem_size',
      'max_upload_file_size', 'workingplan_footer', 'help', 'robots_txt', 'mvst_email', 'zip', 'location', 'impressum',
    ]));
  });
});
