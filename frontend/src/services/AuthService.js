// frontend/src/services/AuthService.js (Version mise à jour)
import axiosInstance from '../api/axiosInstance'; // Importe votre instance Axios configurée

const TOKEN_KEY = 'authToken'; // Clé pour stocker le token dans localStorage

const AuthService = {
  // Fonction de connexion
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
      localStorage.setItem(TOKEN_KEY, token); // Stocke le token dans localStorage
      return { token, user }; // Renvoie le token et l'objet utilisateur
    } catch (error) {
      console.error('Erreur de connexion:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // Fonction d'inscription
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
      localStorage.setItem(TOKEN_KEY, token); // Stocke le token dans localStorage
      return { token, user }; // Renvoie le token et l'objet utilisateur
    } catch (error) {
      console.error('Erreur d\'inscription:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // Fonction de déconnexion
  logout: () => {
    localStorage.removeItem(TOKEN_KEY); // Supprime le token du localStorage
    // L'intercepteur Axios sera mis à jour via AuthContext
    console.log("Token supprimé du localStorage.");
  },

  // Fonction pour obtenir le token actuel du localStorage
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Nouvelle fonction pour vérifier le token auprès du backend
  // Elle n'a pas besoin de prendre le token en argument car il est déjà dans l'intercepteur Axios
  // C'est pourquoi elle ne prend plus `token` en paramètre, car Axios l'ajoutera.
  verifyToken: async () => {
    const storedToken = AuthService.getToken();
    if (!storedToken) {
      console.log("Aucun token trouvé dans le localStorage pour vérification.");
      return null;
    }
    try {
      // AxiosInstance est déjà configuré pour ajouter l'en-tête Authorization
      // Pas besoin d'envoyer le token dans le corps de la requête ou dans un header spécifique ici
      const response = await axiosInstance.post('/auth/verify-token');
      // Le backend doit renvoyer un objet { user: userData }
      return response.data.user;
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      // Gérer l'erreur: si le token est invalide ou expiré, on se déconnecte
      AuthService.logout(); // Supprime le token invalide du localStorage
      return null;
    }
  }
};

export default AuthService;
// Vous pouvez ajouter d'autres fonctions d'authentification ici si nécessaire