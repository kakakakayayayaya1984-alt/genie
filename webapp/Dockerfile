# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# native compat for some deps
RUN apk add --no-cache libc6-compat

# Install ALL deps, including dev, for build tools like tailwind/postcss
COPY package.json package-lock.json* ./
RUN npm ci --include=dev


# Build
COPY . .
RUN npm run build

# keep the image smaller and avoid copying cache forward
RUN rm -rf .next/cache

# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# copy only what the server needs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# fix cache permissions
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app

USER nextjs

ENV PORT=${PORT:-3001}
CMD ["node", "server.js"]
