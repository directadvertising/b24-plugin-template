# syntax=docker/dockerfile:1
# ── shared pnpm setup ─────────────────────────────────────────────────────────
# PNPM_HOME + a BuildKit cache mount on /pnpm/store let every `pnpm install`
# reuse a persistent content-addressable store across builds (see pnpm.io/docker).
FROM node:22 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# ── dev ───────────────────────────────────────────────────────────────────────
# node_modules is installed INTO the image (Linux, correct arch) and never bind-
# mounted over — so this runs identically on macOS, Linux and CI. Compose bind-
# mounts ONLY source (see docker-compose.yml), leaving the image's node_modules
# untouched: `docker compose up` hot-reloads source edits, and `docker compose up
# --build` reinstalls deps with nothing shadowing them — no volumes to renew.
FROM base AS dev
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/back-end/package.json apps/back-end/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY apps/back-end/ apps/back-end/
COPY packages/contracts/ packages/contracts/
WORKDIR /app/apps/back-end
CMD ["node_modules/.bin/tsx", "watch", "src/main.ts"]

# ── production ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/back-end/package.json apps/back-end/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY apps/back-end/ apps/back-end/
COPY packages/contracts/ packages/contracts/
WORKDIR /app/apps/back-end
CMD ["node_modules/.bin/tsx", "src/main.ts"]
