// frontend/src/services/alertService.js
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée

const API_URL = '/alerts'; // L'URL de base est déjà dans axiosInstance, donc juste le chemin relatif

export const getMyAlerts = async () => {
    try {
        // CORRIGÉ : Utilise la route /my-alerts définie dans le backend
        // L'intercepteur axiosInstance s'occupe déjà d'ajouter le token d'authentification.
        const response = await axiosInstance.get(`${API_URL}/my-alerts`); // CHANGEMENT ICI : /profile devient /my-alerts
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        throw error;
    }
};

export const markAlertAsRead = async (alertId) => {
    try {
        // Cette partie est déjà correcte, elle utilise la route /:id/read définie dans le backend.
        const response = await axiosInstance.put(`${API_URL}/${alertId}/read`, {});
        return response.data;
    } catch (error) {
        console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
        throw error;
    }
};

// Exportez les fonctions pour qu'elles soient utilisables par d'autres composants
// Si vous avez déjà 'export const' devant les fonctions, cette ligne n'est pas strictement nécessaire
// mais elle ne fait pas de mal.
// export {
//     getMyAlerts,
//     markAlertAsRead
// };
