# Dockerfile
FROM node:20-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache tini

# Créer le répertoire de l'application
WORKDIR /home/node/app

# Installer les dépendances
COPY package*.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copier les fichiers sources
COPY . .

# Construire l'application
RUN pnpm run build

# Étape de production
FROM node:20-alpine

# Installer tini
RUN apk add --no-cache tini

WORKDIR /home/node/app

# Copier les fichiers nécessaires
COPY --from=base /home/node/app/package*.json ./
COPY --from=base /home/node/app/node_modules ./node_modules
COPY --from=base /home/node/app/build ./build

# Installer uniquement les dépendances de production
RUN pnpm prune --prod

# Exposer le port de l'application
EXPOSE 3333

# Utiliser tini comme processus parent
ENTRYPOINT ["/sbin/tini", "--"]

# Commande pour démarrer l'application
CMD ["node", "build/server.js"]