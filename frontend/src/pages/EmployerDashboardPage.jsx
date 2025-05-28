// frontend/src/pages/EmployeeDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TemperatureEntryForm from '../components/TemperatureEntryForm';
import DashboardLayout from '../components/DashboardLayout'; // Importez le nouveau layout
import './EmployerDashboardPage.css'; // Créez ce fichier CSS si ce n'est pas déjà fait

// --- NOUVEAUX IMPORTS POUR LES ALERTES ---
import AlertPopup from '../components/AlertPopup'; // Importez le composant de pop-up
import { getMyAlerts, markAlertAsRead } from '../services/alertService'; // Importez le service d'alertes
// --- FIN NOUVEAUX IMPORTS ---

const EmployerDashboardPage = () => {
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');

  // --- NOUVEAUX ÉTATS POUR LES ALERTES ---
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null); // Pour l'alerte actuellement affichée en pop-up
  // --- FIN NOUVEAUX ÉTATS ---

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    fetchTemperatureRecords();

    // --- NOUVELLE LOGIQUE POUR LES ALERTES ---
    const fetchAndDisplayAlerts = async () => {
      try {
        const fetchedAlerts = await getMyAlerts();
        setAlerts(fetchedAlerts);
        // Si des alertes sont en statut 'new', affiche la première en pop-up
        const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
        if (newAlert && !currentAlert) { // N'affiche que si aucune alerte n'est déjà affichée
          setCurrentAlert(newAlert);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes pour l\'employé:', error);
      }
    };

    fetchAndDisplayAlerts(); // Récupère les alertes au chargement initial

    // Polling pour vérifier les nouvelles alertes toutes les minutes
    const alertInterval = setInterval(fetchAndDisplayAlerts, 60000); // Vérifie toutes les minutes (60000 ms)

    return () => {
      // Nettoyage à la désinstallation du composant
      clearInterval(alertInterval);
    };
    // --- FIN NOUVELLE LOGIQUE POUR LES ALERTES ---

  }, [currentAlert]); // Ajoutez currentAlert aux dépendances pour déclencher la mise à jour si la popup est fermée

  // --- NOUVELLE FONCTION POUR MARQUER L'ALERTE COMME LUE ---
  const handleDismissAlert = async () => {
    if (currentAlert) {
      try {
        await markAlertAsRead(currentAlert.id);
        // Optionnel : Mettre à jour l'état des alertes pour refléter que celle-ci est lue
        setAlerts(prevAlerts => prevAlerts.map(a =>
          a.id === currentAlert.id ? { ...a, status: 'read' } : a
        ));
        setCurrentAlert(null); // Fermer la pop-up
      } catch (error) {
        console.error('Erreur lors du marquage de l\'alerte comme lue pour l\'employé:', error);
      }
    }
  };
  // --- FIN NOUVELLE FONCTION ---


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
      const response = await axios.get('http://localhost:5001/api/employer/temperatures', config);
      setTemperatureRecords(response.data);

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

  // Définition des boutons pour la barre latérale
  const sidebarButtons = [
    {
      label: 'Ajouter Relevé',
      title: 'Ajouter un nouveau relevé de température',
      content: <TemperatureEntryForm onRecordAdded={handleRecordAdded} userRole={userRole} />
    },
    {
      label: 'Mes Relevés',
      title: 'Historique de mes relevés de température',
      content: (
        <>
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
                      {/* Pas de bouton de suppression pour les employés */}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      {/* Contenu par défaut du tableau de bord (peut être un message de bienvenue ou des statistiques) */}
      <h2 className="welcome-message">Bienvenue sur votre tableau de bord Employé !</h2>
      <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour ajouter ou consulter vos relevés de température.</p>

      {/* --- AFFICHAGE DE LA POP-UP D'ALERTE --- */}
      {currentAlert && (
          <AlertPopup
              message={currentAlert.message}
              onDismiss={handleDismissAlert}
          />
      )}
      {/* --- FIN AFFICHAGE DE LA POP-UP D'ALERTE --- */}
    </DashboardLayout>
  );
};

export default EmployerDashboardPage;













// // frontend/src/pages/EmployeeDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import TemperatureEntryForm from '../components/TemperatureEntryForm';
// import DashboardLayout from '../components/DashboardLayout'; // Importez le nouveau layout
// import './EmployerDashboardPage.css'; // Créez ce fichier CSS si ce n'est pas déjà fait

// const EmployerDashboardPage = () => {
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [userRole, setUserRole] = useState(null);
//   const [uniqueLocations, setUniqueLocations] = useState([]);
//   const [selectedLocation, setSelectedLocation] = useState('all');

//   useEffect(() => {
//     const role = localStorage.getItem('userRole');
//     setUserRole(role);
//     fetchTemperatureRecords();
//   }, []);

//   const fetchTemperatureRecords = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/employer/temperatures', config);
//       setTemperatureRecords(response.data);

//       const locations = [...new Set(response.data.map(record => record.location))];
//       setUniqueLocations(['all', ...locations]);

//     } catch (err) {
//       console.error('Erreur lors de la récupération de mes relevés:', err);
//       setError('Erreur lors de la récupération de mes relevés.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRecordAdded = (newRecord) => {
//     setTemperatureRecords(prevRecords => [newRecord, ...prevRecords]);
//     setUniqueLocations(prevLocations => {
//       if (!prevLocations.includes(newRecord.location)) {
//         return [...prevLocations, newRecord.location];
//       }
//       return prevLocations;
//     });
//   };

//   const filteredRecords = selectedLocation === 'all'
//     ? temperatureRecords
//     : temperatureRecords.filter(record => record.location === selectedLocation);

//   // Définition des boutons pour la barre latérale
//   const sidebarButtons = [
//     {
//       label: 'Ajouter Relevé',
//       title: 'Ajouter un nouveau relevé de température',
//       content: <TemperatureEntryForm onRecordAdded={handleRecordAdded} userRole={userRole} />
//     },
//     {
//       label: 'Mes Relevés',
//       title: 'Historique de mes relevés de température',
//       content: (
//         <>
//           {error && <p className="error-message">{error}</p>}
//           {loading ? (
//             <p>Chargement des relevés...</p>
//           ) : (
//             <>
//               <div className="location-filter">
//                 <label htmlFor="location-select">Filtrer par emplacement:</label>
//                 <select
//                   id="location-select"
//                   value={selectedLocation}
//                   onChange={(e) => setSelectedLocation(e.target.value)}
//                 >
//                   {uniqueLocations.map(loc => (
//                     <option key={loc} value={loc}>
//                       {loc === 'all' ? 'Tous les relevés' : loc}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {filteredRecords.length === 0 ? (
//                 <p>Aucun relevé de température trouvé.</p>
//               ) : (
//                 <ul className="temperature-records-list">
//                   {filteredRecords.map(record => (
//                     <li key={record.id} className="record-item">
//                       <p><strong>Type:</strong> {record.type}</p>
//                       <p><strong>Emplacement:</strong> {record.location}</p>
//                       <p><strong>Température:</strong> {record.temperature}°C</p>
//                       <p><strong>Date:</strong> {new Date(record.timestamp).toLocaleString()}</p>
//                       {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
//                       {/* Pas de bouton de suppression pour les employés */}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </>
//           )}
//         </>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       {/* Contenu par défaut du tableau de bord (peut être un message de bienvenue ou des statistiques) */}
//       <h2 className="welcome-message">Bienvenue sur votre tableau de bord Employé !</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour ajouter ou consulter vos relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default EmployerDashboardPage;










// // frontend/src/pages/EmployeeDashboardPage.jsx (Anciennement ClientDashboardPage.jsx)
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import TemperatureEntryForm from '../components/TemperatureEntryForm';
// import './EmployeeDashboardPage.css'; // Créez ce fichier CSS
// import './DashboardLayout.css'; // Pour la disposition générale du tableau de bord

// const EmployeeDashboardPage = () => {
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [userRole, setUserRole] = useState(null); // Pour passer le rôle au formulaire
//   const [uniqueLocations, setUniqueLocations] = useState([]); // Pour les catégories de frigos
//   const [selectedLocation, setSelectedLocation] = useState('all'); // Pour filtrer les relevés

//   useEffect(() => {
//     const role = localStorage.getItem('userRole');
//     setUserRole(role);
//     fetchTemperatureRecords();
//   }, []);

//   const fetchTemperatureRecords = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       // Endpoint pour les relevés de l'employé
//       const response = await axios.get('http://localhost:5001/api/client/temperatures', config);
//       setTemperatureRecords(response.data);

//       // Extraire les emplacements uniques pour la catégorisation
//       const locations = [...new Set(response.data.map(record => record.location))];
//       setUniqueLocations(['all', ...locations]);

//     } catch (err) {
//       console.error('Erreur lors de la récupération de mes relevés:', err);
//       setError('Erreur lors de la récupération de mes relevés.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRecordAdded = (newRecord) => {
//     // Ajoute le nouveau relevé à la liste et rafraîchit les emplacements uniques
//     setTemperatureRecords(prevRecords => [newRecord, ...prevRecords]);
//     setUniqueLocations(prevLocations => {
//       if (!prevLocations.includes(newRecord.location)) {
//         return [...prevLocations, newRecord.location];
//       }
//       return prevLocations;
//     });
//   };

//   const filteredRecords = selectedLocation === 'all'
//     ? temperatureRecords
//     : temperatureRecords.filter(record => record.location === selectedLocation);

//   return (
//     <div className="dashboard-layout">
//       <div className="sidebar">
//         {/* Boutons de navigation du tableau de bord */}
//         <button className="sidebar-button">Mes Relevés</button>
//         <button className="sidebar-button">Ajouter Relevé</button>
//         {/* Ajoutez d'autres boutons si nécessaire */}
//       </div>

//       <div className="main-content">
//         <h2>Tableau de bord Employé</h2>

//         {/* Section Ajouter Relevé */}
//         <div className="dashboard-section">
//           <TemperatureEntryForm onRecordAdded={handleRecordAdded} userRole={userRole} />
//         </div>

//         {/* Section Mes Relevés */}
//         <div className="dashboard-section">
//           <h3>Mes relevés de température</h3>
//           {error && <p className="error-message">{error}</p>}
//           {loading ? (
//             <p>Chargement des relevés...</p>
//           ) : (
//             <>
//               <div className="location-filter">
//                 <label htmlFor="location-select">Filtrer par emplacement:</label>
//                 <select
//                   id="location-select"
//                   value={selectedLocation}
//                   onChange={(e) => setSelectedLocation(e.target.value)}
//                 >
//                   {uniqueLocations.map(loc => (
//                     <option key={loc} value={loc}>
//                       {loc === 'all' ? 'Tous les relevés' : loc}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {filteredRecords.length === 0 ? (
//                 <p>Aucun relevé de température trouvé.</p>
//               ) : (
//                 <ul className="temperature-records-list">
//                   {filteredRecords.map(record => (
//                     <li key={record.id} className="record-item">
//                       <p><strong>Type:</strong> {record.type}</p>
//                       <p><strong>Emplacement:</strong> {record.location}</p>
//                       <p><strong>Température:</strong> {record.temperature}°C</p>
//                       <p><strong>Date:</strong> {new Date(record.timestamp).toLocaleString()}</p>
//                       {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
//                       {/* Les employés ne peuvent pas supprimer, donc pas de bouton supprimer ici */}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboardPage;
