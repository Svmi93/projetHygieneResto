// frontend/src/services/AuthService.js
import axiosInstance from '../api/axiosInstance'; // Assurez-vous que ce chemin est correct

// L'URL de base pour les requêtes d'authentification.
// Puisque axiosInstance.baseURL est 'http://localhost:5001/api',
// AUTH_API_URL doit être '/auth' pour former des chemins comme '/api/auth/login'.
const AUTH_API_URL = '/auth'; // <--- CORRECTION ICI

const AuthService = {
    // Fonction de connexion de l'utilisateur
    login: async (email, password) => {
        try {
            const response = await axiosInstance.post(`${AUTH_API_URL}/login`, { email, password });
            // Stocke le token et les informations utilisateur dans le localStorage
            // Utilisez 'userToken' pour être cohérent avec l'intercepteur Axios
            localStorage.setItem('userToken', response.data.token); // <--- CORRECTION ICI
            localStorage.setItem('user', JSON.stringify(response.data.user)); // Stocke les infos utilisateur
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            // Propage l'erreur pour qu'elle puisse être gérée par le composant appelant (LoginPage)
            throw error;
        }
    },

    // Fonction d'enregistrement d'un nouvel utilisateur (par exemple, admin_client)
    register: async (userData) => {
        try {
            const response = await axiosInstance.post(`${AUTH_API_URL}/register`, userData);
            // Pour l'inscription, nous ne connectons pas automatiquement l'utilisateur
            // Le composant RegisterAdminClientPage gérera la redirection vers la page de connexion
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            throw error;
        }
    },

    // Fonction pour vérifier la validité du token existant
    verifyToken: async () => {
        try {
            // Utilise une requête GET pour vérifier le token. Le middleware backend s'en chargera.
            const response = await axiosInstance.get(`${AUTH_API_URL}/verify-token`);
            // Si la réponse est positive, le token est valide et contient les infos utilisateur
            return response.data.user; // Retourne directement l'objet utilisateur
        } catch (error) {
            console.error('Erreur de vérification du token:', error);
            // En cas d'échec de vérification (token invalide/expiré), déconnecte l'utilisateur
            AuthService.logout();
            throw error; // Propage l'erreur pour que AuthContext puisse la gérer
        }
    },

    // Fonction de déconnexion
    logout: () => {
        // Supprime toutes les informations d'authentification du localStorage
        localStorage.removeItem('userToken'); // <--- CORRECTION ICI
        localStorage.removeItem('user');
        console.log('Token et informations utilisateur supprimés du localStorage.');
    },

    // Fonction pour récupérer l'utilisateur actuellement connecté depuis le localStorage
    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error("Erreur lors de la lecture de l'utilisateur depuis localStorage:", error);
            return null;
        }
    }
};

export default AuthService;










// // frontend/src/services/AuthService.js (Ne change rien, déjà cohérent pour x-auth-token)
// import axiosInstance from '../api/axiosInstance';

// const TOKEN_KEY = 'authToken'; // Clé pour stocker le token dans localStorage

// // Fonction pour configurer l'en-tête d'autorisation pour Axios
// // Cette fonction est appelée par l'intercepteur et par les fonctions login/register/logout.
// const setAuthHeader = (token) => {
//   if (token) {
//     axiosInstance.defaults.headers.common['x-auth-token'] = token;
//   } else {
//     delete axiosInstance.defaults.headers.common['x-auth-token'];
//   }
// };

// const AuthService = {
//   // Récupère le token du localStorage
//   getToken: () => {
//     return localStorage.getItem(TOKEN_KEY);
//   },

//   // Fonction de connexion
//   login: async (email, password) => {
//     try {
//       const response = await axiosInstance.post('/auth/login', { email, password });
//       const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
//       localStorage.setItem(TOKEN_KEY, token); // Stocke le token dans localStorage
//       setAuthHeader(token); // Configure l'en-tête Axios immédiatement après la connexion
//       return { token, user }; // Renvoie le token et l'objet utilisateur
//     } catch (error) {
//       console.error('Erreur de connexion:', error.response?.data?.message || error.message);
//       throw error; // Propage l'erreur pour la gestion côté composant
//     }
//   },

//   // Fonction d'inscription
//   register: async (userData) => {
//     try {
//       const response = await axiosInstance.post('/auth/register', userData);
//       const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
//       localStorage.setItem(TOKEN_KEY, token);
//       setAuthHeader(token); // Configure l'en-tête Axios immédiatement après l'inscription
//       return { token, user }; // Renvoie le token et l'objet utilisateur
//     } catch (error) {
//       console.error('Erreur d\'inscription:', error.response?.data?.message || error.message);
//       throw error; // Propage l'erreur
//     }
//   },

