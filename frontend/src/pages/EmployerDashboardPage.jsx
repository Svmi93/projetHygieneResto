// frontend/src/pages/EmployerDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // MODIFIÉ: Utilise axiosInstance
import TemperatureEntryForm from '../components/TemperatureEntryForm';
import DashboardLayout from '../components/DashboardLayout';
import './EmployerDashboardPage.css';

// --- IMPORTS POUR LES PHOTOS ---
import PhotoUploadForm from '../components/PhotoUploadForm'; // Composant pour l'upload des photos
import PhotoGallery from '../components/PhotoGallery';     // Composant pour l'affichage des photos
// --- FIN IMPORTS PHOTOS ---

// --- IMPORTS POUR LES ALERTES ---
import AlertPopup from '../components/AlertPopup'; // Importe le composant de pop-up
import { getMyAlerts, markAlertAsRead } from '../services/alertService'; // Importe le service d'alertes
// --- FIN IMPORTS ALERTES ---

const EmployerDashboardPage = () => {
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');

  // --- ÉTATS POUR LES ALERTES ---
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null); // Pour l'alerte actuellement affichée en pop-up
  // --- FIN ÉTATS ALERTES ---

  // --- ÉTATS POUR LES PHOTOS ---
  const [adminClientSiret, setAdminClientSiret] = useState(null); // SIRET de l'admin client pour l'employé
  const [refreshPhotos, setRefreshPhotos] = useState(0); // État pour forcer le rechargement de la galerie
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null); // ID de l'employé connecté
  // --- FIN ÉTATS PHOTOS ---


  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    
    const employeeId = localStorage.getItem('userId'); // Récupère l'ID de l'employé connecté
    if (employeeId) {
      setCurrentEmployeeId(employeeId);
    }

    fetchTemperatureRecords();

    // --- LOGIQUE POUR RÉCUPÉRER LE SIRET DE L'ADMIN CLIENT POUR L'EMPLOYÉ ---
    const fetchAdminClientSiret = async () => {
      try {
        // MODIFIÉ: Utilise axiosInstance.get()
        const response = await axiosInstance.get('/users/profile');
        // Pour un employé, admin_client_siret est directement dans le profil utilisateur
        if (response.data && response.data.admin_client_siret) {
          setAdminClientSiret(response.data.admin_client_siret);
          localStorage.setItem('userSiret', response.data.admin_client_siret); // Utile si tu en as besoin ailleurs
        } else {
            console.warn("SIRET de l'admin client non trouvé pour l'employé.");
            setError("SIRET de l'établissement non trouvé. Contactez votre administrateur.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du SIRET de l'admin client pour l'employé:", err);
        setError("Erreur lors du chargement des informations de l'établissement.");
      }
    };
    fetchAdminClientSiret();
    // --- FIN LOGIQUE SIRET EMPLOYÉ ---

    // --- LOGIQUE POUR LES ALERTES ---
    const fetchAndDisplayAlerts = async () => {
      try {
        const fetchedAlerts = await getMyAlerts();
        setAlerts(fetchedAlerts);
        const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
        if (newAlert && !currentAlert) {
          setCurrentAlert(newAlert);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes pour l\'employé:', error);
      }
    };

    fetchAndDisplayAlerts();
    const alertInterval = setInterval(fetchAndDisplayAlerts, 60000);

    return () => {
      clearInterval(alertInterval);
    };
  }, [currentAlert, refreshPhotos]); // refreshPhotos est ajouté aux dépendances pour le rechargement des photos

  // --- FONCTION POUR MARQUER L'ALERTE COMME LUE ---
  const handleDismissAlert = async () => {
    if (currentAlert) {
      try {
        await markAlertAsRead(currentAlert.id);
        setAlerts(prevAlerts => prevAlerts.map(a =>
          a.id === currentAlert.id ? { ...a, status: 'read' } : a
        ));
        setCurrentAlert(null);
      } catch (error) {
        console.error('Erreur lors du marquage de l\'alerte comme lue pour l\'employé:', error);
      }
    }
  };
  // --- FIN FONCTION ---


  const fetchTemperatureRecords = async () => {
    setLoading(true);
    setError('');
    try {
      // MODIFIÉ: Utilise axiosInstance.get()
      const response = await axiosInstance.get('/employer/temperatures');
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

  // --- FONCTION POUR RAFRAÎCHIR LA GALERIE PHOTO ---
  // Cette fonction est appelée après un upload de photo pour rafraîchir PhotoGallery
  const handlePhotoActionSuccess = () => {
    setRefreshPhotos(prev => prev + 1); // Incrémente pour déclencher le useEffect dans PhotoGallery
  };
  // --- FIN FONCTION RAFRAÎCHIR ---


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
                      {/* Pas de bouton de suppression pour les employés sur les relevés de température */}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )
    },
    {
      label: 'Gérer les Photos', // NOUVEAU BOUTON POUR LES PHOTOS
      title: 'Prendre et consulter les photos de produits',
      content: (
        <div className="employer-section">
          {adminClientSiret && currentEmployeeId ? ( // S'assure que le SIRET et l'ID employé sont disponibles
            <>
              {/* L'employé peut uploader des photos */}
              <PhotoUploadForm
                siret={adminClientSiret} // SIRET de l'admin client pour l'association
                employeeId={currentEmployeeId} // ID de l'employé qui upload
                onPhotoUploadSuccess={handlePhotoActionSuccess}
              />
              <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
              {/* L'employé peut voir les photos (pas de suppression) */}
              <PhotoGallery
                siret={adminClientSiret} // SIRET pour filtrer les photos de son établissement
                currentUserRole={localStorage.getItem('userRole')} // Passé pour les permissions (empêchera la suppression)
                // onPhotoDeleted n'est pas nécessaire ici car l'employé ne supprime pas
                key={refreshPhotos} // Force le re-montage pour rafraîchir après upload
              />
            </>
          ) : (
            <p>Chargement des informations de l'établissement pour la gestion des photos...</p>
          )}
        </div>
      )
    }
  ];
  // --- FIN DÉFINITION DES BOUTONS ---

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      <h2 className="welcome-message">Bienvenue sur votre tableau de bord Employé !</h2>
      <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour ajouter ou consulter vos relevés de température et gérer les photos.</p>

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














