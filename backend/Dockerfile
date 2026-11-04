# ==========================================
# Stage 1: Build NestJS Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client for runtime
RUN npx prisma generate

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/src/main"]
