// frontend/src/services/alertService.js
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée

const API_URL = '/alerts'; // L'URL de base est déjà dans axiosInstance, donc juste le chemin relatif

const getMyAlerts = async () => {
    // Plus besoin de récupérer le token et de créer le config.headers ici,
    // l'intercepteur s'en charge automatiquement.
    const response = await axiosInstance.get(`${API_URL}/profile`);
    return response.data;
};

const markAlertAsRead = async (alertId) => {
    // Idem, l'intercepteur gère l'authentification.
    const response = await axiosInstance.put(`${API_URL}/${alertId}/read`, {});
    return response.data;
};

export {
    getMyAlerts,
    markAlertAsRead
};