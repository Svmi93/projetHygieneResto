// Adresse de base de ton API backend
// Assure-toi que cela correspond au port que ton Docker Compose expose pour l'API (5001)
const API_BASE_URL = 'http://localhost:5001/api';

// Fonction pour récupérer tous les relevés de température
export const getTemperatureRecords = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/temperatures`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Si ton API requiert une authentification (token JWT, etc.), ajoute:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        });

        // Gère les réponses HTTP qui ne sont pas 2xx (OK)
        if (!response.ok) {
            // Essaie de parser la réponse d'erreur de l'API si disponible
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        // Retourne les données parsées si la réponse est OK
        return await response.json();
    } catch (error) {
        console.error("Erreur dans getTemperatureRecords:", error);
        throw error; // Propage l'erreur pour que le composant puisse la gérer
    }
};

// Fonction pour ajouter un nouveau relevé de température
export const addTemperatureRecord = async (recordData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/temperatures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(recordData), // Convertit l'objet JS en chaîne JSON
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        return await response.json(); // L'API devrait renvoyer le relevé ajouté (avec son ID)
    } catch (error) {
        console.error("Erreur dans addTemperatureRecord:", error);
        throw error;
    }
};

// --- Fonctions de mise à jour et suppression (pour référence, non utilisées actuellement) ---

// Fonction pour mettre à jour un relevé de température existant
export const updateTemperatureRecord = async (id, updatedData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/temperatures/${id}`, {
            method: 'PUT', // Ou PATCH, selon ton API backend
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur lors de la mise à jour du relevé avec l'ID ${id}`);
        }
        return await response.json(); // L'API pourrait renvoyer le relevé mis à jour
    } catch (error) {
        console.error(`Erreur dans updateTemperatureRecord pour l'ID ${id}:`, error);
        throw error;
    }
};

// Fonction pour supprimer un relevé de température
export const deleteTemperatureRecord = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/temperatures/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur lors de la suppression du relevé avec l'ID ${id}`);
        }
        // Pour une suppression réussie, l'API renvoie souvent un statut 204 No Content.
        // Il n'y a donc rien à parser avec .json() dans ce cas.
        return { message: 'Relevé supprimé avec succès' };
    } catch (error) {
        console.error(`Erreur dans deleteTemperatureRecord pour l'ID ${id}:`, error);
        throw error;
    }
};