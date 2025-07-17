    # backend/Dockerfile

    # Utilise une image Node.js officielle comme base
    FROM node:18-alpine

    # Définir l'environnement pour Node.js
    ENV NODE_ENV=production

    # Définir le répertoire de travail
    WORKDIR /usr/src/app

    # Installer tzdata pour la gestion des fuseaux horaires et curl pour les requêtes HTTP (si non déjà présent)
    # Utiliser un argument de build pour invalider le cache et forcer la mise à jour de tzdata
    ARG CACHE_BREAKER # Déclare l argument de build
    RUN echo "Forcing rebuild for timezone setup: ${CACHE_BREAKER}" && \ 
        apk add --no-cache tzdata curl \
        && ln -snf /usr/share/zoneinfo/Europe/Paris /etc/localtime \
        && echo "Europe/Paris" > /etc/timezone \
        && date # Afficher la date pour vérifier qu elle est correcte après la configuration

    # Copier package.json et package-lock.json
    COPY package*.json ./

    # Installer les dépendances
    RUN npm install --omit=dev

    # Copier le reste du code source
    COPY src ./src
    COPY .env ./.env
    # La ligne 'COPY serviceAccountKey.json' a été supprimée car le fichier n'existe pas.
    # Si le fichier existe, assurez-vous qu'il est au bon endroit par rapport au Dockerfile
    # et que son nom est bien hygiene1-664ad-firebase-adminsdk.json
    # Si le fichier existe et est dans 'backend/firebase-admin-keys/', alors il n'y a pas besoin de COPY ici,
    # car il sera monté via le volume dans docker-compose.yml si tu utilises un volume pour le backend.
    # Si tu ne montes pas le dossier 'firebase-admin-keys' via un volume, et que tu veux le COPIER,
    # alors la ligne devrait être :
    # COPY firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json ./firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json
    # Mais si tu utilises un volume pour le dossier 'backend', il sera déjà là.

    # Exposer le port sur lequel l'application s'exécute
    EXPOSE 5001

    # Commande pour démarrer l'application
    CMD [ "node", "src/server.js" ]
    






# # Dockerfile
# FROM node:18-alpine

# # Définir l'environnement pour Node.js
# ENV NODE_ENV=production

# # Définir le répertoire de travail
# WORKDIR /usr/src/app

# # Installer tzdata pour la gestion des fuseaux horaires et curl pour les requêtes HTTP (si non déjà présent)
# # Utiliser un argument de build pour invalider le cache et forcer la mise à jour de tzdata
# ARG CACHE_BREAKER
# RUN apk add --no-cache tzdata curl \
#     && ln -snf /usr/share/zoneinfo/Europe/Paris /etc/localtime \
#     && echo "Europe/Paris" > /etc/timezone \
#     && date # Afficher la date pour vérifier qu'elle est correcte après la configuration

# # Copier package.json et package-lock.json
# COPY package*.json ./

# # Installer les dépendances
# # Utiliser --omit=dev pour ne pas installer les dépendances de développement en production
# RUN npm install --omit=dev

# # Copier le reste du code source
# COPY src ./src
# COPY .env ./.env
# COPY serviceAccountKey.json ./serviceAccountKey.json

# # Exposer le port sur lequel l'application s'exécute
# EXPOSE 5001

# # Commande pour démarrer l'application
# CMD [ "node", "src/index.js" ]







# FROM node:18-alpine

# # Définit le répertoire de travail dans le conteneur
# WORKDIR /usr/src/app

# # Installe curl (nécessaire pour le healthcheck)
# RUN apk add --no-cache curl # Pour les images basées sur Alpine (comme node:18-alpine)
# # Si tu utilises une image basée sur Debian/Ubuntu (comme node:18), utilise :
# # RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# # Copie package.json et package-lock.json pour installer les dépendances
# # Ceci est fait en premier pour tirer parti de la mise en cache de Docker
# COPY package*.json ./

# # Installe les dépendances du projet
# RUN npm install

# # Copie tout le reste du code de l'application dans le conteneur
# COPY src ./src
# # REMOVE THIS LINE: COPY .env ./.env  -- Les variables d'environnement seront passées via Docker Compose

# # Expose le port sur lequel ton application Express écoute
# EXPOSE 5001
# # Commande pour démarrer l'application
# # Utilise 'node src/server.js' car c'est le point d'entrée principal
# CMD ["node", "src/server.js"]