// frontend/src/pages/TemperatureRecordsPage.jsx
import React, { useState, useEffect } from 'react';
import './TemperatureRecordsPage.css'; // Importe le CSS spécifique à cette page
// Assure-toi que le chemin est correct : un niveau au-dessus (..) puis dans 'services'
import { getTemperatureRecords, addTemperatureRecord } from '../services/temperatureService';

const TemperatureRecordsPage = () => {
    // États pour gérer les relevés, le nouveau relevé, le chargement et les erreurs
    const [records, setRecords] = useState([]);
    const [newRecord, setNewRecord] = useState({
        type: '', // Ex: 'frigo-positif', 'frigo-negatif', 'livraison'
        location: '', // Ex: 'Réfrigérateur 1', 'Congélateur principal'
        temperature: '',
        // Formate la date et l'heure actuelles pour le champ datetime-local
        timestamp: new Date().toISOString().slice(0, 16),
        notes: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effet pour charger les relevés existants au montage du composant
    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                const data = await getTemperatureRecords(); // Appel API via le service
                setRecords(data);
                setError(null); // Réinitialise les erreurs précédentes
            } catch (err) {
                // Modifie le message d'erreur pour refléter le bon port
                setError("Erreur lors du chargement des relevés de température. Le backend est-il démarré et accessible sur le port 5001 ?");
                console.error("Erreur de récupération des relevés:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []); // Le tableau vide assure que l'effet ne s'exécute qu'une fois au montage

    // Gère les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({ ...prev, [name]: value }));
    };

    // Gère la soumission du formulaire pour ajouter un nouveau relevé
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        setError(null); // Réinitialise l'erreur

        // Validation des champs obligatoires
        if (!newRecord.type || !newRecord.location || newRecord.temperature === '') {
            setError("Veuillez remplir tous les champs obligatoires : Type, Localisation, Température.");
            return;
        }

        try {
            // Envoyer le nouveau relevé à l'API
            const addedRecord = await addTemperatureRecord(newRecord); // Appel API
            setRecords(prev => [...prev, addedRecord]); // Ajoute le nouveau relevé à la liste existante
            // Réinitialise le formulaire après l'ajout réussi
            setNewRecord({
                type: '',
                location: '',
                temperature: '',
                timestamp: new Date().toISOString().slice(0, 16),
                notes: ''
            });
            alert("Relevé de température ajouté avec succès !");
        } catch (err) {
            setError("Impossible d'ajouter le relevé. Assurez-vous que le backend fonctionne et que les données sont valides.");
            console.error("Erreur d'ajout de relevé:", err);
        }
    };

    // Affichage des messages de chargement ou d'erreur
    if (loading) return <div>Chargement des relevés...</div>;
    // Affiche le message d'erreur si l'état 'error' n'est pas null
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="temperature-page">
            <h1>Relevés de Température</h1>

            <section className="add-record-section">
                <h2>Ajouter un nouveau relevé</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="type">Type de matériel/Produit:</label>
                        <select name="type" id="type" value={newRecord.type} onChange={handleChange} required>
                            <option value="">Sélectionner un type</option>
                            <option value="frigo-positif">Réfrigérateur (+)</option>
                            <option value="frigo-negatif">Congélateur (-)</option>
                            <option value="livraison">Livraison</option>
                            <option value="chambre-froide">Chambre Froide</option>
                            {/* Tu peux ajouter d'autres types ici */}
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
                            step="0.1" // Permet les décimales pour la température
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="timestamp">Date et Heure:</label>
                        <input
                            type="datetime-local"
                            name="timestamp"
                            id="timestamp"
                            value={newRecord.timestamp}
                            onChange={handleChange}
                            required
                        />
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
            </section>

            <section className="records-list-section">
                <h2>Historique des relevés</h2>
                {records.length === 0 ? (
                    <p>Aucun relevé enregistré pour le moment. Ajoutez-en un nouveau ci-dessus !</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Localisation</th>
                                <th>Temp. (°C)</th>
                                <th>Date/Heure</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec) => (
                                // Correction pour l'erreur d'espace blanc : les <td> sont sur la même ligne que <tr>
                                <tr key={rec.id}><td>{rec.type}</td><td>{rec.location}</td><td>{rec.temperature}</td><td>{new Date(rec.timestamp).toLocaleString()}</td><td>{rec.notes || '-'}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default TemperatureRecordsPage;