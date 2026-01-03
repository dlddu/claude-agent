# Backend Dockerfile (Multi-stage build)
# @spec INFRA-001

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Build shared package first, then backend
WORKDIR /app
RUN pnpm --filter @claude-agent/shared build
RUN pnpm --filter @claude-agent/backend build

# ============================================
# Stage 3: Migration Runner
# ============================================
FROM node:20-alpine AS migrator

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (includes Prisma CLI and generated client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy Prisma schema and migrations
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

WORKDIR /app/packages/backend

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "prisma", "migrate", "deploy"]

# ============================================
# Stage 4: Production Runner
# ============================================
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy node_modules from builder (includes generated Prisma client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

# Copy package.json for workspace resolution
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

USER nestjs

EXPOSE 3001

WORKDIR /app/packages/backend

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
