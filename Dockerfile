ARG NODE_IMAGE=node:20.11.1-slim

FROM $NODE_IMAGE AS base

USER root
RUN apt-get update && apt-get install -y \
    dumb-init \
    libvips-dev \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

# --------------------
# Build
# --------------------
FROM base AS build
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
RUN node ace build

# --------------------
# Production
# --------------------
FROM base AS production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

COPY --chown=node:node --from=build /home/node/app/package*.json ./

# Installer ts-node uniquement
RUN npm install --only=production && npm install ts-node --omit=dev

COPY --chown=node:node --from=build /home/node/app/build ./build
COPY --chown=node:node --from=build /home/node/app/node_modules ./node_modules

EXPOSE 3333
CMD ["dumb-init", "node", "build/ace.js", "serve"]