// // frontend/src/pages/EmployerDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import TemperatureEntryForm from '../components/TemperatureEntryForm';
// import DashboardLayout from '../components/DashboardLayout';
// import './EmployerDashboardPage.css';

// // --- IMPORTS POUR LES PHOTOS ---
// import PhotoUploadForm from '../components/PhotoUploadForm'; // <<< NOUVEL IMPORT
// import PhotoGallery from '../components/PhotoGallery';     // <<< NOUVEL IMPORT
// // --- FIN IMPORTS PHOTOS ---

// // --- NOUVEAUX IMPORTS POUR LES ALERTES ---
// import AlertPopup from '../components/AlertPopup'; // Importez le composant de pop-up
// import { getMyAlerts, markAlertAsRead } from '../services/alertService'; // Importez le service d'alertes
// // --- FIN NOUVEAUX IMPORTS ---

// const EmployerDashboardPage = () => {
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [userRole, setUserRole] = useState(null);
//   const [uniqueLocations, setUniqueLocations] = useState([]);
//   const [selectedLocation, setSelectedLocation] = useState('all');

//   // --- NOUVEAUX ÉTATS POUR LES ALERTES ---
//   const [alerts, setAlerts] = useState([]);
//   const [currentAlert, setCurrentAlert] = useState(null); // Pour l'alerte actuellement affichée en pop-up
//   // --- FIN NOUVEAUX ÉTATS ---

//   // --- NOUVEAUX ÉTATS POUR LES PHOTOS ---
//   const [adminClientSiret, setAdminClientSiret] = useState(null); // <<< NOUVEL ÉTAT POUR LE SIRET DE L'ADMIN CLIENT
//   const [refreshPhotos, setRefreshPhotos] = useState(0); // <<< NOUVEL ÉTAT pour forcer le rechargement de la galerie
//   // --- FIN NOUVEAUX ÉTATS PHOTOS ---


//   useEffect(() => {
//     const role = localStorage.getItem('userRole');
//     setUserRole(role);
//     fetchTemperatureRecords();

//     // <<< NOUVELLE LOGIQUE POUR RÉCUPÉRER LE SIRET DE L'ADMIN CLIENT POUR L'EMPLOYÉ
//     const fetchAdminClientSiret = async () => {
//       try {
//         const token = localStorage.getItem('userToken');
//         const response = await axios.get('http://localhost:5001/api/users/profile', {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         // Pour un employé, admin_client_siret est directement dans le profil utilisateur
//         if (response.data && response.data.admin_client_siret) {
//           setAdminClientSiret(response.data.admin_client_siret);
//           localStorage.setItem('userSiret', response.data.admin_client_siret); // Utile si tu en as besoin ailleurs
//         } else {
//             console.warn("SIRET de l'admin client non trouvé pour l'employé.");
//             setError("SIRET de l'établissement non trouvé. Contactez votre administrateur.");
//         }
//       } catch (err) {
//         console.error("Erreur lors de la récupération du SIRET de l'admin client pour l'employé:", err);
//         setError("Erreur lors du chargement des informations de l'établissement.");
//       }
//     };
//     fetchAdminClientSiret();
//     // <<< FIN NOUVELLE LOGIQUE SIRET EMPLOYÉ

