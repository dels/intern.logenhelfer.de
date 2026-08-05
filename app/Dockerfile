# ---------- build stage ----------
FROM node:24-slim AS build
ARG GIT_HASH=unknown
ARG VITE_IDLE_TIMEOUT_MINUTES=30
WORKDIR /work

# pnpm version comes from the root package.json's "packageManager" field
# (Corepack, bundled with Node, reads it automatically) rather than being
# pinned again here — keeps this, api/Dockerfile, bin/test-gate, and CI from
# drifting to different pnpm versions the way a plain `npm install -g pnpm@x`
# invites.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Workspace files first (layer cache: source changes don't re-run install).
# api/package.json is present only so pnpm can validate the full workspace
# defined in pnpm-workspace.yaml — its deps are never installed here, only
# app's are.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY app/package.json app/package.json
COPY api/package.json api/package.json
RUN pnpm install --frozen-lockfile

COPY app app
# Vite only bakes import.meta.env.VITE_* values that are present in
# process.env when its build step actually runs (see
# app/src/auth/useIdleTimeout.ts's getIdleTimeoutMs) - ARG alone does not
# reach the `pnpm --filter app build` subprocess, it has to be re-exported as
# an ENV first. Mirrors GIT_HASH's ARG-based plumbing above (see
# docker-compose.production.yml's frontend build.args).
ENV VITE_IDLE_TIMEOUT_MINUTES=$VITE_IDLE_TIMEOUT_MINUTES
RUN pnpm --filter app build
RUN printf '{"hash":"%s"}' "$GIT_HASH" > app/dist/version.json

# ---------- runtime stage ----------
# nginxinc/nginx-unprivileged is the same official nginx build minus the
# root-owned master process/privilege-drop step — it already listens on
# 8080 and runs as uid 101 from the start, which is what lets `cap_drop:
# [ALL]` in the compose files carry no add-back for this service (unlike
# stock nginx:*-alpine, whose master needs SETUID/SETGID/CHOWN to drop to
# the nginx worker user).
FROM nginxinc/nginx-unprivileged:1.30-alpine

# nginx.conf.template's ${API_UPSTREAM_HOST} gets substituted by the base
# image's own docker-entrypoint.d/20-envsubst-on-templates.sh (any
# /etc/nginx/templates/*.template renders to /etc/nginx/conf.d/* at
# container start) - "api" is the real compose service name bin/deploy-to's
# production containers use; only the smoke-test step overrides this to
# target a specific "<container>-smoke" instance instead (see bin/deploy-to).
ENV API_UPSTREAM_HOST=api
# --chown=nginx:nginx: COPY defaults to root:root ownership, but this image's
# worker process (and the entrypoint's envsubst-on-templates step) runs as
# the unprivileged `nginx` user (uid 101) from the start — no root step ever
# chowns these for us the way stock nginx's privilege-drop incidentally did.
COPY --chown=nginx:nginx app/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=nginx:nginx /work/app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/version.json || exit 1
