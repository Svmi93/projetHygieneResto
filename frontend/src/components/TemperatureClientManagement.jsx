// frontend/src/components/TemperatureClientManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TemperatureClientManagement.css'; // Create this CSS file

const API_BASE_URL = 'http://localhost:5001/api/admin-client';

const TemperatureClientManagement = () => {
    const [records, setRecords] = useState([]);
    const [clients, setClients] = useState([]); // To populate client dropdown for adding/editing records
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [newRecord, setNewRecord] = useState({
        client_id: '', // Admin client selects which client
        type: '', location: '', temperature: '', notes: ''
    });

    const getToken = () => localStorage.getItem('userToken');

    // Fetch all records for clients associated with this admin_client
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/temperatures`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setRecords(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors de la récupération des relevés pour admin client:', err);
            setError(err.response?.data?.message || 'Impossible de charger les relevés. Accès refusé ou erreur serveur.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch clients managed by this admin_client (for dropdowns)
    const fetchClientsForDropdown = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/clients`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setClients(response.data);
        } catch (err) {
            console.error('Erreur lors de la récupération des clients pour le sélecteur:', err);
        }
    };

    const addRecord = async (recordData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/temperatures`, recordData, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            // Re-fetch records to get the full data including timestamp from DB
            fetchRecords();
            setNewRecord({ client_id: '', type: '', location: '', temperature: '', notes: '' });
            setError(null);
            alert('Relevé ajouté avec succès!');
        } catch (err) {
            console.error('Erreur lors de l\'ajout du relevé:', err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout du relevé.');
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
        fetchClientsForDropdown();
    }, []);

    const handleNewRecordChange = (e) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleEditRecordChange = (e) => {
        const { name, value } = e.target;
        setEditingRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleNewRecordSubmit = (e) => {
        e.preventDefault();
        addRecord(newRecord);
    };

    const handleEditRecordSubmit = (e) => {
        e.preventDefault();
        updateRecord(editingRecord.id, editingRecord);
    };

    if (loading) return <div className="loading-message">Chargement des relevés...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="temp-client-management-container">
            <h2>Gérer les Relevés de Mes Clients</h2>

            <section className="add-record-section">
                <h3>Ajouter un nouveau relevé pour un client</h3>
                <form onSubmit={handleNewRecordSubmit}>
                    <select name="client_id" value={newRecord.client_id} onChange={handleNewRecordChange} required>
                        <option value="">Sélectionner un client</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.nom_entreprise} ({client.nom_client} {client.prenom_client})</option>
                        ))}
                    </select>
                    <select name="type" value={newRecord.type} onChange={handleNewRecordChange} required>
                        <option value="">Sélectionner un type</option>
                        <option value="frigo-positif">Réfrigérateur (+)</option>
                        <option value="frigo-negatif">Congélateur (-)</option>
                        <option value="livraison">Livraison</option>
                        <option value="chambre-froide">Chambre Froide</option>
                    </select>
                    <input type="text" name="location" placeholder="Localisation" value={newRecord.location} onChange={handleNewRecordChange} required />
                    <input type="number" name="temperature" placeholder="Température (°C)" value={newRecord.temperature} onChange={handleNewRecordChange} step="0.1" required />
                    <textarea name="notes" placeholder="Notes (facultatif)" value={newRecord.notes} onChange={handleNewRecordChange}></textarea>
                    <button type="submit" className="add-button">Ajouter Relevé</button>
                </form>
            </section>

            <section className="records-list-section">
                <h3>Liste des Relevés de Mes Clients</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
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
                                <td>{record.nom_entreprise} ({record.nom_client})</td>
                                <td>{record.type}</td>
                                <td>{record.location}</td>
                                <td>{record.temperature}</td>
                                <td>{new Date(record.timestamp).toLocaleString()}</td>
                                <td>{record.notes || '-'}</td>
                                <td className="actions-cell">
                                    <button onClick={() => setEditingRecord({ ...record, client_id: record.user_id })} className="edit-button">Éditer</button>
                                    <button onClick={() => deleteRecord(record.id)} className="delete-button">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {editingRecord && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Éditer Relevé</h3>
                        <form onSubmit={handleEditRecordSubmit}>
                            <label>Client:</label>
                            <select name="client_id" value={editingRecord.client_id} onChange={handleEditRecordChange} disabled>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.nom_entreprise}</option>
                                ))}
                            </select>
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

export default TemperatureClientManagement;