//     // --- NOUVELLE LOGIQUE POUR LES ALERTES ---
//     const fetchAndDisplayAlerts = async () => {
//       try {
//         const fetchedAlerts = await getMyAlerts();
//         setAlerts(fetchedAlerts);
//         // Si des alertes sont en statut 'new', affiche la première en pop-up
//         const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
//         if (newAlert && !currentAlert) { // N'affiche que si aucune alerte n'est déjà affichée
//           setCurrentAlert(newAlert);
//         }
//       } catch (error) {
//         console.error('Erreur lors de la récupération des alertes pour l\'employé:', error);
//       }
//     };

//     fetchAndDisplayAlerts(); // Récupère les alertes au chargement initial

//     // Polling pour vérifier les nouvelles alertes toutes les minutes
//     const alertInterval = setInterval(fetchAndDisplayAlerts, 60000); // Vérifie toutes les minutes (60000 ms)

//     return () => {
//       // Nettoyage à la désinstallation du composant
//       clearInterval(alertInterval);
//     };
//     // --- FIN NOUVELLE LOGIQUE POUR LES ALERTES ---

//   }, [currentAlert, refreshPhotos]); // <<< AJOUTE refreshPhotos aux dépendances pour le rechargement des photos

//   // --- NOUVELLE FONCTION POUR MARQUER L'ALERTE COMME LUE ---
//   const handleDismissAlert = async () => {
//     if (currentAlert) {
//       try {
//         await markAlertAsRead(currentAlert.id);
//         // Optionnel : Mettre à jour l'état des alertes pour refléter que celle-ci est lue
//         setAlerts(prevAlerts => prevAlerts.map(a =>
//           a.id === currentAlert.id ? { ...a, status: 'read' } : a
//         ));
//         setCurrentAlert(null); // Fermer la pop-up
//       } catch (error) {
//         console.error('Erreur lors du marquage de l\'alerte comme lue pour l\'employé:', error);
//       }
//     }
//   };
//   // --- FIN NOUVELLE FONCTION ---


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

//   // --- FONCTION POUR RAFRAÎCHIR LA GALERIE PHOTO ---
//   const handlePhotoActionSuccess = () => {
//     setRefreshPhotos(prev => prev + 1); // Incrémente pour déclencher le useEffect dans PhotoGallery
//   };
//   // --- FIN FONCTION RAFRAÎCHIR ---


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
//     },
//     {
//       label: 'Gérer les Photos', // <<< NOUVEAU BOUTON POUR LES PHOTOS
//       title: 'Prendre et consulter les photos de produits',
//       content: (
//         <div className="employer-section">
//           {adminClientSiret ? ( // S'assure que le SIRET est disponible avant d'afficher les composants
//             <>
//               <PhotoUploadForm siret={adminClientSiret} onPhotoUploadSuccess={handlePhotoActionSuccess} />
//               <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
//               <PhotoGallery siret={adminClientSiret} currentUserRole={localStorage.getItem('userRole')} onPhotoDeleted={handlePhotoActionSuccess} key={refreshPhotos} />
//             </>
//           ) : (
//             <p>Chargement des informations de l'établissement pour les photos...</p>
//           )}
//         </div>
//       )
//     }
//   ];
//   // --- FIN AJOUT DE NOUVEAUX BOUTONS ---

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       {/* Contenu par défaut du tableau de bord (peut être un message de bienvenue ou des statistiques) */}
//       <h2 className="welcome-message">Bienvenue sur votre tableau de bord Employé !</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour ajouter ou consulter vos relevés de température.</p>

//       {/* --- AFFICHAGE DE LA POP-UP D'ALERTE --- */}
//       {currentAlert && (
//           <AlertPopup
//               message={currentAlert.message}
//               onDismiss={handleDismissAlert}
//           />
//       )}
//       {/* --- FIN AFFICHAGE DE LA POP-UP D'ALERTE --- */}
//     </DashboardLayout>
//   );
// };

// export default EmployerDashboardPage;













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
