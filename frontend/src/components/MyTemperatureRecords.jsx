// frontend/src/components/MyTemperatureRecords.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyTemperatureRecords.css'; // Create this CSS file

const API_BASE_URL = 'http://localhost:5001/api/client';

const MyTemperatureRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    const getToken = () => localStorage.getItem('userToken');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/temperatures`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setRecords(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors de la récupération de mes relevés:', err);
            setError(err.response?.data?.message || 'Impossible de charger vos relevés. Accès refusé ou erreur serveur.');
        } finally {
            setLoading(false);
        }
    };

    const updateRecord = async (id, updatedData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/temperatures/${id}`, updatedData, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setRecords(records.map(rec => rec.id === id ? response.data : rec));
            setEditingRecord(null);
            setError(null);
            alert('Relevé mis à jour avec succès!');
        } catch (err) {
            console.error('Erreur lors de la mise à jour du relevé:', err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du relevé.');
        }
    };

    const deleteRecord = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce relevé?')) {
            try {
                await axios.delete(`${API_BASE_URL}/temperatures/${id}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                setRecords(records.filter(rec => rec.id !== id));
                setError(null);
                alert('Relevé supprimé avec succès!');
            } catch (err) {
                console.error('Erreur lors de la suppression du relevé:', err.response ? err.response.data : err);
                setError(err.response?.data?.message || 'Erreur lors de la suppression du relevé.');
            }
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleEditRecordChange = (e) => {
        const { name, value } = e.target;
        setEditingRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleEditRecordSubmit = (e) => {
        e.preventDefault();
        updateRecord(editingRecord.id, editingRecord);
    };

    if (loading) return <div className="loading-message">Chargement de vos relevés...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="my-temperature-records-container">
            <h2>Mes Relevés de Température</h2>

            <section className="records-list-section">
                {records.length === 0 ? (
                    <p>Aucun relevé enregistré pour le moment. Saisissez-en un nouveau via l'onglet "Saisir un relevé".</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Localisation</th>
                                <th>Temp. (°C)</th>
                                <th>Date/Heure</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id}>
                                    <td>{record.type}</td>
                                    <td>{record.location}</td>
                                    <td>{record.temperature}</td>
                                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                                    <td>{record.notes || '-'}</td>
                                    <td className="actions-cell">
                                        <button onClick={() => setEditingRecord({ ...record })} className="edit-button">Éditer</button>
                                        <button onClick={() => deleteRecord(record.id)} className="delete-button">Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {editingRecord && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Éditer Relevé</h3>
                        <form onSubmit={handleEditRecordSubmit}>
                            <label>Type:</label>
                            <select name="type" value={editingRecord.type} onChange={handleEditRecordChange} required>
                                <option value="frigo-positif">Réfrigérateur (+)</option>
                                <option value="frigo-negatif">Congélateur (-)</option>
                                <option value="livraison">Livraison</option>
                                <option value="chambre-froide">Chambre Froide</option>
                            </select>
                            <label>Localisation:</label>
                            <input type="text" name="location" value={editingRecord.location} onChange={handleEditRecordChange} required />
                            <label>Température (°C):</label>
                            <input type="number" name="temperature" value={editingRecord.temperature} onChange={handleEditRecordChange} step="0.1" required />
                            <label>Notes:</label>
                            <textarea name="notes" value={editingRecord.notes || ''} onChange={handleEditRecordChange}></textarea>
                            <div className="modal-buttons">
                                <button type="submit" className="save-button">Enregistrer</button>
                                <button type="button" onClick={() => setEditingRecord(null)} className="cancel-button">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTemperatureRecords;