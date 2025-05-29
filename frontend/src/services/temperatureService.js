// frontend/src/services/temperatureService.js
import axiosInstance from '../api/axiosInstance'; // Assurez-vous que le chemin est correct

const API_URL = '/temperatures'; // Endpoint pour les relevés de température

// Fonction pour récupérer les relevés de température des employés (pour l'admin client)
const getTemperatureRecordsForAdminClient = async (adminClientId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/admin-client/${adminClientId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des relevés de température pour l\'admin client:', error);
    throw error;
  }
};

// Fonction pour ajouter un relevé de température (pour l'admin client)
// Note: Le backend s'attend à ce que l'employé soit lié à l'admin_client du token.
const addTemperatureRecord = async (employeeId, temperature, recordDate) => {
  try {
    const response = await axiosInstance.post(API_URL, { employeeId, temperature, recordDate });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du relevé de température:', error);
    throw error;
  }
};

// Fonction pour mettre à jour un relevé de température (pour l'admin client)
const updateTemperatureRecord = async (recordId, temperature, recordDate) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/${recordId}`, { temperature, recordDate });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du relevé de température:', error);
    throw error;
  }
};

// Fonction pour supprimer un relevé de température (pour l'admin client)
const deleteTemperatureRecord = async (recordId) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du relevé de température:', error);
    throw error;
  }
};


// Ajoutez d'autres fonctions si nécessaire, par exemple pour un employé (employeur)
// Pour un employé, l'endpoint serait différent, et potentiellement juste un post pour lui-même
const addTemperatureRecordForEmployee = async (temperature, recordDate) => {
  try {
    // L'ID de l'employé est probablement géré par le backend via le token
    const response = await axiosInstance.post(`${API_URL}/employee`, { temperature, recordDate });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du relevé de température par l\'employé:', error);
    throw error;
  }
};

const getTemperatureRecordsForEmployee = async (employeeId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/employee/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching temperature records for employee:', error);
        throw error;
    }
};

// NOUVELLE FONCTION: getTemperatureRecords (générique pour TemperatureRecordsPage.jsx)
// Cette fonction tente de récupérer les relevés en fonction du rôle de l'utilisateur connecté.
const getTemperatureRecords = async () => {
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');

  if (!userRole || !userId) {
    // Si l'utilisateur n'est pas connecté ou si les informations sont manquantes,
    // on ne peut pas récupérer les relevés spécifiques.
    console.warn('Impossible de récupérer les relevés: rôle ou ID utilisateur manquant. Retourne un tableau vide.');
    return []; // Retourne un tableau vide pour éviter les erreurs
  }

  try {
    if (userRole === 'employer' || userRole === 'client') { // Si le rôle est 'employer' ou 'client'
      // Récupère les relevés spécifiques à cet employé
      return await getTemperatureRecordsForEmployee(userId);
    } else if (userRole === 'admin_client') {
      // Pour un admin_client, il faudrait potentiellement une logique pour récupérer
      // les relevés de TOUS ses employés.
      // La fonction `getTemperatureRecordsForAdminClient` prend un `adminClientId`
      // qui doit être le SIRET de l'admin client, pas son ID utilisateur.
      // Il faudrait adapter cette logique ou s'assurer que `TemperatureRecordsPage.jsx`
      // appelle la fonction spécifique appropriée.
      console.warn('getTemperatureRecords n\'est pas optimisé pour le rôle admin_client dans ce contexte. Retourne un tableau vide.');
      return [];
    } else if (userRole === 'super_admin') {
      // Pour un super_admin, il faudrait un endpoint pour récupérer TOUS les relevés
      // de tous les utilisateurs du système.
      // Exemple: `axiosInstance.get('/admin/temperatures');`
      console.warn('getTemperatureRecords n\'est pas optimisé pour le rôle super_admin dans ce contexte. Retourne un tableau vide.');
      return [];
    } else {
      console.warn('Rôle utilisateur non géré par getTemperatureRecords:', userRole);
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des relevés de température (générique):', error);
    throw error;
  }
};


export {
  getTemperatureRecordsForAdminClient,
  addTemperatureRecord,
  updateTemperatureRecord,
  deleteTemperatureRecord,
  addTemperatureRecordForEmployee,
  getTemperatureRecordsForEmployee,
  getTemperatureRecords // Export de la nouvelle fonction générique
};









// // Adresse de base de ton API backend
// // Assure-toi que cela correspond au port que ton Docker Compose expose pour l'API (5001)
// const API_BASE_URL = 'http://localhost:5001/api';

// // Fonction pour récupérer tous les relevés de température
// export const getTemperatureRecords = async () => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/temperatures`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 // Si ton API requiert une authentification (token JWT, etc.), ajoute:
//                 // 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             },
//         });

//         // Gère les réponses HTTP qui ne sont pas 2xx (OK)
//         if (!response.ok) {
//             // Essaie de parser la réponse d'erreur de l'API si disponible
//             const errorData = await response.json();
//             throw new Error(errorData.message || `Erreur HTTP: ${response.status} ${response.statusText}`);
//         }
//         // Retourne les données parsées si la réponse est OK
//         return await response.json();
//     } catch (error) {
//         console.error("Erreur dans getTemperatureRecords:", error);
//         throw error; // Propage l'erreur pour que le composant puisse la gérer
//     }
// };

// // Fonction pour ajouter un nouveau relevé de température
// export const addTemperatureRecord = async (recordData) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/temperatures`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 // 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             },
//             body: JSON.stringify(recordData), // Convertit l'objet JS en chaîne JSON
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || `Erreur HTTP: ${response.status} ${response.statusText}`);
//         }
//         return await response.json(); // L'API devrait renvoyer le relevé ajouté (avec son ID)
//     } catch (error) {
//         console.error("Erreur dans addTemperatureRecord:", error);
//         throw error;
//     }
// };

// // --- Fonctions de mise à jour et suppression (pour référence, non utilisées actuellement) ---

// // Fonction pour mettre à jour un relevé de température existant
// export const updateTemperatureRecord = async (id, updatedData) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/temperatures/${id}`, {
//             method: 'PUT', // Ou PATCH, selon ton API backend
//             headers: {
//                 'Content-Type': 'application/json',
//                 // 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             },
//             body: JSON.stringify(updatedData),
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || `Erreur lors de la mise à jour du relevé avec l'ID ${id}`);
//         }
//         return await response.json(); // L'API pourrait renvoyer le relevé mis à jour
//     } catch (error) {
//         console.error(`Erreur dans updateTemperatureRecord pour l'ID ${id}:`, error);
//         throw error;
//     }
// };

// // Fonction pour supprimer un relevé de température
// export const deleteTemperatureRecord = async (id) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/temperatures/${id}`, {
//             method: 'DELETE',
//             headers: {
//                 'Content-Type': 'application/json',
//                 // 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             },
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || `Erreur lors de la suppression du relevé avec l'ID ${id}`);
//         }
//         // Pour une suppression réussie, l'API renvoie souvent un statut 204 No Content.
//         // Il n'y a donc rien à parser avec .json() dans ce cas.
//         return { message: 'Relevé supprimé avec succès' };
//     } catch (error) {
//         console.error(`Erreur dans deleteTemperatureRecord pour l'ID ${id}:`, error);
//         throw error;
//     }
// };