FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate
COPY . .

# Prisma CLI is retained here for the one-shot migration service.
FROM build AS migrate
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM build AS production-deps
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=production-deps --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# Free cloud demo: retain Prisma CLI for startup migrations, then run API + worker.
FROM build AS cloud
ENV NODE_ENV=production
USER node
EXPOSE 10000
CMD ["node", "scripts/startCloud.js"]
