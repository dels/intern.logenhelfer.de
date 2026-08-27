import { prisma } from '../db.js';

/**
 * Port of rails-app/app/models/app_config.rb (the `AppConfig` module) plus
 * rails-app/app/models/app_config/adapter.rb (`AppConfig::Adapter`'s
 * `getter_*`/`setter_*` dispatch) and the boolean-cast layer
 * rails-app/app/controllers/api/v1/app_configs_controller.rb applies on top
 * for `:boolean`-typed keys - folded into one service so `get`/`set` already
 * return/accept fully-typed values, the way callers actually want them.
 *
 * Backed by the `app_config_adapters` table (a dumb key/value store), keyed
 * by `"#{env}_#{key}"` exactly like Rails prefixes by `Rails.env`.
 */

export type ConfigType = 'boolean' | 'integer' | 'string' | 'text';
export type ConfigValue = boolean | number | string | null;

/**
 * Port of AppConfigsController::KNOWN_KEYS - the allowlist of keys this API
 * exposes, and the type each is cast to on read/write. `default_workingplan_timespan`,
 * `public_workingplan_html_timespan`, and `public_workingplan_ics_timespan`
 * all share `AppConfig::Adapter#getter_default_workingplan_timespan`, which
 * parses "6m"/"12w"-style raw values down to a plain integer day count - see
 * `parseTimespanDays` below.
 */
export const KNOWN_KEYS: Record<string, ConfigType> = {
  public_wp_available_to_anon_users: 'boolean',
  working_plan_as_start_page: 'boolean',
  archive: 'boolean',
  show_admins: 'boolean',
  users_can_view_statistics: 'boolean',
  show_seeker_names_to_brothers: 'boolean',
  notify_technical_contact_on_unknown_password_reset: 'boolean',
  notify_user_on_login_activity: 'boolean',
  domain: 'string',
  organisation: 'string',
  lodge: 'string',
  lodge_short: 'string',
  language: 'string',
  default_workingplan_timespan: 'integer',
  default_event_location: 'string',
  default_event_duration_minutes: 'integer',
  user_change_notification_email: 'string',
  default_from_email: 'string',
  technical_contact_email: 'string',
  mvst_email: 'string',
  zip: 'string',
  location: 'string',
  street: 'string',
  content_responsible_name: 'string',
  technical_responsible_name: 'string',
  max_db_mem_size: 'string',
  max_upload_file_size: 'string',
  workingplan_footer: 'text',
  impressum: 'text',
  datenschutz: 'text',
  help: 'text',
  robots_txt: 'text',
  public_workingplan_html_timespan: 'integer',
  public_workingplan_ics_timespan: 'integer',
  public_wp_footer_show_secretary: 'boolean',
  public_wp_footer_show_worshipful_master: 'boolean',
  internal_wp_footer_show_secretary: 'boolean',
  internal_wp_footer_show_worshipful_master: 'boolean',
  mfa_mode: 'string',
  mfa_enforce_for_officers: 'boolean',
  mfa_grace_period_days: 'integer',
  mfa_trusted_device_days: 'integer',
  birthday_calendar_available: 'boolean',
  birthday_calendar_consent_mode: 'string',
  // Internal only - never added to routes/appConfig.ts's KNOWN_KEYS, so it's
  // never exposed/writable via PATCH /api/v1/app_config. Set exclusively by
  // routes/appConfig.ts's own PATCH handler when mfa_mode transitions to
  // 'mandatory' (see Step 3 below).
  mfa_grace_period_started_at: 'string',
};

/**
 * Port of `AppConfig[key]`'s fallback `case key ... end` block
 * (app_config.rb) - the raw value used when no `app_config_adapters` row
 * exists yet for the current environment. Keys not listed here (e.g.
 * `organisation`, `default_workingplan_timespan`) have no compiled-in
 * default and read back as `null` until first written, exactly like the
 * Ruby source (its `case` falls through to a `Rails.logger.warn` with no
 * assigned record).
 */
