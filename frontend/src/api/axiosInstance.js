// frontend/src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api', // Assurez-vous que cette URL est correcte pour votre backend
    withCredentials: true, // Important pour les cookies et sessions si vous les utilisez
});

// Intercepteur de requêtes pour ajouter le token JWT
axiosInstance.interceptors.request.use(
    (config) => {
        // Récupère le token depuis le localStorage
        const token = localStorage.getItem('userToken'); // Assurez-vous que la clé est 'userToken'

        // Si un token existe, ajoute-le à l'en-tête Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Si votre backend attend un en-tête 'x-auth-token' au lieu de 'Authorization', utilisez la ligne ci-dessous :
            // config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur de réponses pour gérer les erreurs d'authentification (ex: 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si l'erreur est un 401 (Unauthorized) ou 403 (Forbidden), cela peut indiquer un token invalide ou expiré
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('Erreur d\'authentification (401/403). Déconnexion de l\'utilisateur.');
            // Ne pas importer AuthService ici pour éviter les dépendances circulaires.
            // La déconnexion doit être gérée par le AuthContext ou le composant appelant.
            // Pour l'instant, on se contente de logguer l'erreur.
            // Si vous voulez une déconnexion automatique ici, vous devrez
            // gérer la logique de manière plus avancée (ex: en utilisant un événement global ou un hook).
            // Pour ce cas, le AuthContext.jsx gère déjà la déconnexion si verifyToken échoue.
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
