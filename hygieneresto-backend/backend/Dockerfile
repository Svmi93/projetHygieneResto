# syntax=docker/dockerfile:1
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV=developpement
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY src ./src 
# COPY . . # Supprimez ou commentez cette ligne
EXPOSE 5001
CMD [ "npm", "start" ] # This now executes the 'start' script from package.json