/**
 * Starter content for the `help` key (see below) - one paragraph per
 * top-level app section, using the exact German nav labels
 * (i18n/de.json's `nav.*`/`account.navLabel`/`topNav.*`) so it stays
 * recognizable next to the sidebar/top nav it's describing. Kept in this
 * repo's neutral-gender convention (see CLAUDE.md "General Advices").
 */
const HELP_DEFAULT_HTML = `<h2>Hilfe</h2>
<p>Diese Seite erklärt kurz, was sich hinter den einzelnen Bereichen der Anwendung verbirgt. Welche Punkte in der Seitenleiste sichtbar sind, hängt von den eigenen Berechtigungen ab - fehlt ein Punkt, fehlt in der Regel nur die passende Berechtigung.</p>

<h3>Übersicht</h3>
<p>Die Startseite nach der Anmeldung. Zeigt die letzten Ankündigungen, die nächsten anstehenden Termine sowie Mitglieder- und Suchenden-Zahlen mit direktem Sprung zur jeweiligen Liste.</p>

<h3>Aktuelles</h3>
<p>Ankündigungen für die Loge. Wer eine Ankündigung erstellt, kann Abonnenten automatisch per E-Mail benachrichtigen.</p>

<h3>Arbeitsplan</h3>
<p>Kalender- und Listenansicht aller Termine. Termine (auch außer Haus) können angelegt, nach Quelle gefiltert (z. B. Geburtstage oder externe Logenkalender) und als PDF exportiert werden. Über "Geburtstagskalender einbinden" lässt sich der persönliche Geburtstagskalender per ICS-Link in einer externen Kalender-App abonnieren.</p>

<h3>Mitglieder</h3>
<p>Die Mitgliederverwaltung mit Profilen, Kontaktdaten und Rollen.</p>

<h3>Suchende</h3>
<p>Die Aufnahme-/Vetting-Pipeline für Aufnahmesuchende - nur mit entsprechender Berechtigung sichtbar.</p>

<h3>Statistiken</h3>
<p>Auswertungen in drei Kategorien: Mitglieder (Anmeldeaktivität, Downloads pro Mitglied), Dateien (Downloads, Downloads pro Datei) und Meta (Speichernutzung der Anwendung).</p>

<h3>Dateien</h3>
<p>Der untere Bereich der Seitenleiste listet alle Datei-Kategorien mit ihren Unterverzeichnissen zum Hoch- und Herunterladen von Dokumenten. Der verbleibende Speicherplatz wird oben im Bereich Übersicht angezeigt.</p>

<h3>Mein Konto</h3>
<p>Eigene Stammdaten, Passwort und die Einrichtung der Zwei-Faktor-Authentifizierung (Authenticator-App, E-Mail-Code, Passkey oder Backup-Codes).</p>

<h3>Konfiguration</h3>
<p>Nur für Administratoren: Logen verwalten, Datei-Kategorien anlegen, allgemeine Einstellungen der Anwendung sowie externe ICS-Kalender anderer Logen einbinden.</p>

<h3>Impressum &amp; Hilfe</h3>
<p>Über die Links oben in der Kopfzeile jederzeit erreichbar, auch ohne Anmeldung.</p>`;

/**
 * Compiled-in standard Impressum text (Anbieterkennzeichnung gemäß § 5 DDG,
 * successor to the former TMG/MDStV regime), assembled from the same
 * `:token` mechanism `renderImpressum` (routes/public.ts) already resolves
 * against other AppConfig keys - `:content_responsible_name` and
 * `:technical_responsible_name` are net-new keys (see KNOWN_KEYS above)
 * added specifically to fill the "Inhaltlich verantwortlich"/"Technisch
 * verantwortlich" lines a valid Impressum needs; `:street` is likewise new,
 * since `:zip`/`:location` alone were never a complete postal address.
 * Exported so routes/appConfig.ts's own duplicate `DEFAULT_RAW_VALUES` can
 * reuse this exact string rather than re-typing a legal text block twice.
 * Deliberately cites "§ 18 Abs. 2 MStV" rather than the older "§ 10 Abs. 3
 * MDStV" - the MDStV was abolished in 2020 (superseded by the RStV, itself
 * since replaced by the Medienstaatsvertrag/MStV); citing it in a document
 * dated 2026 would be an outdated, incorrect legal reference. An admin who
 * needs the old wording for some reason can still edit the `impressum` text
 * freely - this is only the compiled-in starting default.
 */
