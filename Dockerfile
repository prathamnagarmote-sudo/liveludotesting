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

# Store the compiled module at /opt/ — completely outside /nakama/ and immune to
# any Railway volume mount that may mask /nakama/data/ or /nakama/modules/.
COPY --from=node-builder /app/nakama/data/modules/index.js /opt/ludo_module.js

# Also bake into both possible runtime directories as a build-time fallback
# (these may be masked by volume mounts at runtime, but the entrypoint copies
# from /opt/ to fix that).
RUN mkdir -p /nakama/data/modules /nakama/modules
COPY --from=node-builder /app/nakama/data/modules/index.js /nakama/data/modules/index.js
COPY --from=node-builder /app/nakama/data/modules/index.js /nakama/modules/index.js

EXPOSE 7349 7350 7351

# At startup, copy the baked-in module to the runtime paths, run migrations, and start Nakama
ENTRYPOINT mkdir -p /nakama/data/modules /nakama/modules && \
           cp /opt/ludo_module.js /nakama/data/modules/index.js && \
           cp /opt/ludo_module.js /nakama/modules/index.js && \
           if [ -n "$NAKAMA_DATABASE_ADDRESS" ]; then DB_ADDR="$NAKAMA_DATABASE_ADDRESS"; elif [ -n "$NAKAMA_DATABASE_URL" ]; then DB_ADDR="$NAKAMA_DATABASE_URL"; elif [ -n "$DATABASE_URL" ]; then DB_ADDR="$DATABASE_URL"; else DB_ADDR="root@localhost:5432/nakama"; fi && \
           /nakama/nakama migrate up --database.address "$DB_ADDR" && \
           exec /nakama/nakama --name nakama1 --database.address "$DB_ADDR" --logger.level INFO
