import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { prisma } from './db.js';
import { apiErrorHandler } from './lib/errors.js';
import { createContractValidationMiddleware } from './middleware/contractValidation.js';
import academicTitlesRouter from './routes/academicTitles.js';
import announcementsRouter from './routes/announcements.js';
import appConfigRouter from './routes/appConfig.js';
import attachedFilesRouter from './routes/attachedFiles.js';
import categoriesRouter from './routes/categories.js';
import directoriesRouter from './routes/directories.js';
import districtsRouter from './routes/districts.js';
import eventsRouter from './routes/events.js';
import externalEventIcsSourcesRouter from './routes/externalEventIcsSources.js';
import externalEventsRouter from './routes/externalEvents.js';
import lodgesRouter from './routes/lodges.js';
import logoRouter from './routes/logo.js';
import meRouter from './routes/me.js';
import membersRouter from './routes/members.js';
import mfaRouter from './routes/mfa.js';
import mfaChallengeRouter from './routes/mfaChallenge.js';
import officersRouter from './routes/officers.js';
import passwordResetRouter from './routes/passwordReset.js';
import publicRouter from './routes/public.js';
import rolesRouter from './routes/roles.js';
import { seekersRouter } from './routes/seekers.js';
import sessionRouter from './routes/session.js';
import statisticsRouter from './routes/statistics.js';

export const app = express();

// Exactly three reverse-proxy hops in production: the host's
// TLS-terminating nginx forwards everything to the always-on `edge` reverse
// proxy, which forwards to the app container's own nginx (see
// app/nginx.conf and CLAUDE.md), whose own nginx then proxies /api on to
// this container - see infra/docker-compose.production.yml's topology.
// `3` trusts exactly those three hops' X-Forwarded-For entries for req.ip -
// NOT `true`, which would trust an arbitrary number of hops and let a
// client spoof its own IP by sending its own X-Forwarded-For header. All
// three hops must append (`proxy_set_header X-Forwarded-For
// $proxy_add_x_forwarded_for`), not replace, that header - if any hop is
// misconfigured or a stray proxy is added/removed from the chain, this
// number must move with it. Without a correct count, Express's req.ip
// resolution either falls back to a proxy's own socket address (collapsing
// express-rate-limit's per-IP login throttle,
// api/src/middleware/rateLimit.ts's loginRateLimiter, into one shared bucket
// for every real client) or resolves to the wrong hop's address entirely -
// see test/app.integration.test.ts's "trust proxy" describe block.
app.set('trust proxy', 3);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Liveness/readiness probe for Docker healthchecks and monitoring - mirrors
// rails-app/app/controllers/health_controller.rb's exact behavior (a trivial
// DB round-trip; 200 "ok" on success, 503 "db unavailable" on failure).
// Deliberately distinct from GET /api/v1/health below: this one is
// unauthenticated *and* checks DB connectivity, for container healthchecks;
// that one is unauthenticated but DB-independent, for deploy-hash
// verification only. Don't merge them.
app.get('/healthz', (_req, res) => {
  prisma
    .$queryRaw`SELECT 1`
    .then(() => {
      res.status(200).send('ok');
    })
    .catch(() => {
      res.status(503).send('db unavailable');
    });
});

// Unauthenticated; mirrors the Rails Api::V1::HealthController contract
// used by the deploy smoke test.
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', revision: process.env.GIT_HASH ?? null, demo: process.env.DEMO_MODE === 'true' });
});

// Contract validation against openapi/openapi.yaml for the whole /api/v1
// surface, mirroring the Rails suite's pervasive assert_response_schema_confirm
// pattern. attached_files' /download endpoint and public workingplan.pdf return
// raw binary (not JSON), so they're excluded from *response* validation only -
// requests to them are still request-validated normally.
app.use(
  '/api/v1',
  createContractValidationMiddleware({
    excludeResponseValidationPaths: [/\/attached_files\/[^/]+\/download$/, /\/public\/workingplan\.pdf$/],
  }),
);