export const DEFAULT_IMPRESSUM_HTML = [
  '<h2>Impressum</h2>',
  '<h3>Angaben gemäß § 5 DDG</h3>',
  '<p>:organisation<br>:street<br>:zip :location</p>',
  '<h3>Kontakt</h3>',
  '<p>E-Mail: :mvst_email</p>',
  '<h3>Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV</h3>',
  '<p>:content_responsible_name<br>:street<br>:zip :location</p>',
  '<h3>Technisch verantwortlich</h3>',
  '<p>:technical_responsible_name<br>E-Mail: :technical_contact_email</p>',
  '<h3>EU-Streitschlichtung</h3>',
  '<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: '
    + '<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>. '
    + 'Unsere E-Mail-Adresse finden Sie oben im Impressum. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer '
    + 'Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.</p>',
  '<h3>Haftung für Inhalte</h3>',
  '<p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen '
    + 'verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder '
    + 'gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige '
    + 'Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den '
    + 'allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der '
    + 'Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden '
    + 'wir diese Inhalte umgehend entfernen.</p>',
  '<h3>Haftung für Links</h3>',
  '<p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb '
    + 'können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets '
    + 'der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der '
    + 'Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht '
    + 'erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer '
    + 'Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend '
    + 'entfernen.</p>',
  '<h3>Urheberrecht</h3>',
  '<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen '
    + 'Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des '
    + 'Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien '
    + 'dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>',
].join('\n');

/**
 * Compiled-in standard Datenschutzerklärung (DSGVO Art. 13/Art. 12 ff.),
 * reusing the same organisation/address/contact tokens as
 * `DEFAULT_IMPRESSUM_HTML` above rather than introducing a second,
 * redundant set of "who is responsible" config fields - the data
 * controller (Verantwortlicher, Art. 4 Nr. 7 DSGVO) for this site is the
 * same entity named in the Impressum. Covers only what's generically true
 * for any deployment of this app (server logs, technically-necessary
 * session cookies, member-data processing, data-subject rights) - it does
 * not attempt to enumerate every third-party processor a given deployment
 * might add later; an admin extending the site (e.g. adding analytics)
 * must extend this text accordingly, same as any other AppConfig text
 * field.
 */
