let accessToken: string | null = null;
let impersonatingAdminToken: string | null = null;
let onEndedListener: (() => void) | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string | null) => { accessToken = t; };

export const isImpersonating = () => impersonatingAdminToken !== null;

export const startImpersonation = (targetToken: string) => {
  impersonatingAdminToken = accessToken;
  accessToken = targetToken;
};

export const stopImpersonation = () => {
  accessToken = impersonatingAdminToken;
  impersonatingAdminToken = null;
};

export const onImpersonationEnded = (fn: (() => void) | null) => { onEndedListener = fn; };

export const notifyImpersonationEnded = () => onEndedListener?.();
