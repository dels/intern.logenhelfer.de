import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { apiFetch } from '../../api/client';

export interface MfaMethodsList {
  methods: Array<'totp' | 'email' | 'passkey'>;
  mode: 'optional' | 'mandatory';
  grace_period_ends_at: string | null;
}
export interface MfaSetupStartResult {
  otpauth_uri?: string;
  qr_code_data_url?: string;
}
export interface MfaSetupVerifyResult {
  backup_codes: string[];
}
export interface MfaTrustedDevice {
  id: number;
  user_agent: string | null;
  last_ip: string | null;
  created_at: string;
  expires_at: string;
}
export interface MfaPasskeyCredential {
  credential_id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

// Proof of control of an already-verified MFA method. Required by the backend
// (POST /api/v1/mfa/setup/start, see api/src/routes/mfa.ts) only when the caller
// already has a verified `totp`/`passkey` method and is starting setup of another
// one - otherwise the backend returns 422. Note this uses a different method enum
// than the top-level `method` being set up (it names *how the existing method was
// proven*, e.g. a backup code).
export type MfaSetupProof =
  | { method: 'totp' | 'backup_code'; code: string }
  | { method: 'passkey'; response: AuthenticationResponseJSON };

export function useMfaStatus(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: ['mfa-status'], queryFn: () => apiFetch<MfaMethodsList>('/api/v1/mfa/status'), enabled: options?.enabled });
}

export function useStartMfaSetup() {
  return useMutation({
    mutationFn: ({ method, proof }: { method: 'totp' | 'email' | 'passkey'; proof?: MfaSetupProof }) =>
      apiFetch<MfaSetupStartResult>('/api/v1/mfa/setup/start', { method: 'POST', body: JSON.stringify({ method, ...(proof ? { proof } : {}) }) }),
  });
}

export function useVerifyTotpSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiFetch<MfaSetupVerifyResult>('/api/v1/mfa/setup/totp/verify', { method: 'POST', body: JSON.stringify({ code }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mfa-status'] }),
  });
}

export function useVerifyEmailSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiFetch<MfaSetupVerifyResult>('/api/v1/mfa/setup/email/verify', { method: 'POST', body: JSON.stringify({ code }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mfa-status'] }),
  });
}

export function useVerifyPasskeySetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { response: RegistrationResponseJSON; name?: string }) =>
      apiFetch<MfaSetupVerifyResult>('/api/v1/mfa/setup/passkey/verify', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      // 'mfa-passkeys' is the query manage-mode's methods list reads for
      // passkey credentials (see MfaSetupWizard.tsx) - without this, a newly
      // added passkey wouldn't appear there until an unrelated refetch.
      queryClient.invalidateQueries({ queryKey: ['mfa-passkeys'] });
    },
  });
}

export function useMfaProofPasskeyOptions() {
  return useMutation({
    mutationFn: () => apiFetch<PublicKeyCredentialRequestOptionsJSON>('/api/v1/mfa/proof/passkey/options', { method: 'POST' }),
  });
}

export function useMfaPasskeyCredentials(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mfa-passkeys'],
    queryFn: () => apiFetch<{ credentials: MfaPasskeyCredential[] }>('/api/v1/mfa/passkeys'),
    enabled: options?.enabled,
  });
}

export function useRemoveMfaMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, proof }: { type: 'totp' | 'email'; proof: MfaSetupProof }) =>
      apiFetch<void>(`/api/v1/mfa/methods/${type}`, { method: 'DELETE', body: JSON.stringify({ proof }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mfa-status'] }),
  });
}

export function useRemoveMfaPasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ credentialId, proof }: { credentialId: string; proof: MfaSetupProof }) =>
      apiFetch<void>(`/api/v1/mfa/methods/passkey/${credentialId}`, { method: 'DELETE', body: JSON.stringify({ proof }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      queryClient.invalidateQueries({ queryKey: ['mfa-passkeys'] });
    },
  });
}

export function useRegenerateBackupCodes() {
  return useMutation({
    // POST /mfa/backup-codes/regenerate's request body is `{ method, code }`
    // flat (see openapi.yaml + api/src/routes/mfa.ts, which passes `req.body`
    // itself straight into verifyExistingMfaProof) - unlike
    // useRemoveMfaMethod/useRemoveMfaPasskey above, which nest their proof
    // under a `proof` key. Forwarding `proof` unwrapped here matches this
    // endpoint's actual contract instead of copying the other two routes'
    // shape.
    mutationFn: (proof: MfaSetupProof) =>
      apiFetch<MfaSetupVerifyResult>('/api/v1/mfa/backup-codes/regenerate', { method: 'POST', body: JSON.stringify(proof) }),
  });
}

export function useTrustedDevices() {
  return useQuery({ queryKey: ['mfa-trusted-devices'], queryFn: () => apiFetch<{ devices: MfaTrustedDevice[] }>('/api/v1/mfa/trusted-devices') });
}

export function useRevokeTrustedDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/v1/mfa/trusted-devices/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mfa-trusted-devices'] }),
  });
}
