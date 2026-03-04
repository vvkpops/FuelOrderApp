FROM node:20-alpine AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client + build Next.js (standalone)
RUN npx prisma generate && npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public
# Copy Prisma schema (needed at runtime for some Prisma features)
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Start the standalone Next.js server
CMD ["node", "server.js"]
