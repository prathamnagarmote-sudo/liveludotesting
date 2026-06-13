# Build TypeScript code
FROM node:18-alpine AS node-builder

WORKDIR /app/nakama

COPY nakama/package.json ./
RUN apk add --no-cache git && npm install

COPY nakama/tsconfig.json ./
COPY nakama/*.ts ./
RUN npm run build

# Run Nakama
FROM heroiclabs/nakama:3.21.1

COPY --from=node-builder /app/nakama/build/index.js /nakama/data/modules/

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address ${NAKAMA_DATABASE_ADDRESS} && exec /nakama/nakama --name nakama1 --database.address ${NAKAMA_DATABASE_ADDRESS}"]
