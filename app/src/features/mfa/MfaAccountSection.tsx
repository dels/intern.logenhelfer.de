import { useState } from 'react';
import { Box, Button, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MfaSetupWizard from './MfaSetupWizard';
import BackupCodesDisplay from './BackupCodesDisplay';
import MfaProofDialog from './MfaProofDialog';
import { useToast } from '../../notifications/useToast';
import { formatDate } from '../../utils/formatDate';
import { useMfaStatus, useMfaPasskeyCredentials, useRegenerateBackupCodes, useTrustedDevices, useRevokeTrustedDevice } from './api';
import type { MfaSetupProof } from './api';

function BackupCodesSection() {
  const { t } = useTranslation();
  const toast = useToast();
  const regenerate = useRegenerateBackupCodes();
  const status = useMfaStatus();
  const passkeys = useMfaPasskeyCredentials({ enabled: true });
  const [proofOpen, setProofOpen] = useState(false);

  const availableProofMethods = [
    ...(status.data?.methods.includes('totp') ? (['totp'] as const) : []),
    ...((passkeys.data?.credentials.length ?? 0) > 0 ? (['passkey'] as const) : []),
    'backup_code' as const,
  ];

  async function handleConfirmProof(proof: MfaSetupProof) {
    setProofOpen(false);
    try {
      await regenerate.mutateAsync(proof);
    } catch (err) {
      toast.error(t('mfa.security.proofFailed'));
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 480, mb: 3 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('mfa.security.backupCodesHeader')}</Typography>
      {regenerate.data ? (
        <BackupCodesDisplay codes={regenerate.data.backup_codes} />
      ) : (
        <Button variant="outlined" onClick={() => setProofOpen(true)}>{t('mfa.security.regenerateBackupCodes')}</Button>
      )}
      <MfaProofDialog open={proofOpen} onClose={() => setProofOpen(false)} onSubmit={handleConfirmProof} availableMethods={availableProofMethods} />
    </Paper>
  );
}

function TrustedDevicesSection() {
  const { t, i18n } = useTranslation();
  const { data } = useTrustedDevices();
  const revoke = useRevokeTrustedDevice();

  return (
    <Paper sx={{ p: 3, maxWidth: 480 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('mfa.security.trustedDevicesHeader')}</Typography>
      {data && data.devices.length === 0 && <Typography>{t('mfa.security.noTrustedDevices')}</Typography>}
      <List dense>
        {(data?.devices ?? []).map((device) => (
          <ListItem key={device.id} secondaryAction={
            <Button size="small" onClick={() => revoke.mutate(device.id)}>{t('mfa.security.revoke')}</Button>
          }>
            <ListItemText
              primary={device.user_agent ?? t('mfa.security.unknownDevice')}
              secondary={formatDate(device.expires_at, i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default function MfaAccountSection() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 2 }}>{t('mfa.security.title')}</Typography>
      <Paper sx={{ p: 3, maxWidth: 480, mb: 3 }}>
        <MfaSetupWizard mode="manage" />
      </Paper>
      <BackupCodesSection />
      <TrustedDevicesSection />
    </Box>
  );
}
