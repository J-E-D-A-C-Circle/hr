# Multi-stage Dockerfile for Next.js Standalone with Drizzle ORM
# Using Node 22 slim (Debian glibc) for better-sqlite3 & Turbopack stability

# Step 1: Dependencies Stage
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps

# Step 2: Builder Stage
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Step 3: Production Runner Stage
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/lib/db ./lib/db

# Copy DB init script (pure CJS, no build step needed)
COPY scripts/init-db.js /app/scripts/init-db.js

# Copy the native modules needed by init-db.js (not bundled by Next.js standalone)
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Create upload and DB-storage directories with correct permissions
# /app/prisma is the default volume mount for the SQLite file
RUN mkdir -p /app/uploads /app/prisma && \
    chown -R nextjs:nodejs /app/uploads /app/prisma /app/scripts /app

# Copy startup script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
