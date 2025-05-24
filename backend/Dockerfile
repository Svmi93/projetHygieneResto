# Utilise une image Node.js officielle comme base
FROM node:18-alpine

# Définit le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Installe curl (nécessaire pour le healthcheck)
RUN apk add --no-cache curl # Pour les images basées sur Alpine (comme node:18-alpine)
# Si tu utilises une image basée sur Debian/Ubuntu (comme node:18), utilise :
# RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copie package.json et package-lock.json pour installer les dépendances
# Ceci est fait en premier pour tirer parti de la mise en cache de Docker
COPY package*.json ./

# Installe les dépendances du projet
RUN npm install

# Copie tout le reste du code de l'application dans le conteneur
COPY src ./src
# REMOVE THIS LINE: COPY .env ./.env  -- Les variables d'environnement seront passées via Docker Compose

# Expose le port sur lequel ton application Express écoute
EXPOSE 5001
# Commande pour démarrer l'application
# Utilise 'node src/server.js' car c'est le point d'entrée principal
CMD ["node", "src/server.js"]