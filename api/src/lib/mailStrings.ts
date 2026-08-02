export type MailLanguage = 'de' | 'en';

export interface MailStrings {
  passwordReset: {
    subject(lodge: string): string;
    body(firstname: string, resetUrl: string, ttlMinutes: number): string;
  };
  unknownPasswordReset: {
    subject(domain: string): string;
    body(email: string, domain: string): string;
  };
  announcementPublished: {
    subject(domain: string): string;
    body(firstname: string, title: string, creatorName: string, domain: string, technicalContactEmail: string): string;
  };
  eventRegistrationDigest: {
    subject: string;
    greeting: string;
    footer: string;
    unknownHost: string;
    unknownLocation: string;
    festiveBoardSuffix: string;
    unknownParticipant: string;
    externalLine(title: string, dateStr: string, host: string): string;
    internalLine(title: string, dateStr: string, location: string): string;
    participantLine(name: string): string;
  };
}

/**
 * Every hardcoded German string that used to live inline at each sendMail
 * call site (passwordReset.ts, announcements.ts, eventRegistrationDigest.ts)
 * lives here instead, so a caller can select the AppConfig[:language]
 * variant. The 'de' side is byte-for-byte identical to the text those files
 * shipped with before this module existed.
 */
const MAIL_STRINGS: Record<MailLanguage, MailStrings> = {
  de: {
    passwordReset: {
      subject: (lodge) => `Passwort zurücksetzen für ${lodge}`,
      body: (firstname, resetUrl, ttlMinutes) => [
        `Lieber Br. ${firstname}`,
        '',
        'Du (oder jemand in Deinem Namen) hat ein neues Passwort angefordert.',
        `Klicke auf den folgenden Link, um ein neues Passwort zu vergeben: ${resetUrl}`,
        '',
        `Dieser Link ist ${ttlMinutes} Minuten gültig.`,
        '',
        'Falls Du diese Anfrage nicht gestellt hast, kannst Du diese E-Mail ignorieren - Dein Passwort bleibt unverändert.',
        '',
        'Herzliche brdrl. Grüße',
      ].join('\n'),
    },
    unknownPasswordReset: {
      subject: (domain) => `Passwort-Reset-Anfrage für unbekannte E-Mail-Adresse auf ${domain}`,
      body: (email, domain) => [
        `Es wurde ein Passwort-Reset für die E-Mail-Adresse "${email}" angefordert, die keinem Mitglied auf ${domain} zugeordnet ist.`,
        '',
        'Möglicherweise hat ein Bruder seine hinterlegte E-Mail-Adresse vergessen - bitte bei Bedarf Rücksprache halten.',
        '',
        'Diese Benachrichtigung kann in den Einstellungen deaktiviert werden.',
      ].join('\n'),
    },
    announcementPublished: {
      subject: (domain) => `Neue Meldung auf ${domain} veröffentlicht`,
      body: (firstname, title, creatorName, domain, technicalContactEmail) => [
        `Lieber Br. ${firstname}`,
        '',
        `Es wurde eine neue Nachricht mit dem Titel ${title} von ${creatorName} veröffentlicht.`,
        '',
        'Herzliche brdrl. Grüße',
        '',
        '--',
        `Dies ist eine automatisch generierte E-Mail. Du bekommst diese E-Mail, weil Du die Nachrichten von ${domain} abboniert hast.`,
        `Du kannst diese Einstellung jederzeit ändern unter ${domain}.`,
        `Bei Fragen wenden Sie sich bitte an ${technicalContactEmail}`,
      ].join('\n'),
    },
    eventRegistrationDigest: {
      subject: 'Neue Anmeldungen zu Veranstaltungen',
      greeting: 'Liebe Brüder',
      footer: 'Dies ist eine automatisch generierte E-Mail.',
      unknownHost: 'unbekannter Loge',
      unknownLocation: 'unbekanntem Ort',
      festiveBoardSuffix: ' (inkl. Tafel)',
      unknownParticipant: 'Unbekannt',
      externalLine: (title, dateStr, host) => `${title} am ${dateStr} bei ${host}:`,
      internalLine: (title, dateStr, location) => `${title} am ${dateStr} in ${location}:`,
      participantLine: (name) => `  - ${name}`,
    },
  },
  en: {
    passwordReset: {
      subject: (lodge) => `Reset your password for ${lodge}`,
      body: (firstname, resetUrl, ttlMinutes) => [
        `Dear Br. ${firstname}`,
        '',
        'You (or someone on your behalf) requested a new password.',
        `Click the following link to set a new password: ${resetUrl}`,
        '',
        `This link is valid for ${ttlMinutes} minutes.`,
        '',
        'If you did not request this, you can ignore this email - your password remains unchanged.',
        '',
        'Fraternally,',
      ].join('\n'),
    },
    unknownPasswordReset: {
      subject: (domain) => `Password reset request for an unknown email address on ${domain}`,
      body: (email, domain) => [
        `A password reset was requested for the email address "${email}", which is not assigned to any member on ${domain}.`,
        '',
        'A brother may have forgotten which email address is on file - please follow up if needed.',
        '',
        'This notification can be disabled in the settings.',
      ].join('\n'),
    },
    announcementPublished: {
      subject: (domain) => `New announcement published on ${domain}`,
      body: (firstname, title, creatorName, domain, technicalContactEmail) => [
        `Dear Br. ${firstname}`,
        '',
        `A new announcement titled ${title} was published by ${creatorName}.`,
        '',
        'Fraternally,',
        '',
        '--',
        `This is an automatically generated email. You are receiving it because you subscribed to announcements on ${domain}.`,
        `You can change this setting at any time at ${domain}.`,
        `If you have any questions, please contact ${technicalContactEmail}`,
      ].join('\n'),
    },
    eventRegistrationDigest: {
      subject: 'New event registrations',
      greeting: 'Dear Brothers',
      footer: 'This is an automatically generated email.',
      unknownHost: 'unknown lodge',
      unknownLocation: 'unknown location',
      festiveBoardSuffix: ' (incl. festive board)',
      unknownParticipant: 'Unknown',
      externalLine: (title, dateStr, host) => `${title} on ${dateStr} at ${host}:`,
      internalLine: (title, dateStr, location) => `${title} on ${dateStr} at ${location}:`,
      participantLine: (name) => `  - ${name}`,
    },
  },
};

export function mailStringsFor(language: string): MailStrings {
  return MAIL_STRINGS[language as MailLanguage] ?? MAIL_STRINGS.de;
}
