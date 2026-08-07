# intern.logenhelfer.de

Member-management system for a Freemason lodge: lodges, districts,
officers, events, external events (with ICS import), files ordered by
categories and directories,announcements, and a public calendar.
TypeScript/Express/Prisma
API (`api/`) + React 19/Vite/TypeScript frontend (`app/`).

Login supports optional or mandatory multi-factor authentication (TOTP
authenticator apps, email codes, or passkeys — passkeys can also replace the
password entirely), configurable per environment under Settings → Sicherheit.
`MFA_ENCRYPTION_KEY` (used to encrypt stored TOTP secrets) is one of the
secrets `bin/init-env` auto-generates for a fresh environment, alongside the
others mentioned below.

## Local development

```
cp .env.example .env        # fill in POSTGRES_PASSWORD etc.
./bin/compose up            # postgres + api (pure docker-compose wrapper, no build/gate)
cd app && pnpm dev
```

## Testing

`./bin/test-gate` runs the full suite against an ephemeral, isolated stack
(never touches a real deploy target): `app` lint/typecheck/unit tests/build,
`api` typecheck/unit tests, Playwright e2e. This runs automatically before
every `bin/deploy-to` deploy (see below) and can be run standalone at any
time. `bin/compose` never runs it — it's a pure docker-compose wrapper.

## Deployment

Each environment is a separate Docker Compose project on the same host,
distinguished by `.env.<name>` and named `logenhelfer-<name>` so
containers/networks never collide (this project-name prefix is the product
name "Logenhelfer" and is unrelated to the container naming below). `next` is
the active preview environment today; `prod` is the live site (this lodge's
production environment — the first of what may eventually be one per lodge).

`<env>` is any name matching `^[a-z0-9-]+$` with a local `.env.<env>` file —
there is no fixed list of allowed names; this project runs one environment
per lodge. Adding a new one is: a one-time manual `git clone` of this repo's
own origin remote into a fresh directory on its deploy host, `bin/init-env
<name>` locally to scaffold `.env.<name>` (auto-generates secrets, prompts
for the rest), then
`bin/deploy-to <name>`. Before that first deploy, the Postgres role and
database named in the generated `DB_URL` (defaults: role/database both
`logenhelfer_<name>`) must already exist on `DB_HOST` — `bin/deploy-to`'s
migration step assumes they're there and fails otherwise. `bin/init-env`
prints the exact `CREATE ROLE`/`CREATE DATABASE` SQL for this, using the
password it just generated — run it on `DB_HOST` as a Postgres superuser
before the first deploy.

Outbound mail (login notifications, password reset, MFA email codes,
announcements) optionally goes through a Redis-backed queue instead of
sending synchronously. Like Postgres, Redis is one shared instance across
environments, human-provisioned outside any environment's compose file —
there's no `redis` container in this repo. Referenced via 5 env vars
(`REDIS_PROTOCOL`/`REDIS_USERNAME`/`REDIS_PASSWORD`/`REDIS_HOST`/
`REDIS_PORT`, see `.env.example`); leaving them unset (the default for local
dev/test and any not-yet-wired environment) sends mail synchronously with no
Redis needed. Once Redis is configured for an environment, `DEPLOY_NAME` is
also required, so that environment's jobs get their own isolated queue name
on the shared Redis instance. The queue's consumer runs in-process inside
the `api` container (`api/src/lib/mailWorker.ts`), not a separate container.

Three containers per environment: `edge` (a stock `nginx:1.27-alpine`
reverse proxy, always on, the sole container publishing a host port), `app`
(static SPA, served by nginx — built from the `app/` source folder), `api`
(the TypeScript/Express API, built from `api/`). Compose files live in
`./infra/`. The host's reverse-proxy nginx forwards *everything* for an
environment's hostname to the `edge` container's upstream (defined in
`/etc/nginx/conf.d/clusters.conf` on the deploy host — a manual, one-time
edit per new environment, not part of any automated deploy step; see
`infra/host-nginx-reference/` for a checked-in reference snippet of the
exact server-block edit needed). `edge` is a dumb, total-passthrough proxy
in front of whichever `app`/`api` pair is currently active (see the
blue/green mechanism below); the `app` container's own nginx
(`app/nginx.conf.template`) then splits traffic internally, proxying
`/api/` on to its own paired `api` container over the Docker Compose
network and serving everything else as the static SPA. This keeps the
API/app split as an implementation detail of this repo instead of something
every environment's host-nginx config has to know about.

### When the deploy host isn't the TLS-terminating host

The topology above assumes the Docker host and the TLS-terminating host
nginx are the same machine, reachable via `127.0.0.1` — that's no longer
always true, since some environments' deploy host now differs from wherever
TLS termination happens. The recommended fix is a WireGuard tunnel between
the two hosts, not TLS/mTLS between the two nginxes and not a persistent SSH
tunnel:

