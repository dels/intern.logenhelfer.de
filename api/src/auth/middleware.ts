import type { NextFunction, Request, Response } from 'express';

import type { users } from '../generated/prisma/client.js';

import type { AppAbility } from '../authz/ability.js';
import { buildAbility, loadUserRoleNames } from '../authz/ability.js';
import { prisma } from '../db.js';
import { isMfaSetupRequiredFor } from '../lib/mfaStatus.js';
import { verifyAccessToken } from './jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's own augmentation pattern.
  namespace Express {
    interface Request {
      currentUser?: users;
      // Port of BaseController#ability / rails-app/app/models/ability.rb -
      // see authenticateApiUser below for where this gets attached.
      ability?: AppAbility;
      // Set only when the presented access token carries an `act` claim
      // (i.e. it was issued by the impersonate route, not a normal login) -
      // the impersonating admin's user id. Security fix: lets route handlers
      // (see me.ts's gdpr_acceptance/password/announcement_subscription
      // handlers) refuse to attribute a change to the impersonated user
      // while an admin is driving the session, instead of it looking like a
      // real, uncoerced action by that user.
      impersonatorId?: number;
    }
  }
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Port of BaseController#authenticate_api_user! - parses the Authorization
 * header, verifies the access token, and loads the current user. Any failure
 * (missing header, bad token, unknown user) responds 401 {error:'unauthorized'},
 * matching Rails rescuing AccessToken::Invalid / ActiveRecord::RecordNotFound.
 */
export async function authenticateApiUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new Error('missing or malformed Authorization header');
    }

    const token = header.slice(BEARER_PREFIX.length);
    const payload = verifyAccessToken(token);

    if (payload.mfa_pending === true) {
      throw new Error('mfa_pending token cannot access this route');
    }

    const user = await prisma.users.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new Error('user not found');
    }

    const roleNames = await loadUserRoleNames(user.id);

    req.currentUser = user;
    req.ability = buildAbility(user, roleNames);
    if (typeof payload.act === 'number') {
      req.impersonatorId = payload.act;
    }

    // Mandatory MFA, grace period over (or never started), nothing enrolled -
    // hard-block every route except the setup wizard's own API surface and a
    // read of /me (so the frontend can see the flag and redirect) until
    // enrollment completes. This is the server-side half of the enforcement
    // - see RequireAuth.tsx for the client-side redirect, which alone was
    // found insufficient by a 2026-07-31 security review (a password-only
    // login must not be able to reach any other route just by holding a
    // valid access token). Computed live on every request rather than baked
    // into the JWT at issuance, so it self-heals the instant enrollment
    // completes instead of staying stuck until the token's next refresh.
    // Skipped while impersonating - reflects the *impersonated target's*
    // MFA state, not the admin's own, same rationale as RequireAuth.tsx.
    if (req.impersonatorId === undefined && (await isMfaSetupRequiredFor(user.id))) {
      const urlPath = req.originalUrl.split('?')[0] ?? req.originalUrl;
      const isSetupRoute = urlPath.startsWith('/api/v1/mfa/');
      const isMeRead = req.method === 'GET' && urlPath === '/api/v1/me';
      if (!isSetupRoute && !isMeRead) {
        res.status(403).json({ error: 'mfa_setup_required' });
        return;
      }
    }

    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
