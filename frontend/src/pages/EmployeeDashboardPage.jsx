// frontend/src/pages/EmployeeDashboardPage.jsx (Anciennement ClientDashboardPage.jsx)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TemperatureEntryForm from '../components/TemperatureEntryForm';
import './EmployeeDashboardPage.css'; // Créez ce fichier CSS
import './DashboardLayout.css'; // Pour la disposition générale du tableau de bord

const EmployeeDashboardPage = () => {
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null); // Pour passer le rôle au formulaire
  const [uniqueLocations, setUniqueLocations] = useState([]); // Pour les catégories de frigos
  const [selectedLocation, setSelectedLocation] = useState('all'); // Pour filtrer les relevés

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    fetchTemperatureRecords();
  }, []);

  const fetchTemperatureRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      // Endpoint pour les relevés de l'employé
      const response = await axios.get('http://localhost:5001/api/client/temperatures', config);
      setTemperatureRecords(response.data);

      // Extraire les emplacements uniques pour la catégorisation
      const locations = [...new Set(response.data.map(record => record.location))];
      setUniqueLocations(['all', ...locations]);

    } catch (err) {
      console.error('Erreur lors de la récupération de mes relevés:', err);
      setError('Erreur lors de la récupération de mes relevés.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdded = (newRecord) => {
    // Ajoute le nouveau relevé à la liste et rafraîchit les emplacements uniques
    setTemperatureRecords(prevRecords => [newRecord, ...prevRecords]);
    setUniqueLocations(prevLocations => {
      if (!prevLocations.includes(newRecord.location)) {
        return [...prevLocations, newRecord.location];
      }
      return prevLocations;
    });
  };

  const filteredRecords = selectedLocation === 'all'
    ? temperatureRecords
    : temperatureRecords.filter(record => record.location === selectedLocation);

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {/* Boutons de navigation du tableau de bord */}
        <button className="sidebar-button">Mes Relevés</button>
        <button className="sidebar-button">Ajouter Relevé</button>
        {/* Ajoutez d'autres boutons si nécessaire */}
      </div>

      <div className="main-content">
        <h2>Tableau de bord Employé</h2>

        {/* Section Ajouter Relevé */}
        <div className="dashboard-section">
          <TemperatureEntryForm onRecordAdded={handleRecordAdded} userRole={userRole} />
        </div>

        {/* Section Mes Relevés */}
        <div className="dashboard-section">
          <h3>Mes relevés de température</h3>
          {error && <p className="error-message">{error}</p>}
          {loading ? (
            <p>Chargement des relevés...</p>
          ) : (
            <>
              <div className="location-filter">
                <label htmlFor="location-select">Filtrer par emplacement:</label>
                <select
                  id="location-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>
                      {loc === 'all' ? 'Tous les relevés' : loc}
                    </option>
                  ))}
                </select>
              </div>

              {filteredRecords.length === 0 ? (
                <p>Aucun relevé de température trouvé.</p>
              ) : (
                <ul className="temperature-records-list">
                  {filteredRecords.map(record => (
                    <li key={record.id} className="record-item">
                      <p><strong>Type:</strong> {record.type}</p>
                      <p><strong>Emplacement:</strong> {record.location}</p>
                      <p><strong>Température:</strong> {record.temperature}°C</p>
                      <p><strong>Date:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                      {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                      {/* Les employés ne peuvent pas supprimer, donc pas de bouton supprimer ici */}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;
