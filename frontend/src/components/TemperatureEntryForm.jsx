// frontend/src/components/TemperatureEntryForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './TemperatureEntryForm.css'; // Create this CSS file

const API_BASE_URL = 'http://localhost:5001/api/client';

const TemperatureEntryForm = () => {
    const [newRecord, setNewRecord] = useState({
        type: '', location: '', temperature: '', notes: ''
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const getToken = () => localStorage.getItem('userToken');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!newRecord.type || !newRecord.location || newRecord.temperature === '') {
            setError("Veuillez remplir tous les champs obligatoires : Type, Localisation, Température.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/temperatures`, newRecord, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setMessage('Relevé de température ajouté avec succès!');
            setNewRecord({ type: '', location: '', temperature: '', notes: '' }); // Reset form
            console.log("Record added:", response.data);
            // Optionally, refresh the MyTemperatureRecords component if it's visible
            // You might use a global state management or a callback prop for this
        } catch (err) {
            console.error('Erreur lors de l\'ajout du relevé:', err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout du relevé.');
        }
    };

    return (
        <div className="temperature-entry-form-container">
            <h2>Saisir un nouveau relevé de température</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="type">Type de matériel/Produit:</label>
                    <select name="type" id="type" value={newRecord.type} onChange={handleChange} required>
                        <option value="">Sélectionner un type</option>
                        <option value="frigo-positif">Réfrigérateur (+)</option>
                        <option value="frigo-negatif">Congélateur (-)</option>
                        <option value="livraison">Livraison</option>
                        <option value="chambre-froide">Chambre Froide</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="location">Localisation/Description:</label>
                    <input
                        type="text"
                        name="location"
                        id="location"
                        value={newRecord.location}
                        onChange={handleChange}
                        placeholder="Ex: Réfrigérateur Légumes, Liv. Poisson"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="temperature">Température (°C):</label>
                    <input
                        type="number"
                        name="temperature"
                        id="temperature"
                        value={newRecord.temperature}
                        onChange={handleChange}
                        step="0.1"
                        required
                    />
                </div>

                {/* Date/Time is now handled by backend (auto-incremented) */}
                <div className="form-group">
                    <label>Date et Heure:</label>
                    <input type="text" value="Automatique (enregistré par le serveur)" disabled />
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notes (facultatif):</label>
                    <textarea
                        name="notes"
                        id="notes"
                        value={newRecord.notes}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Conditions particulières, actions correctives..."
                    ></textarea>
                </div>

                <button type="submit">Enregistrer le relevé</button>
            </form>
        </div>
    );
};

export default TemperatureEntryForm;