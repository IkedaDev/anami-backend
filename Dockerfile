# --- ETAPA 1: Dependencias ---
# CAMBIO CRUCIAL: Usamos 'node:20-slim' en lugar de 'alpine'.
# Esto evita el error "Illegal instruction" de QEMU al compilar para ARM64.
FROM node:20-slim AS deps

WORKDIR /app

# Instalar OpenSSL (Necesario para que Prisma funcione en Debian Slim)
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

# También necesitamos OpenSSL en la imagen final para correr Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiamos las dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el código fuente
COPY .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Ejecutamos con tsx
CMD ["npx", "tsx", "src/index.ts"]