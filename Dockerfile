# Build TypeScript code
FROM node:22-alpine AS node-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY nakama/package.json nakama/pnpm-lock.yaml ./nakama/

WORKDIR /app/nakama
RUN pnpm install --frozen-lockfile

COPY nakama/tsconfig.json nakama/rollup.config.js nakama/*.ts ./
RUN pnpm run build

# Run Nakama
FROM heroiclabs/nakama:3.21.1

COPY --from=node-builder /app/nakama/build/index.js /nakama/data/modules/

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address ${NAKAMA_DATABASE_ADDRESS} && exec /nakama/nakama --name nakama1 --database.address ${NAKAMA_DATABASE_ADDRESS}"]
