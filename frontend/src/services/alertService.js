// frontend/src/services/alertService.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/alerts'; // L'URL de votre API

const getMyAlerts = async () => {
    const token = localStorage.getItem('userToken');
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    const response = await axios.get(`${API_URL}/profile`, config);
    return response.data;
};

const markAlertAsRead = async (alertId) => {
    const token = localStorage.getItem('userToken');
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    const response = await axios.put(`${API_URL}/${alertId}/read`, {}, config);
    return response.data;
};

export {
    getMyAlerts,
    markAlertAsRead
};