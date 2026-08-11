FROM node:20-alpine

# Install OpenSSL and compatibility libraries for Prisma on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package configuration & install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client for MySQL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate

# Build Next.js application
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