export const DEFAULT_DATENSCHUTZ_HTML = [
  '<h2>Datenschutzerklärung</h2>',
  '<h3>1. Verantwortlicher</h3>',
  '<p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>',
  '<p>:organisation<br>:street<br>:zip :location<br>E-Mail: :mvst_email</p>',
  '<h3>2. Erhebung und Speicherung personenbezogener Daten beim Besuch dieser Website</h3>',
  '<p>Beim Aufruf dieser Website erhebt der Browser automatisch Informationen und speichert diese in sogenannten '
    + 'Server-Log-Dateien. Erfasst werden: Browsertyp und -version, verwendetes Betriebssystem, Referrer-URL, Hostname '
    + 'des zugreifenden Rechners, Uhrzeit der Serveranfrage sowie die IP-Adresse. Diese Daten sind nicht bestimmten '
    + 'Personen zuordenbar und werden nicht mit anderen Datenquellen zusammengeführt. Rechtsgrundlage für die '
    + 'vorübergehende Speicherung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technisch fehlerfreien '
    + 'Darstellung und Sicherheit dieser Website). Die Daten werden gelöscht, sobald sie für den Zweck ihrer Erhebung '
    + 'nicht mehr erforderlich sind.</p>',
  '<h3>3. Technisch notwendige Cookies</h3>',
  '<p>Diese Website verwendet ausschließlich technisch notwendige Cookies bzw. vergleichbare Speichertechnologien '
    + '(z.B. zur Aufrechterhaltung einer Anmelde-Sitzung). Diese sind gemäß § 25 Abs. 2 TTDSG bzw. Art. 6 Abs. 1 lit. f '
    + 'DSGVO erforderlich, um den Betrieb der Website und der darüber angebotenen Funktionen zu ermöglichen, und bedürfen '
    + 'keiner gesonderten Einwilligung. Es werden keine Cookies zu Analyse- oder Marketingzwecken eingesetzt.</p>',
  '<h3>4. Verarbeitung personenbezogener Daten von Mitgliedern</h3>',
  '<p>Für angemeldete Mitglieder verarbeiten wir die im Rahmen der Mitgliedschaft erforderlichen Daten (u.a. Name, '
    + 'Kontaktdaten, Angaben zu Ämtern und Terminen) auf Grundlage von Art. 6 Abs. 1 lit. b und lit. f DSGVO zur '
    + 'Verwaltung der Mitgliedschaft und zur Organisation des Vereinslebens. Eine Weitergabe an Dritte erfolgt nicht, '
    + 'soweit dies nicht zur Erfüllung des Vereinszwecks oder aufgrund gesetzlicher Verpflichtungen erforderlich ist.</p>',
  '<h3>5. SSL-/TLS-Verschlüsselung</h3>',
  '<p>Diese Website nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen '
    + 'Sie daran, dass die Adresszeile des Browsers von "http://" auf "https://" wechselt.</p>',
  '<h3>6. Ihre Rechte als betroffene Person</h3>',
  '<p>Sie haben jederzeit das Recht auf Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten (Art. 15 '
    + 'DSGVO), auf Berichtigung (Art. 16 DSGVO), auf Löschung (Art. 17 DSGVO), auf Einschränkung der Verarbeitung '
    + '(Art. 18 DSGVO), auf Datenübertragbarkeit (Art. 20 DSGVO) sowie auf Widerspruch gegen die Verarbeitung (Art. 21 '
    + 'DSGVO). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Wenden Sie sich '
    + 'hierzu bitte an die oben genannte Kontaktadresse.</p>',
  '<h3>7. Beschwerderecht bei einer Aufsichtsbehörde</h3>',
  '<p>Ihnen steht zudem ein Beschwerderecht bei der für Sie zuständigen Datenschutz-Aufsichtsbehörde zu, wenn Sie der '
    + 'Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.</p>',
].join('\n');

