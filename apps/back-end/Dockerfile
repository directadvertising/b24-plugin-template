FROM node:22 AS dev
WORKDIR /app/apps/back-end
CMD ["node_modules/.bin/tsx", "watch", "src/main.ts"]

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/back-end/package.json apps/back-end/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY apps/back-end/ apps/back-end/
COPY packages/contracts/ packages/contracts/
WORKDIR /app/apps/back-end
CMD ["node_modules/.bin/tsx", "src/main.ts"]
