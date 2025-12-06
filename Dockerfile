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

# Instalar OpenSSL en la imagen final
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiamos las dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el código fuente (AQUÍ ESTABA EL ERROR)
COPY . .

# Variables de entorno
ENV NODE_ENV=PRODUCTION
ENV PORT=3000

EXPOSE 3000

# Ejecutamos con tsx
CMD ["npx", "tsx", "src/index.ts"]