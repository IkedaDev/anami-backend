# --- ETAPA 1: Dependencias ---
FROM node:20-alpine AS deps

WORKDIR /app

# Copiamos archivos de configuración
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias (incluyendo devDependencies para tener 'tsx' y 'prisma')
RUN yarn install --frozen-lockfile

# Generamos el cliente de Prisma
RUN yarn prisma generate

# --- ETAPA 2: Runner (Producción) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copiamos las dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiamos el código fuente
COPY . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# EL TRUCO ELEGANTE:
# Ejecutamos directamente el archivo TS usando 'tsx'.
# No hace falta compilación previa a JS.
CMD ["npx", "tsx", "src/index.ts"]