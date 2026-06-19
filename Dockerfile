# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && \
    npx prisma generate

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# jemalloc: la imagen Alpine usa musl libc, cuyo allocator fragmenta el heap bajo
# sharp/libvips (procesamiento de imágenes multi-thread) y dispara el uso de RAM.
# jemalloc está diseñado para cargas concurrentes y elimina esa fragmentación.
# Recomendación oficial de sharp para entornos musl/Alpine.
RUN apk add --no-cache jemalloc
ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

# Copy dependencies and generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application source
COPY . .

RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]