- mTLS on `edge`'s own nginx would add cert issuance/rotation to a repo that
  manages zero certs anywhere today — a permanent new maintenance burden for
  what is a reachability problem, not an authentication problem (host nginx
  is already the trust boundary).
- A persistent SSH tunnel (autossh-style) works but means babysitting a
  bespoke long-running process for permanent production traffic, not just a
  deploy-time action.
- WireGuard is a kernel feature on any modern Linux host, config is a
  handful of lines, and it survives reboots like any other network
  interface — no separate process supervision needed.

Once the tunnel exists, two manual, host-level edits change — never bundled
into `bin/deploy-to`, same as every other host-nginx change in this project:
the deploy host's `APP_LISTEN_IP` (see `.env.example`) gets set to that
host's WireGuard interface address instead of `127.0.0.1`, and the TLS
host's `sites-available/<host>` / `clusters.conf` upstream gets pointed at
that same WireGuard IP instead of `127.0.0.1`. See
`docs/wireguard-tunnel-setup.md` for the step-by-step setup.

### `bin/deploy-to <env> [branch] [--omit-tests] [--auto-push] [--remote] [--cpus <n>]`

One command deploys everything — no manual frontend build/copy step, and
(after each environment's one-time first deploy under this mechanism) zero
downtime:

1. Pre-flight: aborts on uncommitted changes; offers to push unpushed commits.
2. Runs `./bin/test-gate` (skippable with `--omit-tests`) — locally, unless
   `--remote` is passed, in which case it's deferred to step 3, right after
   checkout and before the image build, so it runs on the deploy host itself
   against the exact commit that's about to be built (see `--remote` note
   below).
3. SSHes to the target host, builds new `app`/`api` images (with a
   `GIT_HASH` build-arg baked in), and starts them as the currently-inactive
   **blue/green slot** (`app-<env>-blue`/`-green`, `api-<env>-blue`/`-green`
   — whichever isn't live right now; `bin/deploy-to` determines this by
   reading `edge`'s own running nginx config, not any stored state).
4. Verifies the new slot entirely via `docker exec ... wget` straight into
   the containers themselves — no published port needed for this, not even
   temporarily — before anything is swapped; aborts (nothing touched yet) if
   either hash never matches within the timeout.
5. Only once the new slot verifies healthy: runs Prisma migrations against
   the shared DB, then atomically cuts `edge` over to the new slot by
   re-rendering its nginx config and issuing `nginx -s reload` (no
   container restart, so no dropped connections) — then re-verifies both
   hashes live through `edge`'s port, retires the old slot, and prunes old
   images.
6. If anything fails after the cutover begins, a rollback trap warm-reloads
   `edge` straight back to the previous slot (left running, not torn down,
   until the new slot was confirmed live) — the site is never left serving
   a half-deployed state. An environment's very first deploy under this
   mechanism is a one-time exception: the old bare-named containers from
   before `edge` existed have to be stopped to free the host port, so that
   single deploy is not zero-downtime — every deploy after it is.

This mirrors the deploy mechanism used by the sibling `sibling-project.example`
project, adapted for this repo's three-container (`edge` + `app` + `api`)
blue/green topology instead of a single combined container, and reusing
this repo's existing `bin/test-gate` instead of separate lint/test
invocations. See `CLAUDE.md` for the mechanics of slot discovery, the
`edge` reload, and rollback ordering — this section deliberately stays
high-level.

`--remote` moves all of `bin/test-gate`'s work — the throwaway Node/Playwright
containers, the ephemeral Postgres, every lint/typecheck/unit/e2e run — off
your machine and into the *same* SSH session already used for the image
build/slot-verification steps, on the environment's existing deploy host. No new host or
`.env` config is needed: it reuses the `${ENV}_HOST`/`_USER`/`_PATH`/
`_SSH_PORT` already resolved for that environment. The gate's ephemeral
`logenhelfer-gate` Compose project has its own name/network/ports, so it
doesn't collide with that host's already-running `logenhelfer-<env>` site —
it just competes for the same CPU/disk while it runs, the same tradeoff the
image build step already makes — `bin/test-gate`'s own containers default to
a 4-CPU cap (`GATE_CPUS`) for this reason, overridable with `--cpus <n>`.

`bin/deploy-to` reads its target-environment config (host/user/path/ports —
distinct from `.env.<name>`, which already holds runtime secrets on the
deploy host) from the same local `.env` used for dev config — see
`.env.example`'s "Deploy orchestration" section; it is gitignored and never
leaves your machine. `.env.example` also documents, for reference only, what
belongs in a freshly-bootstrapped environment's own `.env.<name>` on the host
(DB/rate-limit/mail config) — see its "Per-environment runtime config
REFERENCE ONLY" section.

See `CLAUDE.md` for operational notes when working on this deploy mechanism.
