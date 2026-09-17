# Multi-stage Dockerfile for DVLA NSS Portal (Next.js Standalone + MySQL)
# Using Node 22 slim (Debian glibc) for stability

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

RUN apt-get update && apt-get install -y openssl default-mysql-client netcat-openbsd && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/database ./database

# Create upload directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads /app

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
