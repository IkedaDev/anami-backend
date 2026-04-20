# --- ETAPA 1: Build ---
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile
RUN yarn prisma generate
COPY . .
RUN yarn build # Esto genera la carpeta /dist

# --- ETAPA 2: Runner ---
FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ="America/Santiago"
ENV NODE_ENV=production
ENV PORT=3000

# Copiamos las dependencias
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# NUEVO: Copiar el archivo de configuración de Prisma 7
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["node", "dist/index.js"]