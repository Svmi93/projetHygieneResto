# backend/Dockerfile

FROM node:18-alpine

# NODE_ENV sera défini par docker-compose.yml, donc cette ligne est retirée d'ici
# ENV NODE_ENV=production

WORKDIR /usr/src/app

# Installer curl (utile pour les healthchecks ou débogage)
# Suppression de tzdata car TZ est géré par docker-compose.yml
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY .env ./.env

# Pas besoin de créer le dossier 'uploads' ici si tu montes un volume dessus
# ou si tu laisses Express le créer lors du premier upload.
# La création est gérée par le photoController désormais.

EXPOSE 5001

CMD [ "node", "src/server.js" ]
        
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    # # backend/Dockerfile

    # FROM node:18-alpine

    # ENV NODE_ENV=production

    # WORKDIR /usr/src/app

    # ARG CACHE_BREAKER
    # RUN echo "Forcing rebuild for timezone setup: ${CACHE_BREAKER}" && \
    #     apk add --no-cache tzdata curl \
    #     && ln -snf /usr/share/zoneinfo/Europe/Paris /etc/localtime \
    #     && echo "Europe/Paris" > /etc/timezone \
    #     && date

    # COPY package*.json ./
    # RUN npm install --omit=dev

    # COPY src ./src
    # COPY .env ./.env

    # # Crée un répertoire pour les uploads.
    # # Si tu veux que les uploads persistent après la suppression du conteneur,
    # # tu devras monter un volume Docker pour ce dossier dans docker-compose.yml.
    # RUN mkdir -p uploads

    # EXPOSE 5001

    # CMD [ "node", "src/server.js" ]
    






    






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