//   // Fonction de déconnexion
//   logout: () => {
//     localStorage.removeItem(TOKEN_KEY); // Supprime le token du localStorage
//     setAuthHeader(null); // Nettoie l'en-tête Axios
//     console.log("Token supprimé du localStorage.");
//   },

//   // Fonction de vérification du token (appelée au chargement de l'application)
//   verifyToken: async () => {
//     const storedToken = AuthService.getToken();
//     if (!storedToken) {
//       console.warn("Aucun token trouvé dans le localStorage pour vérification.");
//       return null;
//     }
//     try {
//       // AxiosInstance est déjà configuré pour ajouter l'en-tête x-auth-token grâce à l'intercepteur
//       const response = await axiosInstance.post('/auth/verify-token');
//       // Le backend doit renvoyer un objet { user: userData }
//       return response.data.user; // Retourne l'objet user directement
//     } catch (error) {
//       console.error('Erreur de vérification du token:', error);
//       // Si le token est invalide ou expiré, on se déconnecte pour nettoyer l'état
//       AuthService.logout();
//       return null;
//     }
//   }
// };

// // Configuration de l'intercepteur Axios pour ajouter le token aux requêtes
// // S'assure que l'en-tête 'x-auth-token' est toujours à jour pour chaque requête sortante
// axiosInstance.interceptors.request.use(config => {
//   const token = AuthService.getToken();
//   // setAuthHeader est appelé ici pour s'assurer que l'en-tête est toujours présent,
//   // même si la page est rafraîchie ou si l'application démarre.
//   // Cela gère le cas où AuthContext n'a pas encore fini de s'initialiser.
//   if (token) {
//     config.headers['x-auth-token'] = token;
//   } else {
//     delete config.headers['x-auth-token'];
//   }
//   return config;
// }, error => Promise.reject(error));

// export default AuthService;







// // frontend/src/services/AuthService.js (Version mise à jour)
// import axiosInstance from '../api/axiosInstance'; // Importe votre instance Axios configurée

// const TOKEN_KEY = 'authToken'; // Clé pour stocker le token dans localStorage

// const AuthService = {
//   // Fonction de connexion
//   login: async (email, password) => {
//     try {
//       const response = await axiosInstance.post('/auth/login', { email, password });
//       const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
//       localStorage.setItem(TOKEN_KEY, token); // Stocke le token dans localStorage
//       return { token, user }; // Renvoie le token et l'objet utilisateur
//     } catch (error) {
//       console.error('Erreur de connexion:', error.response?.data?.message || error.message);
//       throw error;
//     }
//   },

//   // Fonction d'inscription
//   register: async (userData) => {
//     try {
//       const response = await axiosInstance.post('/auth/register', userData);
//       const { token, user } = response.data; // Le backend renvoie maintenant un objet 'user'
//       localStorage.setItem(TOKEN_KEY, token); // Stocke le token dans localStorage
//       return { token, user }; // Renvoie le token et l'objet utilisateur
//     } catch (error) {
//       console.error('Erreur d\'inscription:', error.response?.data?.message || error.message);
//       throw error;
//     }
//   },

//   // Fonction de déconnexion
//   logout: () => {
//     localStorage.removeItem(TOKEN_KEY); // Supprime le token du localStorage
//     // L'intercepteur Axios sera mis à jour via AuthContext
//     console.log("Token supprimé du localStorage.");
//   },

//   // Fonction pour obtenir le token actuel du localStorage
//   getToken: () => {
//     return localStorage.getItem(TOKEN_KEY);
//   },

//   // Nouvelle fonction pour vérifier le token auprès du backend
//   // Elle n'a pas besoin de prendre le token en argument car il est déjà dans l'intercepteur Axios
//   // C'est pourquoi elle ne prend plus `token` en paramètre, car Axios l'ajoutera.
//   verifyToken: async () => {
//     const storedToken = AuthService.getToken();
//     if (!storedToken) {
//       console.log("Aucun token trouvé dans le localStorage pour vérification.");
//       return null;
//     }
//     try {
//       // AxiosInstance est déjà configuré pour ajouter l'en-tête Authorization
//       // Pas besoin d'envoyer le token dans le corps de la requête ou dans un header spécifique ici
//       const response = await axiosInstance.post('/auth/verify-token');
//       // Le backend doit renvoyer un objet { user: userData }
//       return response.data.user;
//     } catch (error) {
//       console.error('Erreur de vérification du token:', error);
//       // Gérer l'erreur: si le token est invalide ou expiré, on se déconnecte
//       AuthService.logout(); // Supprime le token invalide du localStorage
//       return null;
//     }
//   }
// };

// export default AuthService;
// // Vous pouvez ajouter d'autres fonctions d'authentification ici si nécessaire