const DEFAULT_RAW_VALUES: Partial<Record<string, string | boolean>> = {
  public_wp_available_to_anon_users: true,
  public_workingplan_html_timespan: '6m',
  public_workingplan_ics_timespan: '12m',
  working_plan_as_start_page: false,
  lodge: 'Logenhelfer',
  lodge_short: 'lgnhlfr',
  language: 'de',
  show_admins: true,
  users_can_view_statistics: true,
  // Security-sensitive default: closed by default (see this repo's CLAUDE.md
  // "Sensitive config defaults must default to the more private option") -
  // unlike show_admins/users_can_view_statistics above, this gates
  // visibility into a live vetting pipeline for members who otherwise have
  // zero Seeker access, so it must be opted into, not opted out of.
  show_seeker_names_to_brothers: false,
  notify_technical_contact_on_unknown_password_reset: true,
  // Security-sensitive default: closed by default (see this repo's CLAUDE.md
  // "Sensitive config defaults must default to the more private option") -
  // unlike notify_technical_contact_on_unknown_password_reset above (an
  // internal admin notification), this sends mail to end users on every
  // login, so it must be opted into.
  notify_user_on_login_activity: false,
  max_db_mem_size: String(1024 * 1024 * 100),
  // Net-new key, no Rails precedent (upload-size limiting didn't exist on
  // that side) - deliberately hardcoded independent of the
  // MAX_UPLOAD_FILE_SIZE_MB ceiling env var (contractValidation.ts) so
  // raising the ceiling never silently raises this enforced default too.
  max_upload_file_size: String(20 * 1024 * 1024),
  archive: '0',
  default_from_email: 'website@logenhelfer.de',
  technical_contact_email: 'technik@logenhelfer.de',
  robots_txt: 'User-Agent: *\nDisallow: /',
  impressum: DEFAULT_IMPRESSUM_HTML,
  datenschutz: DEFAULT_DATENSCHUTZ_HTML,
  domain: 'logenhelfer.de',
  default_event_duration_minutes: '60',
  mfa_mode: 'optional',
  mfa_enforce_for_officers: false,
  mfa_grace_period_days: '14',
  mfa_trusted_device_days: '30',
  // Security-sensitive default: closed by default (see this repo's CLAUDE.md
  // "Sensitive config defaults must default to the more private option"),
  // same rationale as show_seeker_names_to_brothers above - this gates
  // whether member birthdays are exposed via an unauthenticated ICS feed at
  // all, so it must be opted into.
  birthday_calendar_available: false,
  // Private-by-default choice within the feature too: require per-member
  // opt-in unless an admin explicitly attests consent was obtained some
  // other way (see docs/superpowers/specs/2026-08-05-pseudonymized-birthday-calendar-design.md).
  birthday_calendar_consent_mode: 'individual',
  // Compiled-in starter text for the public/authenticated "Hilfe" page
  // (rendered via renderHelp() in routes/public.ts, no :token substitution
  // unlike impressum). Unlike every other DEFAULT_RAW_VALUES entry above,
  // this one exists purely so the page isn't blank/placeholder-only out of
  // the box - an admin can freely rewrite it via the Konfiguration page at
  // any time, same as impressum.
  help: HELP_DEFAULT_HTML,
  public_wp_footer_show_secretary: false,
  public_wp_footer_show_worshipful_master: false,
  internal_wp_footer_show_secretary: false,
  internal_wp_footer_show_worshipful_master: false,
};

/** Port of ActiveModel::Type::Boolean::FALSE_VALUES. */
const FALSE_VALUES = new Set<unknown>([false, 0, '0', 'f', 'F', 'false', 'FALSE', 'off', 'OFF']);

/**
 * Port of ActiveModel::Type::Boolean#cast (via Type::Value#cast's nil
 * short-circuit): nil/undefined/"" stay nil, everything else is `true`
 * unless it's one of Rails' recognized "false-ish" tokens.
 */
function castBoolean(raw: unknown): boolean | null {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  return !FALSE_VALUES.has(raw);
}

/**
 * Port of Ruby's `String#to_i` / `Numeric#to_i`, as used by
 * `AppConfigsController#cast_for_write`'s `:integer` branch - parses a
 * leading (optionally signed) run of digits and truncates the rest, falling
 * back to 0 for anything with no leading numeric run (matching `"abc".to_i
 * == 0`).
 */
function rubyToI(value: unknown): number {
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  const match = /^\s*[-+]?\d+/.exec(String(value));
  return match ? Number.parseInt(match[0], 10) : 0;
}

/** Keys whose `AppConfig::Adapter` getter is (aliased to) `getter_default_workingplan_timespan`. */
const TIMESPAN_KEYS = new Set(['default_workingplan_timespan', 'public_workingplan_html_timespan', 'public_workingplan_ics_timespan']);

/**
 * Port of `AppConfig::Adapter#getter_default_workingplan_timespan` - parses
 * a raw stored/default value like "6m" (months), "12w" (weeks), or a bare
 * "180"/"180d" (days) into a plain integer day count, falling back to 120
 * (Ruby's `4 * 30`) when nothing matches. Ruby's `case/when` regex tests are
 * unanchored-at-start and evaluated in this exact order, stopping at the
 * first match - ported 1:1 below.
 */
function parseTimespanDays(raw: string): number {
  let match = /(\d+)m$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 30;
  }
  match = /(\d+)w$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 7;
  }
  match = /(\d+)d?$/.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10);
  }
  return 4 * 30;
}

