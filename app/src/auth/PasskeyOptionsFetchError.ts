// Thrown by AuthProvider's loginWithPasskey specifically when the
// options-fetch (step 1) fails, so callers can distinguish "the
// browser-driven autofill options request failed in the background" from
// other failure points in the same flow (see LoginPage.tsx's
// attemptPasskeyLogin, which only swallows this for the autofill path - the
// explicit button still surfaces it). Split into its own file (not exported
// from AuthProvider.tsx) so that file only exports components, keeping Fast
// Refresh working there.
export class PasskeyOptionsFetchError extends Error {}
