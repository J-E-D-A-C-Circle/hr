FROM node:20-alpine

# Install OpenSSL, compatibility libraries, and netcat for MySQL check
RUN apk add --no-cache openssl libc6-compat netcat-openbsd

WORKDIR /app

# Copy package configuration & install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy full application code & dataset
COPY . .

# Generate Prisma Client for MySQL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Copy static assets into standalone folder for Next.js standalone server
RUN mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/static && (cp -r public .next/standalone/public || true)

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Wait for MySQL database container, sync schema, and start standalone server
CMD ["sh", "-c", "until nc -z recruitment-db 3306 || nc -z db 3306; do echo 'Waiting for Recruitment MySQL database...'; sleep 2; done; npx prisma db push && node .next/standalone/server.js"]
