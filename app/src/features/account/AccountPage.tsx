import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Paper, TextField, Button, Typography, Alert, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUpdatePassword } from './api';
import { useUpdateBirthdayCalendarConsent } from '../announcements/api';
import { apiErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { useMember, useUpdateMember } from '../members/api';
import MemberForm from '../members/MemberForm';
import MfaAccountSection from '../mfa/MfaAccountSection';
import type { MemberInput } from '../../api/types';

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
  new_password_confirmation: z.string().min(1),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'mismatch',
  path: ['new_password_confirmation'],
});
type FormValues = z.infer<typeof schema>;

function ProfileSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profileSuccess, setProfileSuccess] = useState(false);
  // Bumped only after a successful save (below) to force MemberForm to fully
  // unmount/remount - react-hook-form's dirtyFields is computed against
  // mount-time defaultValues and nothing else resets it, so without this a
  // member who edits their address, saves, then edits their base-data mobile
  // field and saves again (same page visit, form never unmounted) would
  // still resubmit the untouched `addresses` array on the second save,
  // re-triggering the backend's syncUserMobile overwrite - see
  // AccountPage.test.tsx's "second save in the same session" regression.
  const [formKey, setFormKey] = useState(0);
  const uuid = user?.uuid ?? '';
  const { data: member, isLoading } = useMember(uuid);
  const { mutate, isPending, error } = useUpdateMember(uuid);

  if (!user || isLoading || !member) return null;

  const defaultValues: MemberInput = {
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

  return (
    <Paper sx={{ p: 3, maxWidth: 480, mb: 3 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('account.profileHeader')}</Typography>
      {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{t('account.profileSuccess')}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(error)}</Alert>}
      <MemberForm
        key={formKey}
        defaultValues={defaultValues}
        editableFields={member.editable_fields}
        submitting={isPending}
        onSubmit={(values) => {
          setProfileSuccess(false);
          mutate(values, {
            onSuccess: (updated) => {
              // Seed the cache synchronously with the PATCH response before
              // remounting - useUpdateMember's own onSuccess only fires an
              // async invalidateQueries, which wouldn't have landed yet by
              // the time the remount below reads `member` for its fresh
              // defaultValues. Without this, the remounted form would
              // briefly (or, since the key wouldn't bump again on the
              // later refetch, permanently) show the pre-save values -
              // the user's just-saved edit appearing to revert.
              queryClient.setQueryData(['members', uuid], updated);
              setProfileSuccess(true);
              setFormKey((k) => k + 1);
            },
          });
        }}
      />
    </Paper>
  );
}

function BirthdayCalendarConsentSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { mutate, isPending } = useUpdateBirthdayCalendarConsent();

  if (!user?.birthday_calendar_consent_requested) return null;

  return (
    <Paper sx={{ p: 3, maxWidth: 480, mb: 3 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('account.birthdayCalendarHeader')}</Typography>
      <FormControlLabel
        control={(
          <Switch
            checked={user.birthday_calendar_consent}
            disabled={isPending}
            onChange={(e) => mutate(e.target.checked)}
          />
        )}
        label={t('account.birthdayCalendarConsent')}
      />
    </Paper>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const { mutate, isPending, error } = useUpdatePassword();
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    setSuccess(false);
    mutate(values, {
      onSuccess: () => { setSuccess(true); reset(); },
    });
  });

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('account.title')}</Typography>
      <Box sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gridTemplateAreas: { xs: '"profile" "mfa" "birthday" "password"', md: '"profile mfa" "birthday mfa" "password mfa"' },
      }}
      >
        <Box sx={{ gridArea: 'profile' }}>
          <ProfileSection />
        </Box>
        <Box sx={{ gridArea: 'mfa' }}>
          <MfaAccountSection />
        </Box>
        <Box sx={{ gridArea: 'birthday' }}>
          <BirthdayCalendarConsentSection />
        </Box>
        <Box sx={{ gridArea: 'password' }}>
          <Paper sx={{ p: 3, maxWidth: 420 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>{t('account.changePassword')}</Typography>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{t('account.success')}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(error)}</Alert>}
            <form onSubmit={onSubmit} noValidate>
              <TextField {...register('current_password')} label={t('account.currentPassword')} type="password" fullWidth margin="normal"
                error={!!formState.errors.current_password} autoComplete="current-password" />
              <TextField {...register('new_password')} label={t('account.newPassword')} type="password" fullWidth margin="normal"
                error={!!formState.errors.new_password}
                helperText={formState.errors.new_password ? t('account.passwordTooShort') : undefined}
                autoComplete="new-password" />
              <TextField {...register('new_password_confirmation')} label={t('account.newPasswordConfirmation')} type="password" fullWidth margin="normal"
                error={!!formState.errors.new_password_confirmation}
                helperText={formState.errors.new_password_confirmation ? t('account.passwordMismatch') : undefined}
                autoComplete="new-password" />
              <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={isPending}>{t('account.save')}</Button>
            </form>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
