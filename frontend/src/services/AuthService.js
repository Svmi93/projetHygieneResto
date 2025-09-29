// frontend/src/services/AuthService.js (Version corrigée)
import axiosInstance from '../api/axiosInstance';

const AUTH_API_URL = '/auth';

const AuthService = {
    login: async (email, password) => {
        try {
            const response = await axiosInstance.post(`${AUTH_API_URL}/login`, { email, password });
            // Laisse AuthContext stocker le token et les infos user
            localStorage.setItem('userToken', response.data.token); // Le token est le seul que AuthService peut stocker directement
            return response.data; // Retourne toutes les données (token et user)
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            throw error;
        }
    },

    register: async (userData) => {
        try {
            const response = await axiosInstance.post(`${AUTH_API_URL}/register`, userData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            throw error;
        }
    },

    verifyToken: async () => {
        try {
            const response = await axiosInstance.get(`${AUTH_API_URL}/verify-token`);
            console.log('AuthService: verifyToken response:', response);
            // Ne stocke plus 'user' ici. AuthContext gère cela.
            return response.data.user; // Retourne l'objet user directement
        } catch (error) {
            console.error('Erreur de vérification du token:', error);
            AuthService.logout(); // On déconnecte en cas d'erreur
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('user'); // Important de garder cette ligne ici si d'autres parties du code s'attendent à ce que 'user' soit là, même si AuthContext le gère aussi. AuthContext.logout() est la source de vérité.
        console.log('Token et informations utilisateur supprimés du localStorage.');
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user'); // C'est OK ici car c'est une fonction utilitaire pour LIRE
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error("Erreur lors de la lecture de l'utilisateur depuis localStorage:", error);
            return null;
        }
    }
};

export default AuthService;







