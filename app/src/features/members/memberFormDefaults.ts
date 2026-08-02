import type { Member, MemberInput } from '../../api/types';

// For type_of_address 0/1, Address#purpose returns an i18n label
// ("Privat"/"Geschäftlich"), not the raw column - seeding it back
// here round-trips fine while the type stays private/business (the
// getter always overrides it on save), but would write the German
// label into the raw column if the type were later changed to
// "other" (which does read the raw column). Known, accepted quirk.
export function buildMemberFormDefaults(member: Member): MemberInput {
  return {
    email: member.email,
    firstname: member.firstname ?? '',
    lastname: member.lastname ?? '',
    date_of_birth: member.date_of_birth ?? '',
    matriculation_number: member.matriculation_number ?? undefined,
    job_title: member.job_title,
    entered_apprentice_since: member.entered_apprentice_since ?? '',
    fellow_craft_since: member.fellow_craft_since ?? '',
    master_mason_since: member.master_mason_since ?? '',
    role_ids: member.role_ids,
    addresses: member.addresses.map((a) => ({
      id: a.id,
      type_of_address: a.type_of_address,
      purpose: a.purpose,
      street1: a.street,
      zip: a.zip,
      city: a.city,
      phone: a.phone,
      fax: a.fax,
      mobile: a.mobile,
      email: a.email,
    })),
  };
}
