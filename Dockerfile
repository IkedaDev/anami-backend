# --- ETAPA 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiamos archivos de dependencias
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# 2. Instalamos dependencias
RUN yarn install --frozen-lockfile

# 3. Generamos el cliente de Prisma (CRUCIAL para que funcione)
RUN yarn prisma generate

# 4. Copiamos el código fuente
COPY . .

# 5. Compilamos TypeScript a JavaScript (carpeta dist)
RUN yarn build

# --- ETAPA 2: Producción (Runner) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copiamos solo lo necesario desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Necesitamos el schema y config para que Prisma funcione en producción (especialmente en v7)
COPY --from=builder /app/prisma ./prisma

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponemos el puerto interno
EXPOSE 3000

# Comando de arranque
CMD ["node", "dist/index.js"]