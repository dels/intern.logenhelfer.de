# CLAUDE.md

Operational notes for working on this repo. See `README.md` for the project
overview and deployment mechanism.

## Deploy mechanism (`bin/deploy-to`)

This project deploys via persistent blue/green container slots — verified
before cutover entirely via `docker exec`, never a published smoke port —
with an atomic edge-reload swap and a warm-reload rollback. Compose files
live in `./infra/` (`infra/docker-compose.yml` for dev,
`infra/docker-compose.production.yml` for every named environment). Full
design: see `README.md`'s Deployment section — don't duplicate that
description here, keep this file to things a Claude session needs to *act*
correctly.

Key facts to hold onto while working on or around this mechanism:

- Never change the .env file in the local main branch. always copy .env file to
  current worktree and edit the copy.
- When using a local postgres instance, you should create an own instance
  per worktree with a random port to avoid data pollution by another worktree.
  Remote the worktree specific postgres instance, when done or cleaning up the
  worktree.
- **`infra/docker-compose.production.yml` uses `image: ${CONTAINER_NAME}:${DEPLOY_TAG:-latest}`,
  not `build:`.** Building and running are separate steps (`docker compose
  build` tags an image; `docker compose up` runs whatever `DEPLOY_TAG` points
  at). This is what makes rollback possible — don't collapse it back to a
  plain `build:` directive, that silently breaks the rollback trap.
- **`GIT_HASH` is a build-arg**, threaded into both the `app` and
  `api` images at build time. `api/src/app.ts`'s `GET /api/v1/health`
  handler already reads it from `process.env.GIT_HASH` — if that ever starts
  returning `null` again, the build-arg wiring broke, not the handler.
