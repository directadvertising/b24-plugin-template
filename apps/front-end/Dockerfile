FROM node:22 AS dev
WORKDIR /app/apps/front-end
CMD ["node_modules/.bin/vite"]

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/front-end/package.json apps/front-end/
COPY packages/bitrix/package.json packages/bitrix/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY apps/front-end/ apps/front-end/
COPY packages/bitrix/ packages/bitrix/
COPY packages/contracts/ packages/contracts/
WORKDIR /app/apps/front-end
RUN pnpm build
CMD ["pnpm", "preview"]
