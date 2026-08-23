import { useForm, Controller, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Autocomplete, Box, Button, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useRoles } from '../categories/api';
import type { MemberInput, MemberAddressInput, RoleSummary } from '../../api/types';

// Mirrors User's own presence validations (rails-app/app/models/user.rb)
// for the fields this increment exposes - matriculation_number is required
// by the model but only meaningfully enforced client-side when the field
// is actually editable (see `editableFields`).
const memberSchema = z.object({
  email: z.string().min(1).optional(),
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  date_of_birth: z.string().optional(),
  matriculation_number: z.coerce.number().optional(),
  job_title: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  entered_apprentice_since: z.string().nullable().optional(),
  fellow_craft_since: z.string().nullable().optional(),
  master_mason_since: z.string().nullable().optional(),
  mother_lodge: z.string().nullable().optional(),
  accepted_at: z.string().nullable().optional(),
  role_ids: z.array(z.number()).optional(),
  addresses: z.array(z.object({
    id: z.number().optional(),
    type_of_address: z.coerce.number().optional(),
    purpose: z.string().optional(),
    street1: z.string().nullable().optional(),
    street2: z.string().nullable().optional(),
    street3: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    fax: z.string().nullable().optional(),
    mobile: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    _destroy: z.boolean().optional(),
  })).optional(),
});

export interface MemberFormProps {
  defaultValues: MemberInput;
  editableFields: string[];
  onSubmit: (values: MemberInput) => void;
  submitting: boolean;
  submitError?: string | null;
  onCancel?: () => void;
}

