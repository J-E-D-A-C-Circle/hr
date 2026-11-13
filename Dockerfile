# Multi-stage Dockerfile for Next.js Standalone with MySQL
# Using Node 22 slim (Debian glibc) matching nssportal2

# Step 1: Dependencies Stage
FROM public.ecr.aws/docker/library/node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps

# Step 2: Builder Stage
FROM public.ecr.aws/docker/library/node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# Step 3: Production Runner Stage
FROM public.ecr.aws/docker/library/node:22-slim AS runner
WORKDIR /app

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
COPY --from=builder /app/scripts ./scripts
COPY --from=deps /app/node_modules ./node_modules

# Create upload directory with correct permissions
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app/uploads /app/scripts /app

# Copy startup script
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
