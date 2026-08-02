import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

import { appConfig } from './appConfig.js';

const RP_NAME = 'Logenhelfer';

export interface RelyingPartyConfig {
  rpID: string;
  rpName: string;
  origin: string;
}

/** RP ID is this environment's own configured domain (AppConfig[:domain]) - matches WebAuthn's requirement that rpID equals (or is a registrable suffix of) the page's origin hostname, and keeps passkeys correctly scoped per environment (prod/next/beta/dev never share credentials). */
export async function getRelyingPartyConfig(): Promise<RelyingPartyConfig> {
  const domain = (await appConfig.get('domain')) as string | null;
  const rpID = domain ?? 'localhost';
  return { rpID, rpName: RP_NAME, origin: `https://${rpID}` };
}

export async function buildRegistrationOptions(params: { userId: number; email: string; existingCredentialIds: string[] }) {
  const { rpID, rpName } = await getRelyingPartyConfig();
  return generateRegistrationOptions({
    rpID,
    rpName,
    userID: new TextEncoder().encode(String(params.userId)),
    userName: params.email,
    attestationType: 'none',
    excludeCredentials: params.existingCredentialIds.map((id) => ({ id })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
}

export async function verifyRegistration(response: RegistrationResponseJSON, expectedChallenge: string) {
  const { rpID, origin } = await getRelyingPartyConfig();
  return verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID });
}

export async function buildAuthenticationOptions(params: { allowCredentialIds: string[] }) {
  const { rpID } = await getRelyingPartyConfig();
  return generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: params.allowCredentialIds.map((id) => ({ id })),
  });
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: { id: string; publicKey: Uint8Array<ArrayBuffer>; counter: number },
) {
  const { rpID, origin } = await getRelyingPartyConfig();
  return verifyAuthenticationResponse({ response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, credential });
}
