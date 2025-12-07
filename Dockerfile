# --- ETAPA 1: Dependencias ---
FROM node:20-slim AS deps

WORKDIR /app

# Instalar OpenSSL (Necesario para Prisma en Debian Slim)
RUN apt-get update -y && apt-get install -y openssl

# Copiamos archivos de configuración
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Instalamos dependencias
RUN yarn install --frozen-lockfile

# Generamos el cliente de Prisma
RUN yarn prisma generate

# --- ETAPA 2: Runner (Producción) ---
FROM node:20-slim AS runner

WORKDIR /app

# 1. ACTUALIZACIÓN CRÍTICA: Instalamos 'tzdata' para tener las zonas horarias
RUN apt-get update -y && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*

# 2. CONFIGURACIÓN GLOBAL: Forzamos la hora de Chile para todo el contenedor
ENV TZ="America/Santiago"
ENV NODE_ENV=PRODUCTION
ENV PORT=3000

EXPOSE 3000

# Copiamos las dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el código fuente
COPY . .

# Ejecutamos con tsx
CMD ["npx", "tsx", "src/index.ts"]