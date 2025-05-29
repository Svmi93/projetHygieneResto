// frontend/src/api/axiosInstance.js
import axios from 'axios';

// Crée une instance Axios personnalisée
const axiosInstance = axios.create({
  // L'URL de base de ton API backend.
  // Assure-toi que cela correspond au port que ton Docker Compose expose pour l'API (5001).
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // 'withCredentials' est important si tu utilises des cookies ou des sessions basées sur des cookies
  // entre ton frontend et ton backend. Si tu n'utilises que des tokens JWT dans les headers,
  // tu peux le laisser à 'false' ou l'omettre.
  withCredentials: true,
});

// Intercepteur de requêtes : ajoute le token JWT à chaque requête sortante
// Cela évite de devoir ajouter manuellement l'en-tête 'Authorization' à chaque appel.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken'); // Récupère le token depuis le localStorage
    if (token) {
      // Si un token existe, l'ajoute à l'en-tête 'Authorization'
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retourne la configuration de la requête modifiée
  },
  (error) => {
    // Gère les erreurs lors de la préparation de la requête
    return Promise.reject(error);
  }
);

// Intercepteur de réponses : gère les erreurs d'authentification/autorisation de manière globale
// Si le backend renvoie un statut 401 ou 403, cela signifie que le token est invalide ou expiré.
axiosInstance.interceptors.response.use(
  (response) => response, // Si la réponse est bonne (statut 2xx), la passe directement
  (error) => {
    // Vérifie si l'erreur provient d'une réponse HTTP et si le statut est 401 ou 403
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Erreur d\'authentification/autorisation détectée. Déconnexion forcée.');
      // Déconnecte l'utilisateur en supprimant tous les tokens et informations de rôle du localStorage
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');

      // Redirige l'utilisateur vers la page de connexion.
      // 'window.location.href' force un rechargement complet de la page,
      // ce qui est souvent plus sûr pour réinitialiser complètement l'état de l'application après une déconnexion forcée.
      // Assure-toi que '/login' est bien la route de ta page de connexion.
      window.location.href = '/login';
    }
    // Propage l'erreur pour que le code appelant (dans les composants/services) puisse la gérer aussi
    return Promise.reject(error);
  }
);

export default axiosInstance; // Exporte l'instance Axios configurée pour être utilisée partout
