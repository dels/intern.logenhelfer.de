# ---------- build stage ----------
FROM node:22-slim AS build
WORKDIR /work

RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends curl ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# pnpm version comes from the root package.json's "packageManager" field
# (Corepack, bundled with Node, reads it automatically) rather than being
# pinned again here — see app/Dockerfile for why.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Workspace files first (layer cache: source changes don't re-run install).
# app/package.json is present only so pnpm can validate the full workspace
# defined in pnpm-workspace.yaml — its deps are never installed here, only
# api's are. Same convention as app/Dockerfile.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/package.json api/package.json
COPY app/package.json app/package.json
RUN pnpm install --frozen-lockfile

COPY api api
# Prisma Client is generated from the schema at install time, not checked in —
# needed before `tsc` can typecheck/compile files that import it.
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
# tsc only ever emits from .ts, but the Rust-free query-compiler Prisma
# generates alongside the client's .ts source ships a couple of plain-JS/wasm
# files (e.g. internal/query_compiler_bg.wasm + its .js loader) that it reads
# from disk at runtime, next to the compiled client - tsc silently drops
# them, and without this copy PrismaClient throws ENOENT for
# query_compiler_bg.wasm on the very first query in the runtime stage.
RUN cd api/src/generated/prisma \
  && find . -type f ! -name '*.ts' -exec install -D '{}' "/work/api/dist/generated/prisma/{}" \;

# ---------- runtime stage ----------
FROM node:22-slim

ARG GIT_HASH=unknown
ENV NODE_ENV=production \
    GIT_HASH=$GIT_HASH

# node:22-slim already ships a "node" user at uid/gid 1000 (the standard,
# documented way to run these images as non-root) — reuse it rather than
# creating a second one, which collides on gid 1000.

# curl is required at runtime for the Dockerfile's own HEALTHCHECK and the
# compose-level healthcheck (both `curl 127.0.0.1:.../healthz`) — this stage
# is a fresh `FROM node:22-slim`, so packages installed in the build stage
# above don't carry over. ca-certificates for outbound HTTPS (ICS auto-sync).
# Regression 2026-07-24: this install was moved into the build stage only
# (for prisma generate) without being kept here too, silently breaking every
# healthcheck with "curl: not found" — looked like host-contention flakiness
# since the app itself boots and logs fine.
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The whole build-stage node_modules is copied rather than pruned to
# production-only deps — it already contains the generated Prisma Client/query
# engine (RUN steps above), and pruning risks silently dropping a runtime dep
# that pnpm's dependency graph doesn't distinguish cleanly in a workspace.
COPY --from=build --chown=node:node /work/node_modules /app/node_modules
COPY --from=build --chown=node:node /work/api/node_modules /app/api/node_modules
COPY --from=build --chown=node:node /work/api/dist /app/api/dist
COPY --from=build --chown=node:node /work/api/package.json /app/api/package.json
# migrate:deploy (prisma migrate deploy) runs inside this image at deploy
# time (see bin/deploy-to) and needs the schema + migration files present,
# not just the generated client - without this, it fails with "Could not
# find Prisma Schema" since the runtime stage never otherwise copies prisma/.
COPY --from=build --chown=node:node /work/api/prisma /app/api/prisma
# prisma.config.ts is where DATABASE_URL now lives for the CLI (schema.prisma
# itself no longer has a datasource url) - migrate:deploy can't resolve a
# connection without it.
COPY --from=build --chown=node:node /work/api/prisma.config.ts /app/api/prisma.config.ts
# contractValidation.ts resolves the OpenAPI spec at runtime as
# ../../../openapi/openapi.yaml relative to its own compiled location
# (api/dist/middleware/ -> /app/openapi/openapi.yaml here) - without this,
# express-openapi-validator throws "spec could not be read" on the first
# request to any route, a 500 with no useful message unless apiErrorHandler
# happens to log it (see errors.ts).
COPY --chown=node:node openapi /app/openapi
# Bundled default lodge logo, used to seed app_logo on first boot (see
# lib/logoStore.ts's ensureLogoSeeded) - a plain repo-root copy, not built
# from the build stage, same as the openapi/ copy above.
COPY --chown=node:node api/assets /app/api/assets

USER node
WORKDIR /app/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "dist/index.js"]