- **Environment naming**: any name matching `^[a-z0-9-]+$` with a local
  `.env.<env>` file works — there is no fixed list. Local `.env.<env>` is
  the source of truth for that environment's runtime config and secrets,
  pushed to the deploy host via `scp` before every deploy (see
  `bin/deploy-to`'s "Push local .env.<env>" step). The remote copy is
  automatically backed up (3 generations kept, pruned automatically) before
  being overwritten; never hand-edit the remote copy directly, since the
  next deploy will overwrite it anyway.
- **Container naming**: whatever `.env.<env>`'s `API_CONTAINER_NAME`/
  `APP_CONTAINER_NAME` actually say — `bin/deploy-to` reads these values
  directly from `.env.<env>` on the deploy host (remotely, right after
  confirming the file exists) rather than assuming a fixed `api-<env>`/
  `app-<env>` convention. This matters because on a host shared by multiple
  environments/projects, two environments' container names can collide if
  they aren't checked explicitly — `bin/deploy-to` used to only check that
  the `*_CONTAINER_NAME` *keys* existed, never that their *values* were
  actually unique or matched the containers really running, which let a
  misconfigured environment silently query a container name that never
  existed (tag/inspect calls always saw "not running"/`missing`, healthchecks
  could never observe `healthy`, and every deploy attempt rolled back a
  perfectly good deploy). If a deploy behaves like this, verify
  `API_CONTAINER_NAME`/`APP_CONTAINER_NAME`'s *values* actually match the
  containers `docker ps` shows running before assuming host contention. The
  compose service key for the API is `api` and for the frontend is `app`,
  both matching their respective source folders (this part is fixed,
  independent of `.env.<env>`). There is no `worker` container: the TS API
  has no background job queue (see `api/src/routes/announcements.ts`'s
  `notifySubscribers` for the one email notification ported from Rails'
  mailers — sent inline, not queued). `bin/deploy-to` also reads
  `EDGE_CONTAINER_NAME` from `.env.<env>` the same way, hard-required just
  like `API_CONTAINER_NAME`/`APP_CONTAINER_NAME` — a bare shared default like
  `edge` is exactly the kind of value that collides across environments on a
  shared host, so this is required rather than optional-with-a-default.
  **The blue/green slot containers are never separately configured** —
  `bin/deploy-to` derives them at deploy time as
  `${API_CONTAINER_NAME}-blue`/`-green` and
  `${APP_CONTAINER_NAME}-blue`/`-green` by appending a slot suffix to
  whatever `.env.<env>` already says. Don't add a separate
  `*_BLUE_CONTAINER_NAME`-shaped var — the suffix-derivation is the whole
  point: it's what lets the same `.env.<env>` value keep meaning "this
  environment's API/app container family" across both slots without
  doubling the config surface.
- **`bin/init-env` defaults every new environment's `API_CONTAINER_NAME`/
  `APP_CONTAINER_NAME`/`EDGE_CONTAINER_NAME` to `logenhelfer-<purpose>-<env>`**
  so a new environment gets collision-safe names with zero admin effort, no
  more relying on a human to remember the prefix convention.
  `infra/docker-compose.production.yml`'s bare `api`/`app`/`edge` fallback
  literals match the same `logenhelfer-`-prefixed pattern for the same
  reason.
- **`bin/deploy-to` self-heals container-name drift on every deploy, via
  `docker rename` (metadata-only — the container keeps running, keeps its
  network identity, no restart, no dropped connections)**: right after
  reading the desired `EDGE_CONTAINER_NAME` from `.env.<env>`, if no
  container by that name exists yet, it looks for this project's live edge
  container by its compose labels (`com.docker.compose.project=
  logenhelfer-<env>` + `...service=edge`, which reliably survives
  renames/recreates) and renames it in place. This means a future
  `EDGE_CONTAINER_NAME` change in `.env.<env>` takes effect on the very next
  ordinary deploy, automatically, instead of silently going stale until a
  human remembers to `docker rename` by hand. Separately, `DB_USER`/database
  ownership convention is `logenhelfer_<name>`; some legacy environments may
  predate this convention and use weak/legacy role names — migrating those
  is a manual `ALTER ROLE ... RENAME`/`ALTER ROLE ... PASSWORD` a human runs
  on the Postgres host, coordinated with an immediate redeploy since the
  rename drops the live container's DB connection until it reconnects with
  the new credentials.
- **The host nginx only ever forwards a whole hostname to the `edge`
  container's published port — one `location /` block, no `/api/` split.**
  `edge` is the sole port owner; the `app`/`api` split happens *inside* this
  repo, in `app/nginx.conf.template`'s own `location /api/` block, which
  proxies to the `api` container over the project's Docker network. `edge`
  itself (`infra/edge/default.conf.template`) is a dumb, total-passthrough
  proxy with no knowledge of `/api/`, `/arbeitsplan.*`, or `/errors/` — all
  of that routing happens one hop further in, inside whichever
  `app-<env>-<slot>` container is currently active. **This chain is three
  hops deep: host nginx → edge → app's own nginx → api** —
  `api/src/app.ts`'s `trust proxy` is set to `3` to match (see
  `api/test/app.integration.test.ts`'s "trust proxy" describe block). If a
  hop is ever added/removed from this chain without updating that number,
  `req.ip` silently resolves to the wrong address — see `api/src/app.ts`'s
  own comment. The upstream hostname for `app/nginx.conf.template`'s
  `/api/` block is `${API_UPSTREAM_HOST}`, substituted at container start by
  the nginx image's own template mechanism — `api` (the compose service
  name) by default (`app/Dockerfile`'s `ENV API_UPSTREAM_HOST=api`), but
  each `app-<env>-<slot>` is started with
  `-e API_UPSTREAM_HOST=api-<env>-<slot>`, so that slot's own nginx always
  proxies `/api/` to its own slot's `api` container, never the other slot's.
  Don't edit `app/nginx.conf` — that filename no longer exists; edit the
  `.template` file. The host-nginx config on the deploy host is still a
  manual, one-time edit per environment, never touched by `bin/deploy-to`
  itself — there's a checked-in reference template for exactly that edit,
  `infra/host-nginx-reference/logenhelfer.location.conf.example`, which is
  **reference-only**, copied by hand, never read or applied by any script.
  If a new environment gets its first real deploy, the upstream + `location
  /` block must already exist and point at the `edge` container's port
  *before* the first `bin/deploy-to` run — otherwise the deploy will
  succeed but nginx will 502. **That `location /` block must still set
  `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` and
  `X-Forwarded-Proto`/`Host`/`X-Real-IP`** — every hop after it adds another
  hop on top of it, and the `trust proxy: 3` count above assumes exactly
  this one hop from host nginx plus the two after it.
- **Post-swap live-hash verification checks the api's hash through the
  `edge` container's port, not `app`'s** (`app` no longer publishes anything
  at all). `dc port edge 8080` → curl `/version.json` (app hash) then
  `/api/v1/health` (api hash, proxied through whichever slot is currently
  live) — going through the full edge → app → api chain is a strict
  superset of curling api directly, since it also proves the entire proxy
  path itself works, edge included. **Neither the `api` nor the `app`
  service publishes a host port at all** — `edge` is the only intended
  entry point from host nginx. **Never reintroduce `API_PORT`/a `ports:`
  block on either service** without first confirming no environment's host
  nginx has grown a direct port block again. If you need to hit api or a
  specific slot's app container directly for debugging, use `docker exec`
  or `dc run` (over the compose network), not a host port.
- **Never reload/edit host nginx as part of an automated deploy.** It's
  shared infrastructure across multiple projects/environments on the same
  host — always a human-confirmed, standalone action, never bundled into a
  script run non-interactively. The checked-in
  `infra/host-nginx-reference/logenhelfer.location.conf.example` doesn't
  change this rule — it's a reference template a human copies from by hand,
  never something any script reads or applies.
- **Same rule applies to `pg_hba.conf` on the shared Postgres host, not just
  host nginx.** It's shared across every environment's role/database on
  that server, so it's a human-confirmed, standalone edit only — never
  something `bin/deploy-to` or any other script touches.
  `infra/db-host-reference/pg_hba.hostssl.conf.example` is the
  reference-only diff for a `host`→`hostssl` migration, with the required
  safe ordering (add `?sslmode=require` to every environment's `DB_URL` and
  redeploy *first*, confirm via `pg_stat_ssl` that connections are actually
  using SSL, only *then* flip the specific `host` lines to `hostssl` —
  flipping first would reject every still-plaintext connection immediately,
  including other environments on the same server).
- **Persistent blue/green slots — verification happens entirely via
  `docker exec`, no published port anywhere any more.**
  `api-<env>-blue`/`-green` and `app-<env>-blue`/`-green` are long-lived
  containers (not torn down after each deploy) that `bin/deploy-to` creates
  with `dc run -d --name <container> ...` and then immediately applies
  `docker update --restart=unless-stopped` to — `docker compose run`
  doesn't apply a service's `restart:` policy to ad-hoc `run` instances the
  way `docker compose up` does, so without this extra step a host reboot
  would leave the slot containers stopped. Verifying the newly-built
  (inactive) slot before cutover is entirely `docker exec <slot-container>
  wget -qO- ...` straight into the container itself, so no host port needs
  to be published for either slot, not even temporarily. **Slot discovery
  has no persisted state**: `bin/deploy-to` never writes `.env.<env>`;
  instead, on every single deploy it reads which slot is *currently* live by
  inspecting `edge`'s own rendered nginx config directly (`docker exec
  edge-<env> ... grep -oE 'proxy_pass http://[a-zA-Z0-9_.-]+'
  /etc/nginx/conf.d/default.conf`) — the running config on disk inside the
  container IS the source of truth, every time, rather than a flag file or
  `.env` value that could drift from reality. The cutover itself is:
  regenerate `edge`'s rendered config file (`docker exec -e
  ACTIVE_APP_UPSTREAM=<new-slot-app-container> edge-<env> sh -c 'envsubst
  ... > /etc/nginx/conf.d/default.conf && nginx -s reload'`), then that's
  it — **never restart the `edge` container to swap**, that would drop its
  listening socket and reintroduce real downtime. The regenerate-then-reload
  two-step is load-bearing: `envsubst` only runs automatically at container
  *start* (via the nginx image's own template mechanism), so a bare `nginx
  -s reload` alone would just re-read the *same*, stale rendered file off
  disk — you have to re-render it yourself first, then reload. Rollback is
  now primarily a warm edge-reload back to the previous slot (the old
  slot's containers are deliberately left running, not torn down, until the
  new slot is verified live post-cutover) — strictly faster and more
  reliable than the old cold `DEPLOY_TAG=previous dc up -d` restart, which
  still exists as a secondary/deeper fallback. **The very first deploy to
  an already-running environment (pre-blue/green) is a distinct, one-time,
  NOT-zero-downtime transition**: the old bare-named `api-<env>`/`app-<env>`
  containers have to be stopped to free the host port before `edge` can
  bind it for the very first time. Every deploy after that one is
  zero-downtime. This is expected and by design, not a bug — don't try to
  eliminate it.
- **Reboot-ordering caveat (accepted, genuinely self-healing part):**
  `edge`'s `proxy_pass` target in `infra/edge/default.conf.template` is a
  plain hardcoded hostname, not resolved via nginx's `resolver` directive —
  it's only ever re-rendered and reloaded on a deliberate blue-green swap,
  so there's no per-request re-resolution trick here (unlike `app`'s own
  `/api/` block, see that template's own comment for why the simpler form
  is sufficient given how infrequently `edge`'s target changes). This means
  the hostname is resolved once, at nginx config-load time. If the whole
  deploy host reboots, Docker restarts every `restart: unless-stopped`
  container (`edge`, both `api-*` slots, both `app-*` slots) without
  guaranteeing start order — if `edge` happens to start before its
  *currently-correct* slot's `app` container is reachable, nginx fails its
  config-load DNS lookup and the `edge` container exits. This part really is
  self-healing: Docker's restart policy keeps retrying `edge` on backoff
  until the hostname resolves, typically within seconds once the `app`
  container catches up — a transient, reboot-only blip, not a deploy-time
  or steady-state issue. Not worth a `resolver` directive — that would trade
  a rare few-seconds reboot blip for permanent per-request DNS-resolution
  complexity on every single proxied request.
- **Stale-baked-`ACTIVE_APP_UPSTREAM` bug (was miscategorized as part of the
  reboot-ordering caveat above; actually NOT self-healing — fixed
  2026-08-10 after recurring on fwze and demo, both down simultaneously
  after a host reboot).** The confusion: a container *restart* (as opposed
  to a `docker compose` recreate) re-runs nginx's entrypoint envsubst using
  whatever was baked into `edge`'s `Config.Env` at its last
  creation/`--force-recreate` — never what a later zero-downtime swap
  (`docker exec` + `envsubst` + `nginx -s reload`, no recreate involved)
  actually pointed it at. A normal blue/green swap rewrites the *rendered
  file* only, so the container's own baked env goes stale the moment a
  single real swap has happened. Every restart after that — reboot,
  OOM-kill, a plain `docker restart`, an ad hoc recreate — re-derives from
  that stale value. If the old slot it names has since been torn down (the
  normal case a few deploys later), that's not a transient DNS race that
  clears in seconds; it's a permanent crash-loop, because the hostname will
  never resolve. This is what a bare `docker compose up --force-recreate
  edge` with no default was already loudly guarding against (the
  `ACTIVE_APP_UPSTREAM: ${ACTIVE_APP_UPSTREAM:?...}` requirement, added for
  the literal-`"app"` incident below) — but a *restart* never goes through
  `docker compose` interpolation at all, so that guard did nothing for it.
  **Fix:** `infra/edge/18-deploy-state.envsh` is bind-mounted into
  `edge` as a single **file** (deliberately not a directory — see the
  template-mount bullet below for why a directory mount at
  `/docker-entrypoint.d/` would shadow the image's own numbered scripts and
  break envsubst outright; the inode-pinning problem that bullet solves for
  doesn't apply here since this script only runs at container start, so an
  edit to it taking effect only on the next recreate is an acceptable, rare
  exception). It's an `.envsh` file, so the nginx entrypoint *sources* it
  (same mechanism as the image's own `15-local-resolvers.envsh`) before
  `20-envsubst-on-templates.sh` runs, and it re-derives both
  `ACTIVE_APP_UPSTREAM` and `NGINX_CLIENT_MAX_BODY_SIZE_MB` fresh, on every
  single start, from `./.deploy-state/active-app-slot` /
  `./.deploy-state/max-upload-mb` — a small directory-mounted (same
  rationale) deploy-host-local state dir that `bin/deploy-to` `mkdir -p`s
  early and writes into right after every live-verified cutover (same two
  values it already threads via `docker exec -e` into the swap itself, now
  also persisted to survive a restart). Guards on `[ -s FILE ]`, not
  `[ -f FILE ]` — a present-but-empty marker must not override the baked
  `${...:?}` value with an empty string, which would render
  `proxy_pass http://:8080;`, an invalid directive, i.e. a different,
  more confusing crash-loop. A brand-new environment's very first
  `docker compose up` (before any marker file exists yet) correctly falls
  back to the compose-level `${ACTIVE_APP_UPSTREAM:?...}` value, unchanged
  from before. The `.active-app-slot` marker file this superseded (moved to
  `.deploy-state/active-app-slot`, alongside the new
  `.deploy-state/max-upload-mb`) used to be described here as "purely
  advisory, not a new source of truth" — that's no longer accurate: it's
  now load-bearing at `edge`-container-*start* time, not just a human's
  manual-recovery aid. `bin/deploy-to`'s own current-state *discovery*
  (grep-ing `edge`'s live rendered config) is unchanged and still the real
  source of truth for what `bin/deploy-to` itself trusts.
  **Rollout/migration caveat:** a `volumes:` change doesn't retroactively
  affect an already-running container (same class of exception as the
  edge-template directory-mount migration below) — any environment
  deployed before this fix landed needs one manual, deliberate,
  NOT-zero-downtime `docker compose ... up -d --force-recreate edge` (same
  command as that migration) before its `edge` container actually picks up
  the new mounts and stops being vulnerable to this bug on its next
  restart. `bin/deploy-to` seeds `.deploy-state/active-app-slot` from the
  old bare `.active-app-slot` (if present and the new file doesn't exist
  yet) right after its `mkdir -p`, specifically so this recreate can happen
  in either order relative to that environment's next deploy — it no longer
  matters which comes first, `18-deploy-state.envsh` always has something
  correct to read on the recreate's first start either way.
  `bin/compose`'s own `ACTIVE_APP_UPSTREAM` fallback (used when `edge` is
  down and you need `logs`/`ps` to actually work) checks the same two paths
  in the same order for the same reason.
- **Adjacent footgun (same root cause, different trigger):** if something
  recreates an `edge-<env>` container outside of `bin/deploy-to`'s own swap
  (which always supplies `ACTIVE_APP_UPSTREAM` fresh via `docker exec -e
  ...` regardless of what's baked in), a compose default like
  `ACTIVE_APP_UPSTREAM: ${ACTIVE_APP_UPSTREAM:-app}` would silently bake in
  the literal, never-valid container name `app` (real names are always
  `app-<env>-blue`/`-green`) with zero indication of what the right value
  should have been — this is why that var is the required-var form,
  `ACTIVE_APP_UPSTREAM: ${ACTIVE_APP_UPSTREAM:?...}` (same tier as
  `DATABASE_URL`/`JWT_SECRET`), so a bad ad hoc recreate fails loudly at
  `docker compose` invocation time instead of crash-looping with no hint —
  its error message points at `.deploy-state/active-app-slot` (see above)
  for the value to supply. Because `docker compose` interpolates every
  service's `environment:` block on every invocation regardless of target
  service, making this var required on `edge` alone would break every other
  `dc build`/`dc run` call in `bin/deploy-to` that targets `api`/`app` —
  fixed alongside by exporting a script-wide `ACTIVE_APP_UPSTREAM` right
  after the active slot is determined, ahead of every later `dc` call.
  `bin/deploy-to` never force-recreates `edge` itself (it only reloads it
  in place), so this remains a footgun for a human running raw `docker
  compose` commands against a live environment — preferring to write
  `.deploy-state/active-app-slot` over passing `-e` for a manual recreate
  (see above) now also survives that container's next restart, not just
  fixing the one recreate.
- **Edge's nginx template is bind-mounted as a directory
  (`infra/edge/`), never as a single file — this is load-bearing for
  zero-downtime template edits, not a style choice.** A single-file bind
  mount is inode-pinned, while `git pull` rewrites a changed file via
  unlink+create (a new inode) — the mount keeps resolving to the old,
  now-unlinked inode forever after, so a running edge container would never
  see a new template no matter how many times it's reloaded. A directory
  mount doesn't have this problem — it re-resolves the filename on every
  lookup, so a new inode is visible immediately. This is why the compose
  volume is `./edge:/etc/nginx/templates:ro` rather than a single-file
  mount, and why the template filename must already match
  `default.conf.template` on the host (directory mounts can't rename on the
  way in, same as inside the container). This means `bin/deploy-to` needs
  **no** template-drift detection or forced-recreate logic — every future
  template edit just rides the existing zero-downtime `envsubst && nginx -s
  reload` cutover, same as any other deploy. **One-time migration caveat**:
  changing a service's `volumes:` entry doesn't retroactively affect an
  already-running container, and `bin/deploy-to`'s steady-state path never
  calls `dc up -d edge` (it only `docker exec`s into the already-running
  container) — so any environment deployed before this fix landed needs its
  `edge` container recreated once, by hand:
  `ACTIVE_APP_UPSTREAM=<current-active-slot-container> docker compose -f
  infra/docker-compose.production.yml --env-file .env.<env> -p
  logenhelfer-<env> up -d --force-recreate edge` (the `ACTIVE_APP_UPSTREAM=`
  prefix is required since that var has no safe default — find the value in
  that environment's `.deploy-state/active-app-slot`, or from `docker
  ps`/edge's own currently-rendered config). This same recreate is also
  what an environment needs once to pick up the stale-`ACTIVE_APP_UPSTREAM`
  fix's new volume mounts — see that bullet above. This one recreate is NOT zero-downtime (same
  class of exception as the original blue/green first-deploy transition
  above) — do it as a deliberate, confirmed, low-traffic-window action per
  environment, not folded into a routine deploy. A brand-new environment's
  very first deploy is unaffected — it creates `edge` fresh from the current
  compose file either way.
- **`MAX_UPLOAD_FILE_SIZE_MB` (optional local `.env.<env>` var, default 20 —
  unset means today's exact behavior) is the single source of truth for
  both nginx layers' `client_max_body_size` (`infra/edge/default.conf.template`'s
  `${NGINX_CLIENT_MAX_BODY_SIZE_MB}`, `app/nginx.conf.template`'s same
  templated value) and the api's `MULTIPART_FILE_SIZE_LIMIT_BYTES`
  (`contractValidation.ts`) — no two independently-hardcoded numbers that
  can silently drift. `app`'s blue/green slot containers pick this up for
  free on every deploy — they're recreated fresh each time (`dc run -d
  --name ... app`), so the compose `environment:` block's
  `NGINX_CLIENT_MAX_BODY_SIZE_MB: ${MAX_UPLOAD_FILE_SIZE_MB:-20}` is simply
  whatever the current `.env.<env>` says. **`edge` needs more than a
  template/compose edit — its swap-time `envsubst` calls in
  `bin/deploy-to` have to name every templated variable explicitly.**
  `envsubst`'s restricted-list form substitutes *only* the variable(s)
  explicitly named in its SHELL-FORMAT argument — everything else in the
  template is left as a literal, unsubstituted `${VAR}` — so adding a new
  `${VAR}` to the edge template without widening both `envsubst` calls (the
  steady-state cutover, and the warm-rollback branch in
  `cleanup_on_exit`) to name it too renders an invalid nginx directive on
  every future swap, which `nginx -s reload` rejects, silently failing the
  cutover/rollback every time. Both calls use one double-quoted SHELL-FORMAT
  argument naming every variable — `envsubst "\$ACTIVE_APP_UPSTREAM
  \$NGINX_CLIENT_MAX_BODY_SIZE_MB"` (envsubst only accepts a single
  positional SHELL-FORMAT arg; two space-separated bare/unquoted words would
  pass it two arguments and error instead). **Naming the var in the
  SHELL-FORMAT isn't enough on its own** — envsubst still needs an actual
  *value* for it in its process environment, and that value must be fresh,
  not whatever happened to be baked into the edge container at its last
  (re)creation (a named-but-unset var substitutes to an empty string, not
  the literal token, which is itself an invalid directive). Both `docker
  exec` calls therefore also add `-e
  NGINX_CLIENT_MAX_BODY_SIZE_MB="\$MAX_UPLOAD_MB"` (read fresh from
  `\$ENV_FILE` on every deploy, defaulting to 20, right alongside where
  `API_CONTAINER`/`APP_CONTAINER`/`EDGE_CONTAINER` are already read),
  mirroring exactly how `-e ACTIVE_APP_UPSTREAM=...` already overrides that
  var fresh on every swap rather than trusting the container's own baked-in
  copy. **The upshot: a `MAX_UPLOAD_FILE_SIZE_MB` change takes effect on
  the very next ordinary deploy for any environment, old or new** — no
  edge-container recreate needed — because the swap step supplies the
  value fresh via `-e` instead of relying on what's baked into the
  container's environment. Any future `\${VAR}` added to
  `infra/edge/default.conf.template` needs the same two-part treatment
  (name it in the SHELL-FORMAT list AND supply it via `-e` with a value read
  fresh from `\$ENV_FILE`) — it will render fine on a brand-new `dc up -d
  edge` (the image's own start-time entrypoint envsubst auto-substitutes
  every set env var, no restricted list) but silently break, or silently go
  stale, on the next swap otherwise.
- **Raising `MAX_UPLOAD_FILE_SIZE_MB` above the default 20 also needs a
  manual bump to the host nginx `client_max_body_size` directive** —
  `infra/host-nginx-reference/logenhelfer.location.conf.example` hardcodes
  `20m` (matching the default) and is reference-only (never templated,
  never read by any script — see the "never reload/edit host nginx" rule
  above). Host nginx is the outermost hop the upload body passes through
  before edge/app/api ever see it, so once `MAX_UPLOAD_FILE_SIZE_MB` is
  raised past 20 for an environment, this file's `client_max_body_size`
  must be bumped to match by hand in that same edit, or host nginx becomes
  the tightest constraint and starts 413ing with its own bare error page
  instead of the api's clean JSON response. Bumping the reference `.example`
  file's value is not the same as applying it — that edit still has to be
  pasted into the host nginx config by hand per environment, per that same
  manual-only rule.
- **Port allocation convention**: even-numbered app port — this governs the
  **deploy host's** `.env.<name>` (`APP_PORT`; now `edge`'s port, not
  `app`'s). Check the host nginx config for currently-assigned ports across
  *all* projects before picking a new one — collisions break someone else's
  site, not just this one.
- **`APP_LISTEN_IP` sets the `edge` container's published-port bind
  address**, defaulting to `127.0.0.1` (unchanged behavior for single-host
  deployments). Only set it when the TLS-terminating nginx lives on a
  different host than this deploy host — point it at that host's WireGuard
  tunnel IP instead (see README's Deployment section for the full runbook).
- **Local `.env.<name>` is the source of truth for that environment's real
  secrets** (not the deploy host's copy any more). `bin/deploy-to`
  overwrites the remote copy on every deploy after backing it up (3
  generations kept, pruned automatically); never hand-edit the remote copy
  directly, since the next deploy will overwrite it anyway.
- **Migrations are roll-forward only.** `bin/deploy-to` runs `db:prepare`
  against the shared DB before swapping containers, but a post-swap rollback
  only restores the previous *image* — not the schema. If a rollback ever
  needs to happen after a migration that the previous code can't run
  against, a manual DB restore is required; there's no automatic schema
  rollback.
- **Migrations must now also be expand/contract / backward-compatible with
  the previous release's code — this is stronger than "roll-forward only"
  above.** Blue/green deliberately keeps the *old* slot's code running and
  serving live traffic for a window *after* migrations have already run
  against the shared, now-already-migrated database — that overlap window
  didn't exist under a hard-swap mechanism (old containers stopped before
  new ones started), so this requirement is genuinely new to blue/green.
  Concretely: a migration that renames or drops a column, or changes a
  column's type/nullability in a way the *previous* release's Prisma client
  doesn't expect, will make the still-live old slot start throwing errors
  (or silently misbehaving) the moment that migration lands — even though
  nothing about the new slot is broken yet. The safe pattern is
  expand/contract: add the new column/shape in one migration (both old and
  new code can coexist with it — old code ignores the new column, new code
  writes to both if needed), ship the code that fully cuts over to the new
  shape, *then* drop the old column/shape in a later migration once no
  previously-deployed slot could still reference it. Never combine "add the
  new thing" and "remove the old thing" in the same migration/deploy for
  any column or table that live, already-running old code still reads or
  writes.
- **Never edit an already-shipped migration file after the fact**, even a
  baseline migration. `prisma migrate deploy` only compares *migration
  history* (the `_prisma_migrations` table), not actual schema state, so
  once an environment's history has a migration marked applied, editing its
  SQL after that point is a no-op there forever — `prisma migrate status`
  happily reports "up to date" while the intended schema is silently
  missing. Any schema change — however small, however "it should've always
  been there" — goes in a new migration file, never into an existing one.
- **`bin/deploy-to --remote` runs `bin/test-gate` inside the existing SSH
  session on the deploy host, not on a separate build host.** It's inserted
  right after the branch checkout (`EXPECTED_HASH=$(git rev-parse HEAD)`) and
  before the `:previous` image tagging, so nothing destructive has happened
  yet if the gate fails — the existing `cleanup_on_exit` trap safely no-ops.
  This reuses the exact `${ENV}_HOST`/`_USER`/`_PATH`/`_SSH_PORT` already
  resolved for the environment; no new `.env` vars. `bin/test-gate`'s
  ephemeral `logenhelfer-gate` Compose project has its own name/network/ports
  distinct from the live `logenhelfer-<env>` project, so it doesn't collide
  with the site currently running there — it only adds CPU/disk contention,
  same as the image build step already does on that host. Don't add a
  separate build-host config for this without being asked — the whole point
  was reusing what's already wired up. `bin/test-gate`'s own containers cap
  at `GATE_CPUS` (default 4) for exactly this contention reason, overridable
  via `bin/deploy-to ... --remote --cpus <n>`.
- **`bin/test-gate`'s inter-container networking must use the gate Compose
  project's own network + service names (`postgres-db`, `api`), never
  `host.docker.internal` + `--add-host=host-gateway` against a
  host-published port.** `postgres-db`'s port is bound to `127.0.0.1` only
  (`infra/docker-compose.yml`), and on Docker Desktop (Mac)
  `host.docker.internal`/`host-gateway` has special-cased routing that
  reaches loopback-bound ports anyway — but on plain Linux Docker Engine,
  `host-gateway` resolves to the real bridge gateway IP, which a
  loopback-only bind refuses, failing as Prisma `P1001` ("Can't reach
  database server"). Compose's default network is named
  `<project>_default` (`logenhelfer-gate_default` here); joining it via
  `docker run --network` and addressing services by name is the same
  pattern the `api` service's own `DATABASE_URL` already uses, and works
  identically on every platform — don't reintroduce the host-gateway hack
  for any new gate container that needs to reach `postgres-db` or `api`.
- **The working-plan feed/export have stable, canonical top-level URLs,
  independent of the API's internal path.** `app/nginx.conf.template` has two
  `location = /arbeitsplan.ics` / `location = /arbeitsplan.pdf` alias blocks
  (added right after the existing `location /api/` block) that proxy to the
  api's `/api/v1/public/workingplan.ics` / `.pdf` routes, so
  `https://<domain>/arbeitsplan.ics` and `.pdf` are shareable/bookmarkable
  without exposing the API's own route shape. `workingplan.pdf` is generated
  server-side (`api/src/routes/public.ts`'s `buildWorkingplanPdf`, a port of
  the frontend's former client-side `jsPDF`/`jspdf-autotable` generator,
  which was removed once the server-side route existed) — gated by the same
  `public_wp_available_to_anon_users` AppConfig flag as the `.ics` route.

## Styled error pages

Static 404/500/502 pages live at `app/public/errors/` (`404.html`,
`500.html`, `502.html`, `style.css`, `countdown.js`, `bijou.png`) — styled to
match `app/src/theme.ts`'s palette, no auto-refresh on 404, Fibonacci-backoff
auto-reload (pure logic in `app/src/features/errors/fibRetry.ts`, duplicated
inline in `countdown.js` since `public/` files aren't bundled) on 500/502.
`app/nginx.conf.template` wires these via `error_page` + a regex
`location ~ ^/errors/[^/]+\.html$ { internal; }` for errors *this app's own*
nginx generates — dropped under `app/public/`, so no `app/Dockerfile` change
was needed. Only the `.html` pages are `internal`; `style.css`/
`countdown.js`/`bijou.png` stay normal fetchable static files, since the
browser loads them as sub-resources *from* the already-served error page —
making the whole `/errors/` prefix `internal` silently 404s those and ships
an unstyled page. This does **not** cover the "edge/app fully down" 502
case (that's the *host* nginx, in front of everything this repo runs) —
that gap is now **partially** addressed: the static files themselves ARE
automatically kept in sync via `bin/deploy-to`'s optional rsync step (see
the `{ENV}_ERROR_PAGES_PATH` bullet in the deploy-mechanism section above)
whenever that var is set, and there's a checked-in reference template,
`infra/host-nginx-reference/logenhelfer.location.conf.example`, giving the
exact `error_page`/`location /errors/` directives to paste in. What's still
manual, same as ever: actually pasting those directives into the host nginx
config and reloading it remains a one-time, human-applied edit per
environment — never done by any script, per the "never reload/edit host
nginx" rule above. So: files → automated; host-nginx config wiring → still
manual, but now with a durable reference instead of tribal knowledge. The
in-app React 404 (`app/src/pages/NotFoundPage.tsx`, react-router's
catch-all) is unrelated to these — it's real MUI, themed directly, and
(since `location /` falls back to `index.html` for any unmatched path) is
what actually handles unknown in-app URLs in practice; the static 404.html
above only fires if `index.html` itself is missing from the image.

## Testing this mechanism specifically

Shell deploy scripts don't get unit tests in the usual sense. The bar here is:
`shellcheck` clean, then two live runs against a preview environment (safe —
not production): one normal deploy (happy path), and one with a
deliberately-broken build or mismatched hash to confirm the rollback trap
actually restores `:previous` rather than leaving the environment half-
deployed. Don't consider this mechanism done until both have actually been
run, not just reasoned about. Because "true zero downtime" is now a
specific, falsifiable claim rather than just an architectural intention,
also run a tight request loop (e.g. curl every 100ms) against the preview
environment's real public URL for the entire duration of a real deploy,
logging every non-2xx response and its timestamp — zero non-2xx responses
outside the one-time port-migration transition window is the actual bar;
reasoning about the `nginx -s reload` semantics alone is not sufficient
proof, this has to be observed.

## Security requirements

This app manages a private organization's member roster and
prospective-member vetting pipeline — both are sensitive to the people
involved, and an app like this is a plausible attack target. The invariants
below come out of a full authz/injection/auth/infra/frontend/business-logic
audit. Don't relax any of these without re-running an equivalent audit;
when in doubt about a new endpoint or config toggle, treat these as the
checklist.

- **Authorization is per-handler, not centralized.** There is no authz
  middleware — `authenticateApiUser` only proves "logged in." Every
  mutating/reading handler MUST call `req.ability.can(...)` (or the matching
  `canView*`/`canOn` helper in `authz/ability.ts`) against the specific
  target before touching data. A route that checks only authentication, not
  authorization against the target resource, is a bug.
- **Privilege-granting fields must be scoped to what the caller may
  specifically grant, not just whether they may manage the collection.**
  Any endpoint writing a role/permission field needs an explicit "may the
  caller grant *this specific* role/permission" check, not just a
  collection-level `manage` gate.
- **Bulk PII exports (csv_export, roster/list endpoints) must be audit-logged
  server-side, inside the handler** — never only via a client-triggered
  beacon.
- **Impersonation tokens must be distinguishable from real login tokens**
  (carry an impersonator claim), and member self-service actions that create
  a consent/attribution record (GDPR acceptance, subscription changes) must
  not be silently executable while impersonating without that action being
  attributable back to the impersonating admin.
- **The SPA's own server must set its own security headers** — CSP,
  `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`. The API's
  `helmet()` (`api/src/app.ts`) only protects JSON API responses; it never
  reaches the HTML the browser actually executes.
- **Any `dangerouslySetInnerHTML` sink must sanitize its input, even
  "trusted admin-authored" content.** One compromised admin account should
  not be able to turn AppConfig-authored HTML (Help/Impressum pages) into
  unsanitized script served to every visitor.
- **New file-accepting endpoints must enforce size/type limits at whichever
  middleware actually runs the request in production** (currently
  `express-openapi-validator`'s multer instance, not a route file's own
  `express.raw` fallback that may only execute in tests) — verify against
  the real production request path, not just the code you wrote.
- **Sensitive config defaults must default to the more private option** (a
  toggle like `show_admins` should default `false`/closed, not `true`).
- **Any new SSRF-capable fetch (external URL from user/admin input) must
  reuse `lib/safeIcsFetch.ts`'s pattern** (protocol allowlist,
  private/loopback/link-local blocking, DNS-rebinding-safe pinned connection,
  per-redirect-hop re-validation) — don't add a second bespoke fetch path.
- **Login/session endpoints must not leak whether an account exists**, via
  differing status codes, error bodies, or response timing between "unknown
  email" and "wrong password."
- **Security-sensitive account events (password change, offboarding/
  soft-delete) must revoke the user's outstanding refresh-token families**,
  not just block future logins by email-mangling — an active refresh cookie
  must not outlive an account being disabled.

### Remediation history

A full security audit was run against this codebase, and every finding was
fixed and landed on `main` — privilege-escalation, injection, authz,
audit-logging, impersonation-attribution, CSP/header, sanitization, upload
limit, and login-enumeration classes of issue are all addressed by the
invariants above. Any known-but-not-yet-fixed gaps are tracked privately
(not in this file) rather than published as a live checklist — don't add a
new "known open issue" list to this file; track those wherever
maintainers currently track security backlog for this project.

### Advanced security testing

Every finding from a security audit must land as a regression test before
it's fixed (this follows the global rule: reproduce a bug with a test, then
fix it). Security-relevant suites already exist at
`api/e2e/securityBoundaries.spec.ts`, `app/e2e/authorization-boundaries.spec.ts`,
and per-route `api/test/routes/*.test.ts` — add new abuse-case tests there,
don't spin up a parallel test file per finding. When touching a CASL rule in
`authz/ability.ts` or any route's ability check, add both a "should allow"
and a "should deny" case for the same change — a permission bug is exactly
as likely to be too-permissive as too-restrictive, and only testing the
allow side misses that.

### Multi-factor authentication (MFA)

- **`MFA_ENCRYPTION_KEY` must never be rotated without a migration plan.**
  It's the AES-256-GCM key protecting every stored TOTP secret
  (`api/src/lib/mfaEncryption.ts`) — rotating it makes every existing
  encrypted TOTP secret undecryptable, forcing those users to fully
  re-enroll TOTP specifically (email OTP, passkeys, and backup codes are
  unaffected, since only the TOTP secret is encrypted with this key).
  Auto-provisioned once per environment by `bin/init-env`/`bin/deploy-to`
  (`bin/deploy-to`'s own idempotency check — `grep -q '^MFA_ENCRYPTION_KEY='`
  — is what prevents an accidental second provision/rotation on a later
  deploy; don't remove it).
- **`mfa_grace_period_started_at` is intentionally absent from
  `api/src/routes/appConfig.ts`'s `KNOWN_KEYS`**, even though
  `api/src/lib/appConfig.ts`'s own `KNOWN_KEYS` does know about it. It's a
  system-managed timestamp, deliberately never exposed via the
  admin-facing `PATCH /api/v1/app_config` endpoint. Don't "fix" this by
  adding it to the routes-layer `KNOWN_KEYS` — doing so would let an admin
  arbitrarily reset the mandatory-MFA grace-period countdown via the
  settings UI, defeating its purpose as a fixed start-of-enforcement
  timestamp.
- **Every route behind `authenticateApiUser`
  (`api/src/auth/middleware.ts`) is also subject to a live, per-request
  "must complete MFA setup" gate** — 403 (never 401; a 401 would trip
  `apiFetch`'s silent token-refresh-and-retry in `app/src/api/client.ts`) —
  whenever mandatory MFA's grace period has passed for a zero-method user,
  except for the MFA setup API itself (`/api/v1/mfa/*`) and `GET
  /api/v1/me`. Computed live via `isMfaSetupRequiredFor`
  (`api/src/lib/mfaStatus.ts`), never cached in a JWT claim, so it self-heals
  the instant enrollment completes instead of staying stuck until the
  token's next refresh. Any new authenticated route automatically inherits
  this gate — no per-route wiring needed — but if a new route legitimately
  needs to be reachable by a not-yet-enrolled mandatory-MFA user, it needs
  an explicit allowlist exception added there, not a separate mechanism.
- **Every credential-guessing MFA surface must rate-limit via the shared
  `isMfaLockedOut`/`recordFailedMfaAttempt`/`resetMfaLockout` pattern**
  (`api/src/auth/mfaLockout.ts`), keyed by a distinct `subject_key` per
  surface (e.g. `mfa:<email>`, `mfa-proof:<userId>`,
  `mfa-setup-email:<userId>`, `passkey:<credentialId>`) — a
  brute-forceable code-verification endpoint with no lockout is a real
  vulnerability class, not a theoretical one. Lockout responses in this
  codebase are deliberately indistinguishable from an ordinary failed
  attempt (same status/body either way) — don't add a distinguishable
  status code for a new one, it would leak lockout state to an attacker.

### Public status endpoint (monitoring)

- **`GET /api/v1/public/status/:token` has no AppConfig toggle**, unlike
  every other route in `api/src/routes/public.ts`. This is deliberate
  (YAGNI) — `STATUS_ENDPOINT_TOKEN` (provisioned like `MFA_ENCRYPTION_KEY`/
  `BIRTHDAY_CALENDAR_SECRET` — see `bin/init-env`/`bin/deploy-to`) is the
  only on/off switch. To revoke a leaked/previously-issued monitoring URL,
  rotate the token in `.env.<env>` and redeploy — don't add a second
  AppConfig flag for this.
- **`uptime_seconds` in that response is `process.uptime()`, not a real
  deploy-timestamp mechanism.** It resets whenever the process restarts,
  not necessarily in lockstep with a blue/green cutover. Don't build a
  "since last deploy" guarantee on top of it without adding real
  deploy-timestamp tracking first.
- **The Postgres check reports `host`/`port` only**, parsed via `new
  URL(...)` in `api/src/db.ts`'s `databaseHostPort()`. Never thread the raw
  `DATABASE_URL` (or `databaseUrl()`, which stays unexported) into this
  route or its response — that would leak credentials + db name to anyone
  who correctly guesses/receives the status URL.
- **`checks.redis` is always `{configured: false}`** — there is no Redis in
  this codebase. A future Redis addition should flip this value in place,
  not invent a new response shape or a new Kuma monitor.

## General Advices

We do not gender in german. We are only working with the male version.
