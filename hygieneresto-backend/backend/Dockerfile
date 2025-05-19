# syntax=docker/dockerfile:1
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY . .
EXPOSE 5000
RUN ls -la /usr/src/app  # Ajout de cette ligne pour lister les fichiers
CMD [ "npm", "start" ]