export default function MemberForm({ defaultValues, editableFields, onSubmit, submitting, submitError, onCancel }: MemberFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { control, handleSubmit } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema) as Resolver<MemberInput>,
    defaultValues,
  });
  // keyName: '_key' - useFieldArray's default key name is literally "id",
  // which would shadow the address's real database id. Plain field edits
  // (via Controller, by dot-path name) are unaffected, but the remove
  // button's update(index, { ...row, _destroy: true }) below rebuilds the
  // whole row from the shadowed `field` object - without this, removal
  // submits react-hook-form's own generated key instead of the real id.
  // Use field._key for the React key prop instead of field.id.
  const { fields, append, update } = useFieldArray({ control, name: 'addresses', keyName: '_key' });
  const canEdit = (field: string) => editableFields.includes(field);
  const { data: positionRoles } = useRoles('positions');
  const { data: adminRoles } = useRoles('administrational');

  // Zod's z.string() doesn't apply the OpenAPI schema's `format: date`
  // constraint, so a blank date-picker field round-trips as `''` here -
  // express-openapi-validator rejects `''` against `{type: string, format:
  // date}` (only omitting the field, or a real date, is valid), so an
  // untouched optional date field 422s the whole request. Drop blank date
  // fields on submit rather than loosening the schema.
  const DATE_FIELDS = ['date_of_birth', 'entered_apprentice_since', 'fellow_craft_since', 'master_mason_since', 'accepted_at'] as const;
  const submitWithNormalizedDates = (values: MemberInput) => {
    const normalized = { ...values };
    for (const field of DATE_FIELDS) {
      if (normalized[field] === '') {
        delete normalized[field];
      }
    }
    onSubmit(normalized);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submitWithNormalizedDates)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        {canEdit('firstname') && (
          <Controller
            name="firstname"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t('members.firstname')} error={!!fieldState.error} required />
            )}
          />
        )}
        {canEdit('lastname') && (
          <Controller
            name="lastname"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t('members.lastname')} error={!!fieldState.error} required />
            )}
          />
        )}
        {canEdit('email') && (
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t('members.email')} error={!!fieldState.error} required />
            )}
          />
        )}
        {canEdit('mobile') && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Controller
              name="mobile"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} value={field.value ?? ''} label={t('members.mobile')} error={!!fieldState.error} sx={{ flex: 1 }} />
              )}
            />
            <Tooltip title={t('members.mobileInfo')}>
              <InfoOutlinedIcon
                data-testid="mobile-field-info-icon"
                sx={{ cursor: 'default', fontSize: 20, color: 'text.secondary' }}
              />
            </Tooltip>
          </Stack>
        )}
        {canEdit('date_of_birth') && (
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} type="date" label={t('members.dateOfBirth')}
                error={!!fieldState.error} slotProps={{ inputLabel: { shrink: true } }} />
            )}
          />
        )}
        {canEdit('matriculation_number') && (
          <Controller
            name="matriculation_number"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} type="number" label={t('members.matriculationNumber')} error={!!fieldState.error} required />
            )}
          />
        )}
        {canEdit('job_title') && (
          <Controller
            name="job_title"
            control={control}
            render={({ field }) => <TextField {...field} value={field.value ?? ''} label={t('members.jobTitle')} />}
          />
        )}
        {canEdit('entered_apprentice_since') && (
          <Controller
            name="entered_apprentice_since"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} type="date" label={t('members.enteredApprenticeSince')}
                error={!!fieldState.error} slotProps={{ inputLabel: { shrink: true } }} />
            )}
          />
        )}
        {canEdit('fellow_craft_since') && (
          <Controller
            name="fellow_craft_since"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} type="date" label={t('members.fellowCraftSince')}
                error={!!fieldState.error} slotProps={{ inputLabel: { shrink: true } }} />
            )}
          />
        )}
        {canEdit('master_mason_since') && (
          <Controller
            name="master_mason_since"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} type="date" label={t('members.masterMasonSince')}
                error={!!fieldState.error} slotProps={{ inputLabel: { shrink: true } }} />
            )}
          />
        )}
        {canEdit('mother_lodge') && (
          <Controller name="mother_lodge" control={control} render={({ field }) => (
            <TextField {...field} value={field.value ?? ''} label={t('members.motherLodge')} />
          )} />
        )}
        {canEdit('accepted_at') && (
          <Controller name="accepted_at" control={control} render={({ field }) => (
            <TextField {...field} value={field.value ?? ''} type="date" label={t('members.acceptedAt')}
              slotProps={{ inputLabel: { shrink: true } }} />
          )} />
        )}
        {canEdit('role_ids') && (
          <>
            <Controller name="role_ids" control={control} render={({ field }) => (
              <Autocomplete
                multiple
                options={positionRoles?.rows ?? []}
                getOptionLabel={(r: RoleSummary) => r.display_name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={(positionRoles?.rows ?? []).filter((r) => (field.value ?? []).includes(r.id))}
                onChange={(_e, selected) => {
                  const otherIds = (field.value ?? []).filter((id: number) => !(positionRoles?.rows ?? []).some((r) => r.id === id));
                  field.onChange([...otherIds, ...selected.map((r) => r.id)]);
                }}
                renderInput={(params) => <TextField {...params} label={t('members.positions')} />}
              />
            )} />
            <Controller name="role_ids" control={control} render={({ field }) => (
              <Autocomplete
                multiple
                options={adminRoles?.rows ?? []}
                getOptionLabel={(r: RoleSummary) => r.display_name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={(adminRoles?.rows ?? []).filter((r) => (field.value ?? []).includes(r.id))}
                onChange={(_e, selected) => {
                  const otherIds = (field.value ?? []).filter((id: number) => !(adminRoles?.rows ?? []).some((r) => r.id === id));
                  field.onChange([...otherIds, ...selected.map((r) => r.id)]);
                }}
                renderInput={(params) => <TextField {...params} label={t('members.adminRoles')} />}
              />
            )} />
          </>
        )}
        {canEdit('addresses') && (
          <>
            <Typography variant="h2" sx={{ mt: 2 }}>{t('members.addresses')}</Typography>
            {fields.map((field, index) => {
              const row = field as unknown as MemberAddressInput & { _destroy?: boolean };
              if (row._destroy) return null;
              return (
                <Stack key={field._key} spacing={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Controller name={`addresses.${index}.purpose`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('members.addressPurpose')} />
                  )} />
                  <Controller name={`addresses.${index}.type_of_address`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} select label={t('members.addressType')}>
                      <MenuItem value={0}>{t('members.addressTypePrivate')}</MenuItem>
                      <MenuItem value={1}>{t('members.addressTypeBusiness')}</MenuItem>
                      <MenuItem value={2}>{t('members.addressTypeOther')}</MenuItem>
                    </TextField>
                  )} />
                  <Controller name={`addresses.${index}.street1`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.street')} />
                  )} />
                  <Controller name={`addresses.${index}.zip`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.zip')} />
                  )} />
                  <Controller name={`addresses.${index}.city`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.city')} />
                  )} />
                  <Controller name={`addresses.${index}.phone`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.phone')} />
                  )} />
                  <Controller name={`addresses.${index}.mobile`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.mobile')} />
                  )} />
                  <Controller name={`addresses.${index}.email`} control={control} render={({ field: f }) => (
                    <TextField {...f} value={f.value ?? ''} label={t('seekers.addressFields.email')} />
                  )} />
                  <Button color="error" size="small" onClick={() => update(index, { ...row, _destroy: true })} sx={{ alignSelf: 'flex-start' }}>
                    {t('members.removeAddress')}
                  </Button>
                </Stack>
              );
            })}
            <Button onClick={() => append({ type_of_address: 0, purpose: '' })} sx={{ alignSelf: 'flex-start' }}>
              {t('members.addAddress')}
            </Button>
          </>
        )}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('members.save')}
          </Button>
          <Button onClick={() => (onCancel ? onCancel() : navigate(-1))}>{t('common.cancel')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
