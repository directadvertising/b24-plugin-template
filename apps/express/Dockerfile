FROM node:22 AS dev
WORKDIR /app/apps/express
CMD ["node_modules/.bin/tsx", "watch", "src/main.ts"]

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/express/package.json apps/express/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY apps/express/ apps/express/
COPY packages/contracts/ packages/contracts/
WORKDIR /app/apps/express
CMD ["node_modules/.bin/tsx", "src/main.ts"]