/**
 * Port of `AppConfig::Adapter#getter_max_db_mem_size` - parses a raw value
 * with a "K"/"M"/"G" (case-insensitive, unanchored) suffix into a byte
 * count; anything else (e.g. the compiled default "104857600", a plain
 * digit string with no unit) passes through unchanged.
 */
function parseMaxDbMemSize(raw: string): string | number {
  let match = /(\d+)K/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024;
  }
  match = /(\d+)M/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024;
  }
  match = /(\d+)G/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024 * 1024;
  }
  return raw;
}

/**
 * Port of AppConfigsController#cast_for_write. Returns the value that gets
 * stringified (Ruby's `value.to_s`, done here directly since the storage
 * column is a plain string) and stored in `app_config_adapters`.
 */
function castForWrite(type: ConfigType, value: unknown): string {
  if (type === 'boolean') {
    return String(castBoolean(value));
  }
  if (type === 'integer') {
    return String(rubyToI(value));
  }
  // Ruby's `nil.to_s` is `""`, not the string "nil" - JS's `String(null)`/
  // `String(undefined)` return "null"/"undefined" instead, which would
  // otherwise permanently stringify an unset value into a literal
  // 4-character "null" stored in app_config_adapters.
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Applies a key's getter-override (timespan shorthand / mem-size suffix /
 * boolean cast) to its raw stored-or-default value, producing the final
 * typed value callers get back from `get()`. Mirrors `AppConfig::Adapter#value`'s
 * getter dispatch plus the controller's boolean cast layered on top.
 */
function coerce(key: string, type: ConfigType, raw: string | boolean): ConfigValue {
  if (type === 'boolean') {
    return castBoolean(raw);
  }
  if (TIMESPAN_KEYS.has(key)) {
    return parseTimespanDays(String(raw));
  }
  // max_upload_file_size reuses max_db_mem_size's parser (no separate
  // Rails-port justification needed - it's a net-new key, but the K/M/G-
  // suffix-or-passthrough behavior wanted is identical).
  if (key === 'max_db_mem_size' || key === 'max_upload_file_size') {
    return parseMaxDbMemSize(String(raw));
  }
  if (type === 'integer') {
    return rubyToI(raw);
  }
  return String(raw);
}

interface CacheEntry {
  /** The raw stored-or-default value, pre-getter-override (mirrors Ruby's `@@records[key]`). */
  raw: string | boolean | null;
  fetchedAt: number;
}

/** Rails: `Rails.env.development? ? 1.second : 5.minutes`, evaluated once at module load. */
function defaultTtlMs(): number {
  return (process.env.NODE_ENV ?? 'development') === 'development' ? 1_000 : 5 * 60_000;
}

export interface AppConfigServiceOptions {
  /** Overridable for tests; defaults to Rails' 1s-dev/5min-otherwise split. */
  ttlMs?: number;
  /** Overridable clock for tests. */
  now?: () => number;
}

/**
 * Port of the `AppConfig` module - a small in-process cache (mirroring
 * `@@records`/`@@access_times`) in front of the `app_config_adapters` table,
 * keyed by `"#{env}_#{key}"`.
 */
