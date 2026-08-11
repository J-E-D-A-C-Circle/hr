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

EXPOSE 3002

ENV PORT=3002
ENV NODE_ENV=production

# Wait for MySQL container, sync schema, seed database, and start app
CMD ["sh", "-c", "until nc -z db 3306; do echo 'Waiting for TempStaff MySQL database...'; sleep 2; done; npx prisma db push && node scripts/import_real_data.js && npm start"]
