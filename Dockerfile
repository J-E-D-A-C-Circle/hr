# Production Dockerfile for Next.js Standalone
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built standalone application & assets directly
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY lib/db ./lib/db

# Create upload directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads /app

# Copy startup script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