// Each router below applies its own auth (authenticateApiUser) internally
// where the ported Rails controller requires it - session.ts and public.ts
// deliberately don't (both `skip_before_action :authenticate_api_user!` in
// Rails), so nothing extra is applied here at the mount level.
// session.ts and me.ts define their own full path segments internally
// (`/session`, `/session/refresh`, `/me`, `/me/password`, ...) rather than
// being written as sub-routers of a `/session` or `/me` base - they're meant
// to be mounted at bare `/api/v1`, matching how each router's own test file
// mounts it (see test/routes/session.test.ts, test/routes/me.test.ts) and
// matching openapi/openapi.yaml's literal paths. Mounting them at
// `/api/v1/session` / `/api/v1/me` instead would double up the segment
// (`/api/v1/session/session`, `/api/v1/me/me/password`, ...) and 404 every
// real request.
//
// This table is the single source of truth for the app's routable surface -
// both for actually mounting the routers below AND for
// test/routing/routableSurface.test.ts's regression-guard snapshot (port of
// rails-app/spec/routing/routable_surface_spec.rb's intent: any future route
// addition/removal must touch this list consciously, never as a silent side
// effect of an unrelated change). `name` is a stable label for the snapshot,
// not a runtime identifier - it doesn't need to match the router's file name.
export const ROUTE_MOUNTS: ReadonlyArray<{ readonly name: string; readonly path: string; readonly router: express.Router }> = [
  { name: 'session', path: '/api/v1', router: sessionRouter },
  { name: 'me', path: '/api/v1', router: meRouter },
  { name: 'password_reset', path: '/api/v1', router: passwordResetRouter },
  { name: 'members', path: '/api/v1/members', router: membersRouter },
  { name: 'events', path: '/api/v1/events', router: eventsRouter },
  { name: 'external_events', path: '/api/v1/external_events', router: externalEventsRouter },
  { name: 'external_event_ics_sources', path: '/api/v1/external_event_ics_sources', router: externalEventIcsSourcesRouter },
  { name: 'seekers', path: '/api/v1/seekers', router: seekersRouter },
  { name: 'roles', path: '/api/v1/roles', router: rolesRouter },
  { name: 'categories', path: '/api/v1/categories', router: categoriesRouter },
  { name: 'directories', path: '/api/v1/directories', router: directoriesRouter },
  { name: 'attached_files', path: '/api/v1/attached_files', router: attachedFilesRouter },
  { name: 'districts', path: '/api/v1/districts', router: districtsRouter },
  { name: 'academic_titles', path: '/api/v1/academic_titles', router: academicTitlesRouter },
  { name: 'lodges', path: '/api/v1/lodges', router: lodgesRouter },
  { name: 'logo', path: '/api/v1/logo', router: logoRouter },
  { name: 'officers', path: '/api/v1/officers', router: officersRouter },
  { name: 'announcements', path: '/api/v1/announcements', router: announcementsRouter },
  { name: 'statistics', path: '/api/v1/statistics', router: statisticsRouter },
  { name: 'public', path: '/api/v1/public', router: publicRouter },
  { name: 'app_config', path: '/api/v1/app_config', router: appConfigRouter },
  // mfa_challenge MUST be registered before mfa: mfa's own router.use(authenticateApiUser)
  // matches every sub-path under /api/v1/mfa (including /api/v1/mfa/challenge/*), and
  // authenticateApiUser deliberately rejects (401, no next()) any mfa_pending token - the
  // exact token type every real /mfa/challenge/* request carries. If 'mfa' were registered
  // first, Express would hand every /mfa/challenge/* request to mfa's blanket auth gate
  // first and it would never reach mfaChallenge.ts's own requireMfaPendingToken middleware.
  { name: 'mfa_challenge', path: '/api/v1/mfa/challenge', router: mfaChallengeRouter },
  { name: 'mfa', path: '/api/v1/mfa', router: mfaRouter },
];

// The two bare-path routes registered directly above (not via ROUTE_MOUNTS) -
// listed here too so the routing-guard snapshot covers the app's ENTIRE
// routable surface, not just the router-mounted part.
export const BARE_ROUTES: ReadonlyArray<{ readonly method: string; readonly path: string }> = [
  { method: 'GET', path: '/healthz' },
  { method: 'GET', path: '/api/v1/health' },
];

for (const { path, router } of ROUTE_MOUNTS) {
  app.use(path, router);
}

// Mount last: converts thrown ApiError instances into the {error, detail?}
// JSON shape BaseController's rescue_from blocks produce in Rails.
app.use(apiErrorHandler);