export class AppConfigService {
  private readonly cache = new Map<string, CacheEntry>();
  /** The TTL actually in effect for this instance (exposed for tests/introspection). */
  readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: AppConfigServiceOptions = {}) {
    this.ttlMs = options.ttlMs ?? defaultTtlMs();
    this.now = options.now ?? (() => Date.now());
  }

  private envKeyPrefix(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  private fullKey(key: string): string {
    return `${this.envKeyPrefix()}_${key}`;
  }

  /** Port of `AppConfig.dirty!(key)` - forces the next `get(key)` to reload from the DB. */
  dirty(key: string): void {
    this.cache.delete(key);
  }

  private async fetchRaw(key: string): Promise<string | boolean | null> {
    const row = await prisma.app_config_adapters.findFirst({ where: { key: this.fullKey(key) } });
    if (row?.value !== undefined && row.value !== null) {
      return row.value;
    }
    return DEFAULT_RAW_VALUES[key] ?? null;
  }

  /**
   * Port of `AppConfig[key]` (with the controller's boolean-cast layer
   * folded in) - returns the cached raw value (refetching once the TTL has
   * elapsed), then applies the key's getter-override/type coercion.
   * Unknown keys (not in `KNOWN_KEYS`) always resolve to `null`, mirroring
   * `AppConfig[key]`'s `Rails.logger.warn`-and-nil fallthrough for a key
   * with no case branch and no stored row.
   */
  async get(key: string): Promise<ConfigValue> {
    const type = KNOWN_KEYS[key];
    if (type === undefined) {
      return null;
    }

    const cached = this.cache.get(key);
    const isFresh = cached !== undefined && this.now() - cached.fetchedAt < this.ttlMs;

    const raw = isFresh ? (cached as CacheEntry).raw : await this.fetchRaw(key);
    if (!isFresh) {
      this.cache.set(key, { raw, fetchedAt: this.now() });
    }

    if (raw === null) {
      return null;
    }
    return coerce(key, type, raw);
  }

  /**
   * Port of `AppConfig[key] = value` (`[]=`) plus
   * `AppConfigsController#cast_for_write` - stringifies/casts `value`
   * according to `key`'s type, upserts the row, and immediately invalidates
   * the cache entry (Ruby's `dirty!` call at the end of `[]=`) so the next
   * `get` reflects the write rather than a stale cached value.
   */
  async set(key: string, value: unknown): Promise<void> {
    const type = KNOWN_KEYS[key];
    if (type === undefined) {
      throw new Error(`AppConfigService.set: unknown key "${key}"`);
    }

    const stored = castForWrite(type, value);
    const fullKey = this.fullKey(key);
    const existing = await prisma.app_config_adapters.findFirst({ where: { key: fullKey } });
    if (existing) {
      await prisma.app_config_adapters.update({ where: { id: existing.id }, data: { value: stored } });
    } else {
      await prisma.app_config_adapters.create({ data: { key: fullKey, value: stored } });
    }

    this.dirty(key);
  }
}

/** Shared singleton, analogous to Ruby's `AppConfig` module-level singleton. */
export const appConfig = new AppConfigService();

// -- Public helper functions ------------------------------------------------

/**
 * Reads an AppConfig key and coerces whatever the shared service resolves
 * (boolean/number/string) to its string representation, mirroring Ruby's
 * implicit `to_s` call on a `String#gsub` block's return value - the
 * mechanism `PublicImpressumController#rendered_impressum` relies on when a
 * template token happens to resolve to a non-string AppConfig value.
 * `null` (an unconfigured key with no default) stays `null`.
 */
export async function getConfigString(key: string): Promise<string | null> {
  const value = await appConfig.get(key);
  return value === null ? null : String(value);
}

/**
 * Port of `ActiveModel::Type::Boolean.new.cast(AppConfig[...])` used by both
 * PublicLandingController and PublicWorkingplanController - the shared
 * service already applies the ActiveModel::Type::Boolean cast for
 * `boolean`-typed keys; `Boolean(...)` here just folds the `nil` case (no
 * row, no default) to `false`, matching every actual call site's use of the
 * result in a boolean context (`&&`/`unless`).
 */
export async function getBoolean(key: string): Promise<boolean> {
  return Boolean(await appConfig.get(key));
}

/**
 * Port of `AppConfig::Adapter#getter_default_workingplan_timespan` as
 * exposed by the shared service (already parses "Nm"/"Nw"/"Nd" into a plain
 * day count) - falls back to Ruby's `4 * 30` only in the (currently
 * unreachable, since both timespan keys have compiled-in defaults) case
 * where the service has nothing to resolve.
 */
export async function getTimespanDays(key: string): Promise<number> {
  const value = await appConfig.get(key);
  return typeof value === 'number' ? value : 4 * 30;
}
