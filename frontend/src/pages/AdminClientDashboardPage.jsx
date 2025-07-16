// frontend/src/pages/AdminClientDashboardPage.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import DashboardLayout from '../components/DashboardLayout';
import EquipmentForm from '../components/EquipmentForm';
import UserForm from '../components/UserForm';
import './AdminClientDashboardPage.css';

// --- IMPORTS POUR LES ALERTES ---
import AlertPopup from '../components/AlertPopup';
import { getMyAlerts, markAlertAsRead } from '../services/alertService';
// --- FIN IMPORTS ALERTES ---

// --- NOUVEAUX IMPORTS POUR LA TRAÇABILITÉ ---
import AddTraceabilityForm from '../components/Traceability/AddTraceabilityForm';
import TraceabilityRecordsGallery from '../components/Traceability/TraceabilityRecordsGallery';
// --- FIN NOUVEAUX IMPORTS TRAÇABILITÉ ---

// --- NOUVEL IMPORT POUR LA GESTION DES CLIENTS ---
import UserClientManagement from '../components/UserClientManagement';
// --- FIN NOUVEL IMPORT ---

// --- NOUVEL IMPORT : useAuth ---
import { useAuth } from '../context/AuthContext';
// --- FIN NOUVEL IMPORT ---


const AdminClientDashboardPage = () => {
  // --- Utilisation de useAuth ---
  const { user, isAuthenticated } = useAuth();
  // --- FIN useAuth ---

  const [employees, setEmployees] = useState([]);
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState('');
  const [loadingTemperatures, setLoadingTemperatures] = useState(true);
  const [errorTemperatures, setErrorTemperatures] = useState('');
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const [errorEquipments, setErrorEquipments] = useState('');
  const [adminClientProfile, setAdminClientProfile] = useState(null);

  // --- ÉTATS POUR LES ALERTES ---
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  // --- FIN ÉTATS ALERTES ---

  // --- ÉTATS POUR LA TRAÇABILITÉ ---
  const [refreshTraceability, setRefreshTraceability] = useState(0);
  // --- FIN ÉTATS TRAÇABILITÉ ---


  useEffect(() => {
    // --- CONDITIONNEMENT DES APPELS API AVEC isAuthenticated ET user ---
    if (isAuthenticated && user) {
      fetchAdminClientProfile();
      fetchMyEmployees();
      fetchEmployeeTemperatureRecords();
      fetchEquipments();
      fetchAndDisplayAlerts(); // Déclenchement initial des alertes

      // --- LOGIQUE POUR LES ALERTES (intervalle) ---
      const alertInterval = setInterval(fetchAndDisplayAlerts, 60000);
      return () => {
        clearInterval(alertInterval);
      };
    }
  }, [isAuthenticated, user, currentAlert, refreshTraceability]); // Ajout de isAuthenticated, user, currentAlert et refreshTraceability aux dépendances


  // --- FONCTION POUR MARQUER L'ALERTE COMME LUE ---
  const handleDismissAlert = async () => {
    if (currentAlert) {
      try {
        await markAlertAsRead(currentAlert.id);
        setAlerts(prevAlerts => prevAlerts.map(a =>
          a.id === currentAlert.id ? { ...a, status: 'read' } : a
        ));
        setCurrentAlert(null); // Masquer l'alerte actuelle
      } catch (error) {
        console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
      }
    }
  };
  // --- FIN FONCTION ---

  const fetchAdminClientProfile = async () => {
    try {
      const response = await axiosInstance.get('/users/profile');
      setAdminClientProfile(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
    }
  };

  const fetchMyEmployees = async () => {
    setLoadingEmployees(true);
    setErrorEmployees('');
    try {
      const response = await axiosInstance.get('/admin-client/employees');
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
        setEmployees([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des employés:', err);
      setErrorEmployees('Erreur lors du chargement des employés.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleEmployeeCreated = (newEmployee) => {
    setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
  };

  const fetchEmployeeTemperatureRecords = async () => {
    setLoadingTemperatures(true);
    setErrorTemperatures('');
    try {
      const response = await axiosInstance.get('/admin-client/temperatures');
      if (Array.isArray(response.data)) {
        setTemperatureRecords(response.data);
      } else {
        console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
        setTemperatureRecords([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des relevés de température des employés:', err);
      setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
    } finally {
      setLoadingTemperatures(false);
    }
  };

  const fetchEquipments = async () => {
    setLoadingEquipments(true);
    setErrorEquipments('');
    try {
      const response = await axiosInstance.get('/admin-client/equipments');
      // L'API pour les équipements devrait renvoyer directement un tableau, ou une propriété "equipments"
      if (response.data && Array.isArray(response.data.equipments)) {
        setEquipments(response.data.equipments);
      } else {
        console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
        setEquipments([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des équipements:', err);
      setErrorEquipments('Erreur lors du chargement des équipements.');
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleEquipmentSaved = (newOrUpdatedEquipment) => {
    if (newOrUpdatedEquipment.id) {
      setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
    } else {
      setEquipments(prev => [...prev, newOrUpdatedEquipment]);
    }
    fetchEquipments(); // Re-fetch pour s'assurer que la liste est à jour
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
      try {
        await axiosInstance.delete(`/admin-client/equipments/${equipmentId}`);
        setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
        alert('Équipement supprimé avec succès.');
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'équipement:', err);
        alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // --- FONCTION POUR RAFRAÎCHIR LA GALERIE DE TRAÇABILITÉ ---
  const handleTraceabilityActionSuccess = () => {
    setRefreshTraceability(prev => prev + 1);
  };
  // --- FIN FONCTION RAFRAÎCHIR ---

  // --- LOGIQUE POUR LES ALERTES (fetcher) ---
  const fetchAndDisplayAlerts = async () => {
    try {
      const fetchedAlerts = await getMyAlerts();
      setAlerts(fetchedAlerts);
      const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
      if (newAlert && !currentAlert) { // Ne définir que si une nouvelle alerte non lue existe et qu'il n'y a pas déjà une alerte affichée
        setCurrentAlert(newAlert);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
    }
  };


  const employeeFormInitialData = adminClientProfile ? {
    admin_client_id: adminClientProfile.id,
    isCreatingEmployeeByAdminClient: true
  } : {
    isCreatingEmployeeByAdminClient: true
  };

  // --- DÉFINITION DES BOUTONS DE LA BARRE LATÉRALE ---
  const sidebarButtons = [
    {
      label: 'Gérer mes Employés',
      title: 'Gestion des employés de votre établissement',
      content: (
        <div className="admin-section p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Liste de mes Employés</h3>
          {errorEmployees && <p className="error-message text-red-600 mb-4">{errorEmployees}</p>}
          {loadingEmployees ? <p className="text-gray-600">Chargement des employés...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4 border-b">ID</th>
                    <th className="py-3 px-4 border-b">Email</th>
                    <th className="py-3 px-4 border-b">Nom</th>
                    <th className="py-3 px-4 border-b">Prénom</th>
                    <th className="py-3 px-4 border-b">Entreprise</th>
                    <th className="py-3 px-4 border-b">SIRET</th>
                    <th className="py-3 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr><td colSpan="7" className="py-3 px-4 text-center text-gray-500">Aucun employé trouvé.</td></tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.nom_client}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.prenom_client}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.nom_entreprise}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{emp.siret}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {/* Ajoutez ici la logique de modification et suppression si nécessaire */}
                          <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2" onClick={() => alert('Fonctionnalité de modification à implémenter.')}>Modifier</button>
                          <button className="action-button delete-button text-red-600 hover:text-red-800" onClick={() => alert('Fonctionnalité de suppression à implémenter.')}>Supprimer</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <h4 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Ajouter un nouvel employé</h4>
          {adminClientProfile ? (
            <UserForm
              onUserCreated={handleEmployeeCreated}
              initialData={employeeFormInitialData}
              apiEndpointForCreation="/admin-client/employees"
              isCreatingEmployeeByAdminClient={true}
            />
          ) : (
            <p className="text-gray-600">Chargement des informations de l'Admin Client pour le formulaire...</p>
          )}
        </div>
      )
    },
    {
      label: 'Gérer les Équipements',
      title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
      content: (
        <div className="admin-section p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Liste de mes Équipements</h3>
          {errorEquipments && <p className="error-message text-red-600 mb-4">{errorEquipments}</p>}
          {loadingEquipments ? <p className="text-gray-600">Chargement des équipements...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4 border-b">ID</th>
                    <th className="py-3 px-4 border-b">Nom</th>
                    <th className="py-3 px-4 border-b">Type</th>
                    <th className="py-3 px-4 border-b">Temp. Type</th>
                    <th className="py-3 px-4 border-b">Min. Temp.</th>
                    <th className="py-3 px-4 border-b">Max. Temp.</th>
                    <th className="py-3 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.length === 0 ? (
                    <tr><td colSpan="7" className="py-3 px-4 text-center text-gray-500">Aucun équipement trouvé.</td></tr>
                  ) : (
                    equipments.map(eq => (
                      <tr key={eq.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.type}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2" onClick={() => {
                            alert(`Modifier l'équipement ${eq.name}`);
                          }}>Modifier</button>
                          <button className="action-button delete-button text-red-600 hover:text-red-800" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <h4 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Ajouter un nouvel équipement</h4>
          <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
        </div>
      )
    },
    {
      label: 'Relevés de mes Employés',
      title: 'Historique des relevés de température de votre établissement',
      content: (
        <div className="admin-section p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Relevés de Température des Employés</h3>
          {errorTemperatures && <p className="error-message text-red-600 mb-4">{errorTemperatures}</p>}
          {loadingTemperatures ? <p className="text-gray-600">Chargement des relevés...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4 border-b">ID</th>
                    <th className="py-3 px-4 border-b">Type App.</th>
                    <th className="py-3 px-4 border-b">Emplacement</th>
                    <th className="py-3 px-4 border-b">Temp.</th>
                    <th className="py-3 px-4 border-b">Type Temp.</th>
                    <th className="py-3 px-4 border-b">Date</th>
                    <th className="py-3 px-4 border-b">Employé ID</th>
                    <th className="py-3 px-4 border-b">Entreprise Client</th>
                    <th className="py-3 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {temperatureRecords.length === 0 ? (
                    <tr><td colSpan="9" className="py-3 px-4 text-center text-gray-500">Aucun relevé de température trouvé.</td></tr>
                  ) : (
                    temperatureRecords.map(record => (
                      <tr key={record.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">{record.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.type}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.location}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.temperature}°C</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{new Date(record.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.user_id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.client_nom_entreprise}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2" onClick={() => alert('Fonctionnalité de modification à implémenter.')}>Modifier</button>
                          <button className="action-button delete-button text-red-600 hover:text-red-800" onClick={() => alert('Fonctionnalité de suppression à implémenter.')}>Supprimer</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Traçabilité',
      title: 'Gérer les enregistrements de traçabilité (photos, produits, dates)',
      content: (
        <div className="traceability-section p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Gestion de la Traçabilité</h2>
          <AddTraceabilityForm onRecordAdded={handleTraceabilityActionSuccess} />
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Galerie des Enregistrements</h3>
            <TraceabilityRecordsGallery refreshTrigger={refreshTraceability} />
          </div>
        </div>
      )
    },
    {
      label: 'Gérer les Clients', // Ce label est trompeur car le composant gère les employés.
                                 // Pensez à renommer UserClientManagement en EmployeeManagement
      title: 'Gérer les informations de vos clients et de leurs établissements',
      content: (
        <div className="admin-section p-6 bg-white rounded-lg shadow-md">
          <UserClientManagement />
        </div>
      )
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      <h2 className="welcome-message text-3xl font-bold text-gray-900 mb-6">Tableau de bord Admin Client</h2>
      <p className="dashboard-intro text-gray-700 mb-8">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements, leurs relevés de température et la traçabilité.</p>

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

export default AdminClientDashboardPage;











// //// frontend/src/pages/AdminClientDashboardPage.jsx
// import { useEffect, useState } from 'react';
// import axiosInstance from '../api/axiosInstance';
// import DashboardLayout from '../components/DashboardLayout';
// import EquipmentForm from '../components/EquipmentForm';
// import UserForm from '../components/UserForm';
// import './AdminClientDashboardPage.css';

// // --- IMPORTS POUR LES ALERTES ---
// import AlertPopup from '../components/AlertPopup';
// import { getMyAlerts, markAlertAsRead } from '../services/alertService';
// // --- FIN IMPORTS ALERTES ---

// // --- NOUVEAUX IMPORTS POUR LA TRAÇABILITÉ ---
// import AddTraceabilityForm from '../components/Traceability/AddTraceabilityForm';
// import TraceabilityRecordsGallery from '../components/Traceability/TraceabilityRecordsGallery'; // Le chemin ici était "../components/Traceability/TraceabilityRecordsGallery" (corrige si ton dossier TraceabilityRecordsGallery est directement dans components et non dans un sous-dossier Traceability)
// // --- FIN NOUVEAUX IMPORTS TRAÇABILITÉ ---

// // --- NOUVEL IMPORT POUR LA GESTION DES CLIENTS ---
// import UserClientManagement from '../components/UserClientManagement';
// // --- FIN NOUVEL IMPORT ---

// // --- NOUVEL IMPORT : useAuth ---
// import { useAuth } from '../context/AuthContext';
// // --- FIN NOUVEL IMPORT ---


// const AdminClientDashboardPage = () => {
//   // --- Utilisation de useAuth ---
//   const { user, isAuthenticated } = useAuth();
//   // --- FIN useAuth ---

//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true);
//   const [errorEquipments, setErrorEquipments] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   // --- ÉTATS POUR LES ALERTES ---
//   const [alerts, setAlerts] = useState([]);
//   const [currentAlert, setCurrentAlert] = useState(null);
//   // --- FIN ÉTATS ALERTES ---

//   // --- ÉTATS POUR LA TRAÇABILITÉ ---
//   const [refreshTraceability, setRefreshTraceability] = useState(0);
//   // --- FIN ÉTATS TRAÇABILITÉ ---


//   useEffect(() => {
//     // --- CONDITIONNEMENT DES APPELS API AVEC isAuthenticated ET user ---
//     if (isAuthenticated && user) {
//       fetchAdminClientProfile();
//       fetchMyEmployees();
//       fetchEmployeeTemperatureRecords();
//       fetchEquipments();
//       fetchAndDisplayAlerts(); // Déclenchement initial des alertes

//       // --- LOGIQUE POUR LES ALERTES (intervalle) ---
//       const alertInterval = setInterval(fetchAndDisplayAlerts, 60000);
//       return () => {
//         clearInterval(alertInterval);
//       };
//     }
//   }, [isAuthenticated, user, currentAlert, refreshTraceability]); // Ajout de isAuthenticated et user aux dépendances


//   // --- FONCTION POUR MARQUER L'ALERTE COMME LUE ---
//   const handleDismissAlert = async () => {
//     if (currentAlert) {
//       try {
//         await markAlertAsRead(currentAlert.id);
//         setAlerts(prevAlerts => prevAlerts.map(a =>
//           a.id === currentAlert.id ? { ...a, status: 'read' } : a
//         ));
//         setCurrentAlert(null);
//       } catch (error) {
//         console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
//       }
//     }
//   };
//   // --- FIN FONCTION ---

//   const fetchAdminClientProfile = async () => {
//     try {
//       const response = await axiosInstance.get('/users/profile');
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const response = await axiosInstance.get('/admin-client/employees');
//       if (Array.isArray(response.data)) {
//         setEmployees(response.data);
//       } else {
//         console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const response = await axiosInstance.get('/admin-client/temperatures');
//       if (Array.isArray(response.data)) {
//         setTemperatureRecords(response.data);
//       } else {
//         console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
//         setTemperatureRecords([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const response = await axiosInstance.get('/admin-client/equipments');
//       if (response.data && Array.isArray(response.data.equipments)) {
//         setEquipments(response.data.equipments);
//       } else {
//         console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
//         setEquipments([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     fetchEquipments();
//   };

//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         await axiosInstance.delete(`/admin-client/equipments/${equipmentId}`);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   // --- FONCTION POUR RAFRAÎCHIR LA GALERIE DE TRAÇABILITÉ ---
//   const handleTraceabilityActionSuccess = () => {
//     setRefreshTraceability(prev => prev + 1);
//   };
//   // --- FIN FONCTION RAFRAÎCHIR ---

//   // --- LOGIQUE POUR LES ALERTES (fetcher) ---
//   const fetchAndDisplayAlerts = async () => {
//     try {
//       const fetchedAlerts = await getMyAlerts();
//       setAlerts(fetchedAlerts);
//       const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
//       if (newAlert && !currentAlert) {
//         setCurrentAlert(newAlert);
//       }
//     } catch (error) {
//       console.error('Erreur lors de la récupération des alertes:', error);
//     }
//   };


//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   // --- DÉFINITION DES BOUTONS DE LA BARRE LATÉRALE ---
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section p-6 bg-white rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-gray-800">Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message text-red-600 mb-4">{errorEmployees}</p>}
//           {loadingEmployees ? <p className="text-gray-600">Chargement des employés...</p> : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white border border-gray-200 rounded-lg">
//                 <thead>
//                   <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     <th className="py-3 px-4 border-b">ID</th>
//                     <th className="py-3 px-4 border-b">Email</th>
//                     <th className="py-3 px-4 border-b">Nom</th>
//                     <th className="py-3 px-4 border-b">Prénom</th>
//                     <th className="py-3 px-4 border-b">Entreprise</th>
//                     <th className="py-3 px-4 border-b">SIRET</th>
//                     <th className="py-3 px-4 border-b">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {employees.length === 0 ? (
//                     <tr><td colSpan="7" className="py-3 px-4 text-center text-gray-500">Aucun employé trouvé.</td></tr>
//                   ) : (
//                     employees.map(emp => (
//                       <tr key={emp.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.id}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.email}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.nom_client}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.prenom_client}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.nom_entreprise}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{emp.siret}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">
//                           <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2">Modifier</button>
//                           <button className="action-button delete-button text-red-600 hover:text-red-800">Supprimer</button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//           <h4 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p className="text-gray-600">Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements',
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section p-6 bg-white rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-gray-800">Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message text-red-600 mb-4">{errorEquipments}</p>}
//           {loadingEquipments ? <p className="text-gray-600">Chargement des équipements...</p> : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white border border-gray-200 rounded-lg">
//                 <thead>
//                   <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     <th className="py-3 px-4 border-b">ID</th>
//                     <th className="py-3 px-4 border-b">Nom</th>
//                     <th className="py-3 px-4 border-b">Type</th>
//                     <th className="py-3 px-4 border-b">Temp. Type</th>
//                     <th className="py-3 px-4 border-b">Min. Temp.</th>
//                     <th className="py-3 px-4 border-b">Max. Temp.</th>
//                     <th className="py-3 px-4 border-b">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {equipments.length === 0 ? (
//                     <tr><td colSpan="7" className="py-3 px-4 text-center text-gray-500">Aucun équipement trouvé.</td></tr>
//                   ) : (
//                     equipments.map(eq => (
//                       <tr key={eq.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.id}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.name}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.type}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">
//                           <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2" onClick={() => {
//                             alert(`Modifier l'équipement ${eq.name}`);
//                           }}>Modifier</button>
//                           <button className="action-button delete-button text-red-600 hover:text-red-800" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//           <h4 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section p-6 bg-white rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-gray-800">Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message text-red-600 mb-4">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p className="text-gray-600">Chargement des relevés...</p> : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white border border-gray-200 rounded-lg">
//                 <thead>
//                   <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     <th className="py-3 px-4 border-b">ID</th>
//                     <th className="py-3 px-4 border-b">Type App.</th>
//                     <th className="py-3 px-4 border-b">Emplacement</th>
//                     <th className="py-3 px-4 border-b">Temp.</th>
//                     <th className="py-3 px-4 border-b">Type Temp.</th>
//                     <th className="py-3 px-4 border-b">Date</th>
//                     <th className="py-3 px-4 border-b">Employé ID</th>
//                     <th className="py-3 px-4 border-b">Entreprise Client</th>
//                     <th className="py-3 px-4 border-b">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {temperatureRecords.length === 0 ? (
//                     <tr><td colSpan="9" className="py-3 px-4 text-center text-gray-500">Aucun relevé de température trouvé.</td></tr>
//                   ) : (
//                     temperatureRecords.map(record => (
//                       <tr key={record.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.id}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.type}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.location}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.temperature}°C</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{new Date(record.timestamp).toLocaleString()}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.user_id}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">{record.client_nom_entreprise}</td>
//                         <td className="py-3 px-4 text-sm text-gray-700">
//                           <button className="action-button edit-button text-blue-600 hover:text-blue-800 mr-2">Modifier</button>
//                           <button className="action-button delete-button text-red-600 hover:text-red-800">Supprimer</button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Traçabilité',
//       title: 'Gérer les enregistrements de traçabilité (photos, produits, dates)',
//       content: (
//         <div className="traceability-section p-6 bg-white rounded-lg shadow-md">
//           <h2 className="text-2xl font-semibold mb-4 text-gray-800">Gestion de la Traçabilité</h2>
//           <AddTraceabilityForm onRecordAdded={handleTraceabilityActionSuccess} />
//           <div className="mt-8">
//             <h3 className="text-xl font-semibold mb-4 text-gray-700">Galerie des Enregistrements</h3>
//             <TraceabilityRecordsGallery refreshTrigger={refreshTraceability} />
//           </div>
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Clients',
//       title: 'Gérer les informations de vos clients et de leurs établissements',
//       content: (
//         <div className="admin-section p-6 bg-white rounded-lg shadow-md">
//           <UserClientManagement />
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message text-3xl font-bold text-gray-900 mb-6">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro text-gray-700 mb-8">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements, leurs relevés de température et la traçabilité.</p>

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

// export default AdminClientDashboardPage;
 


















// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Utilise axiosInstance pour la cohérence
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import TemperatureEntryForm from '../components/TemperatureEntryForm';
// import EquipmentForm from '../components/EquipmentForm';
// import './AdminClientDashboardPage.css';

// // --- IMPORTS POUR LES PHOTOS (ANCIENS) ---
// // Ces imports ne sont plus utilisés directement ici, car la gestion des photos est maintenant dans la modale de traçabilité
// // import PhotoUploadForm from '../components/PhotoUploadForm'; 
// // import PhotoGallery from '../components/PhotoGallery';     
// // --- FIN IMPORTS PHOTOS ---

// // --- IMPORTS POUR LES ALERTES ---
// import AlertPopup from '../components/AlertPopup';
// import { getMyAlerts, markAlertAsRead } from '../services/alertService';
// // --- FIN IMPORTS ALERTES ---

// // --- NOUVEAUX IMPORTS POUR LA TRAÇABILITÉ ---
// import TraceabilityModal from '../components/TraceabilityModal'; // Importe la nouvelle modale
// // --- FIN NOUVEAUX IMPORTS TRAÇABILITÉ ---

// // --- NOUVEL IMPORT POUR LA GESTION DES CLIENTS ---
// import UserClientManagement from '../components/UserClientManagement'; // Importe le composant de gestion des clients
// // --- FIN NOUVEL IMPORT ---

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true);
//   const [errorEquipments, setErrorEquipments] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   // --- ÉTATS POUR LES ALERTES ---
//   const [alerts, setAlerts] = useState([]);
//   const [currentAlert, setCurrentAlert] = useState(null);
//   // --- FIN ÉTATS ALERTES ---

//   // --- ÉTATS POUR LA TRAÇABILITÉ ---
//   const [adminClientSiret, setAdminClientSiret] = useState(null);
//   const [showTraceabilityModal, setShowTraceabilityModal] = useState(false); // Contrôle l'affichage de la modale
//   const [refreshTraceability, setRefreshTraceability] = useState(0); // Pour forcer le rechargement de la galerie dans la modale
//   const [currentUserId, setCurrentUserId] = useState(null); // Pour passer l'ID de l'employé qui upload
//   // --- FIN ÉTATS TRAÇABILITÉ ---


//   useEffect(() => {
//     // Récupère l'ID de l'utilisateur connecté (qui est l'Admin Client ici)
//     const userId = localStorage.getItem('userId');
//     if (userId) {
//       setCurrentUserId(userId);
//     }

//     fetchAdminClientProfile();
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//     fetchEquipments();

//     // --- LOGIQUE POUR LES ALERTES ---
//     const fetchAndDisplayAlerts = async () => {
//       try {
//         const fetchedAlerts = await getMyAlerts();
//         setAlerts(fetchedAlerts);
//         const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
//         if (newAlert && !currentAlert) {
//           setCurrentAlert(newAlert);
//         }
//       } catch (error) {
//         console.error('Erreur lors de la récupération des alertes:', error);
//       }
//     };

//     fetchAndDisplayAlerts();
//     const alertInterval = setInterval(fetchAndDisplayAlerts, 60000);

//     return () => {
//       clearInterval(alertInterval);
//     };
//   }, [currentAlert, refreshTraceability]); // refreshTraceability ajouté aux dépendances

//   // --- FONCTION POUR MARQUER L'ALERTE COMME LUE ---
//   const handleDismissAlert = async () => {
//     if (currentAlert) {
//       try {
//         await markAlertAsRead(currentAlert.id);
//         setAlerts(prevAlerts => prevAlerts.map(a =>
//           a.id === currentAlert.id ? { ...a, status: 'read' } : a
//         ));
//         setCurrentAlert(null);
//       } catch (error) {
//         console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
//       }
//     }
//   };
//   // --- FIN FONCTION ---

//   const fetchAdminClientProfile = async () => {
//     try {
//       const response = await axiosInstance.get('/users/profile');
//       setAdminClientProfile(response.data);
//       if (response.data && response.data.siret) {
//         setAdminClientSiret(response.data.siret);
//         localStorage.setItem('userSiret', response.data.siret);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const response = await axiosInstance.get('/admin-client/employees');
//       if (Array.isArray(response.data)) {
//         setEmployees(response.data);
//       } else {
//         console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const response = await axiosInstance.get('/admin-client/temperatures');
//       if (Array.isArray(response.data)) {
//         setTemperatureRecords(response.data);
//       } else {
//         console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
//         setTemperatureRecords([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const response = await axiosInstance.get('/admin-client/equipments');
//       if (response.data && Array.isArray(response.data.equipments)) {
//         setEquipments(response.data.equipments);
//       } else {
//         console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
//         setEquipments([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     fetchEquipments();
//   };

//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         await axiosInstance.delete(`/admin-client/equipments/${equipmentId}`);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   // --- FONCTION POUR RAFRAÎCHIR LA GALERIE DE TRAÇABILITÉ ---
//   const handleTraceabilityActionSuccess = () => {
//     setRefreshTraceability(prev => prev + 1); // Incrémente pour déclencher le rechargement
//   };
//   // --- FIN FONCTION RAFRAÎCHIR ---

//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   // --- DÉFINITION DES BOUTONS DE LA BARRE LATÉRALE ---
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Email</th><th>Nom</th><th>Prénom</th><th>Entreprise</th><th>SIRET</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {employees.length === 0 ? (
//                   <tr><td colSpan="7">Aucun employé trouvé.</td></tr>
//                 ) : (
//                   employees.map(emp => (
//                     <tr key={emp.id}>
//                       <td>{emp.id}</td>
//                       <td>{emp.email}</td>
//                       <td>{emp.nom_client}</td>
//                       <td>{emp.prenom_client}</td>
//                       <td>{emp.nom_entreprise}</td>
//                       <td>{emp.siret}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements',
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message">{errorEquipments}</p>}
//           {loadingEquipments ? <p>Chargement des équipements...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Nom</th><th>Type</th><th>Temp. Type</th><th>Min. Temp.</th><th>Max. Temp.</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {equipments.length === 0 ? (
//                   <tr><td colSpan="7">Aucun équipement trouvé.</td></tr>
//                 ) : (
//                   equipments.map(eq => (
//                     <tr key={eq.id}>
//                       <td>{eq.id}</td>
//                       <td>{eq.name}</td>
//                       <td>{eq.type}</td>
//                       <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                       <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                       <td>
//                         <button className="action-button edit-button" onClick={() => {
//                           alert(`Modifier l'équipement ${eq.name}`);
//                         }}>Modifier</button>
//                         <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Type App.</th><th>Emplacement</th><th>Temp.</th><th>Type Temp.</th><th>Date</th><th>Employé ID</th><th>Entreprise Client</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.length === 0 ? (
//                   <tr><td colSpan="9">Aucun relevé de température trouvé.</td></tr>
//                 ) : (
//                   temperatureRecords.map(record => (
//                     <tr key={record.id}>
//                       <td>{record.id}</td>
//                       <td>{record.type}</td>
//                       <td>{record.location}</td>
//                       <td>{record.temperature}°C</td>
//                       <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{new Date(record.timestamp).toLocaleString()}</td>
//                       <td>{record.user_id}</td>
//                       <td>{record.client_nom_entreprise}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Traçabilité', // NOUVEAU BOUTON POUR LA TRAÇABILITÉ
//       title: 'Gérer les enregistrements de traçabilité (photos, produits, dates)',
//       onClick: () => setShowTraceabilityModal(true), // Ouvre la modale
//       content: null // Le contenu est dans la modale, pas directement dans le DashboardLayout
//     },
//     { // NOUVEAU BOUTON : Gérer les Clients
//       label: 'Gérer les Clients',
//       title: 'Gérer les informations de vos clients et de leurs établissements',
//       content: (
//         <div className="admin-section">
//           {/* Le composant UserClientManagement sera affiché ici */}
//           <UserClientManagement />
//         </div>
//       )
//     }
//   ];
//   // --- FIN DÉFINITION DES BOUTONS ---

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements, leurs relevés de température et la traçabilité.</p>

//       {/* --- AFFICHAGE DE LA POP-UP D'ALERTE --- */}
//       {currentAlert && (
//           <AlertPopup
//               message={currentAlert.message}
//               onDismiss={handleDismissAlert}
//           />
//       )}
//       {/* --- FIN AFFICHAGE DE LA POP-UP D'ALERTE --- */}

//       {/* --- AFFICHAGE DE LA MODALE DE TRAÇABILITÉ --- */}
//       {showTraceabilityModal && adminClientSiret && currentUserId && (
//         <TraceabilityModal
//           siret={adminClientSiret}
//           employeeId={currentUserId} // L'Admin Client est l'employé qui crée l'enregistrement ici
//           onClose={() => setShowTraceabilityModal(false)}
//           onRecordActionSuccess={handleTraceabilityActionSuccess}
//         />
//       )}
//       {/* --- FIN AFFICHAGE MODALE TRAÇABILITÉ --- */}
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;













// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import TemperatureEntryForm from '../components/TemperatureEntryForm'; // Gardé si utilisé ailleurs, sinon peut être retiré
// import EquipmentForm from '../components/EquipmentForm';
// import './AdminClientDashboardPage.css';

// // --- IMPORTS POUR LES PHOTOS ---
// import PhotoUploadForm from '../components/PhotoUploadForm'; // <<< NOUVEL IMPORT
// import PhotoGallery from '../components/PhotoGallery';     // <<< NOUVEL IMPORT
// // --- FIN IMPORTS PHOTOS ---

// // --- NOUVEAUX IMPORTS POUR LES ALERTES ---
// import AlertPopup from '../components/AlertPopup'; // Importez le composant de pop-up
// import { getMyAlerts, markAlertAsRead } from '../services/alertService'; // Importez le service d'alertes
// // --- FIN NOUVEAUX IMPORTS ---

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true);
//   const [errorEquipments, setErrorEquipments] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   // --- NOUVEAUX ÉTATS POUR LES ALERTES ---
//   const [alerts, setAlerts] = useState([]);
//   const [currentAlert, setCurrentAlert] = useState(null); // Pour l'alerte actuellement affichée en pop-up
//   // --- FIN NOUVEAUX ÉTATS ---

//   // --- NOUVEAUX ÉTATS POUR LES PHOTOS ---
//   const [adminClientSiret, setAdminClientSiret] = useState(null); // <<< NOUVEL ÉTAT POUR LE SIRET
//   const [refreshPhotos, setRefreshPhotos] = useState(0); // <<< NOUVEL ÉTAT pour forcer le rechargement de la galerie
//   // --- FIN NOUVEAUX ÉTATS PHOTOS ---


//   useEffect(() => {
//     fetchAdminClientProfile();
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//     fetchEquipments();

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
//         console.error('Erreur lors de la récupération des alertes:', error);
//       }
//     };

//     fetchAndDisplayAlerts(); // Récupère les alertes au chargement initial

//     // Polling pour vérifier les nouvelles alertes toutes les minutes
//     // Soyez PRUDENT avec setInterval : assurez-vous de bien le nettoyer !
//     const alertInterval = setInterval(fetchAndDisplayAlerts, 60000); // Vérifie toutes les minutes

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
//         console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
//       }
//     }
//   };
//   // --- FIN NOUVELLE FONCTION ---

//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/users/profile', config);
//       setAdminClientProfile(response.data);
//       // <<< AJOUTE ICI : Stocke le SIRET dans l'état local
//       if (response.data && response.data.siret) {
//         setAdminClientSiret(response.data.siret);
//         localStorage.setItem('userSiret', response.data.siret); // Stocke le SIRET dans localStorage aussi
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       if (Array.isArray(response.data)) {
//         setEmployees(response.data);
//       } else {
//         console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       if (Array.isArray(response.data)) {
//         setTemperatureRecords(response.data);
//       } else {
//         console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
//         setTemperatureRecords([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/equipments', config);
//       if (response.data && Array.isArray(response.data.equipments)) {
//         setEquipments(response.data.equipments);
//       } else {
//         console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
//         setEquipments([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     fetchEquipments();
//   };

//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         const token = localStorage.getItem('userToken');
//         const config = { headers: { 'Authorization': `Bearer ${token}` } };
//         await axios.delete(`http://localhost:5001/api/admin-client/equipments/${equipmentId}`, config);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   // --- FONCTION POUR RAFRAÎCHIR LA GALERIE PHOTO ---
//   const handlePhotoActionSuccess = () => {
//     setRefreshPhotos(prev => prev + 1); // Incrémente pour déclencher le useEffect dans PhotoGallery
//   };
//   // --- FIN FONCTION RAFRAÎCHIR ---

//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   // --- AJOUT DE NOUVEAUX BOUTONS POUR LES PHOTOS ---
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Email</th><th>Nom</th><th>Prénom</th><th>Entreprise</th><th>SIRET</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {employees.length === 0 ? (
//                   <tr><td colSpan="7">Aucun employé trouvé.</td></tr>
//                 ) : (
//                   employees.map(emp => (
//                     <tr key={emp.id}>
//                       <td>{emp.id}</td>
//                       <td>{emp.email}</td>
//                       <td>{emp.nom_client}</td>
//                       <td>{emp.prenom_client}</td>
//                       <td>{emp.nom_entreprise}</td>
//                       <td>{emp.siret}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements',
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message">{errorEquipments}</p>}
//           {loadingEquipments ? <p>Chargement des équipements...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Nom</th><th>Type</th><th>Temp. Type</th><th>Min. Temp.</th><th>Max. Temp.</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {equipments.length === 0 ? (
//                   <tr><td colSpan="7">Aucun équipement trouvé.</td></tr>
//                 ) : (
//                   equipments.map(eq => (
//                     <tr key={eq.id}>
//                       <td>{eq.id}</td>
//                       <td>{eq.name}</td>
//                       <td>{eq.type}</td>
//                       <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                       <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                       <td>
//                         <button className="action-button edit-button" onClick={() => {
//                           alert(`Modifier l'équipement ${eq.name}`);
//                         }}>Modifier</button>
//                         <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr><th>ID</th><th>Type App.</th><th>Emplacement</th><th>Temp.</th><th>Type Temp.</th><th>Date</th><th>Employé ID</th><th>Entreprise Client</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.length === 0 ? (
//                   <tr><td colSpan="9">Aucun relevé de température trouvé.</td></tr>
//                 ) : (
//                   temperatureRecords.map(record => (
//                     <tr key={record.id}>
//                       <td>{record.id}</td>
//                       <td>{record.type}</td>
//                       <td>{record.location}</td>
//                       <td>{record.temperature}°C</td>
//                       <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{new Date(record.timestamp).toLocaleString()}</td>
//                       <td>{record.user_id}</td>
//                       <td>{record.client_nom_entreprise}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Photos', // <<< NOUVEAU BOUTON POUR LES PHOTOS
//       title: 'Prendre et consulter les photos de produits',
//       content: (
//         <div className="admin-section">
//           {adminClientSiret ? ( // S'assure que le SIRET est disponible avant d'afficher les composants
//             <>
//               <PhotoUploadForm siret={adminClientSiret} onPhotoUploadSuccess={handlePhotoActionSuccess} />
//               <hr style={{ margin: '30px 0', borderColor: '#eee' }} />
//               <PhotoGallery siret={adminClientSiret} currentUserRole={localStorage.getItem('userRole')} onPhotoDeleted={handlePhotoActionSuccess} key={refreshPhotos} />
//             </>
//           ) : (
//             <p>Chargement des informations client pour les photos...</p>
//           )}
//         </div>
//       )
//     }
//   ];
//   // --- FIN AJOUT DE NOUVEAUX BOUTONS ---

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements et leurs relevés de température.</p>

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

// export default AdminClientDashboardPage;








// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import TemperatureEntryForm from '../components/TemperatureEntryForm';
// import EquipmentForm from '../components/EquipmentForm';
// import './AdminClientDashboardPage.css';

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true);
//   const [errorEquipments, setErrorEquipments] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   useEffect(() => {
//     fetchAdminClientProfile();
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//     fetchEquipments();
//   }, []);

//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/users/profile', config);
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       if (Array.isArray(response.data)) {
//         setEmployees(response.data);
//       } else {
//         console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       if (Array.isArray(response.data)) {
//         setTemperatureRecords(response.data);
//       } else {
//         console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
//         setTemperatureRecords([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/equipments', config);
//       // Correction : Assurez-vous que response.data.equipments est un tableau.
//       if (response.data && Array.isArray(response.data.equipments)) {
//         setEquipments(response.data.equipments);
//       } else {
//         console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
//         setEquipments([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     fetchEquipments();
//   };

//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         const token = localStorage.getItem('userToken');
//         const config = { headers: { 'Authorization': `Bearer ${token}` } };
//         await axios.delete(`http://localhost:5001/api/admin-client/equipments/${equipmentId}`, config);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 {/* Nettoyage des espaces blancs dans la balise tr */}
//                 <tr><th>ID</th><th>Email</th><th>Nom</th><th>Prénom</th><th>Entreprise</th><th>SIRET</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {employees.length === 0 ? (
//                   <tr><td colSpan="7">Aucun employé trouvé.</td></tr>
//                 ) : (
//                   employees.map(emp => (
//                     <tr key={emp.id}>
//                       <td>{emp.id}</td>
//                       <td>{emp.email}</td>
//                       <td>{emp.nom_client}</td>
//                       <td>{emp.prenom_client}</td>
//                       <td>{emp.nom_entreprise}</td>
//                       <td>{emp.siret}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements',
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message">{errorEquipments}</p>}
//           {loadingEquipments ? <p>Chargement des équipements...</p> : (
//             <table className="data-table">
//               <thead>
//                 {/* Nettoyage des espaces blancs dans la balise tr */}
//                 <tr><th>ID</th><th>Nom</th><th>Type</th><th>Temp. Type</th><th>Min. Temp.</th><th>Max. Temp.</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {equipments.length === 0 ? (
//                   <tr><td colSpan="7">Aucun équipement trouvé.</td></tr>
//                 ) : (
//                   equipments.map(eq => (
//                     <tr key={eq.id}>
//                       <td>{eq.id}</td>
//                       <td>{eq.name}</td>
//                       <td>{eq.type}</td>
//                       <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                       <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                       <td>
//                         <button className="action-button edit-button" onClick={() => {
//                           alert(`Modifier l'équipement ${eq.name}`);
//                         }}>Modifier</button>
//                         <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 {/* Nettoyage des espaces blancs dans la balise tr */}
//                 <tr><th>ID</th><th>Type App.</th><th>Emplacement</th><th>Temp.</th><th>Type Temp.</th><th>Date</th><th>Employé ID</th><th>Entreprise Client</th><th>Actions</th></tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.length === 0 ? (
//                   <tr><td colSpan="9">Aucun relevé de température trouvé.</td></tr>
//                 ) : (
//                   temperatureRecords.map(record => (
//                     <tr key={record.id}>
//                       <td>{record.id}</td>
//                       <td>{record.type}</td>
//                       <td>{record.location}</td>
//                       <td>{record.temperature}°C</td>
//                       <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                       <td>{new Date(record.timestamp).toLocaleString()}</td>
//                       <td>{record.user_id}</td>
//                       <td>{record.client_nom_entreprise}</td>
//                       <td>
//                         <button className="action-button edit-button">Modifier</button>
//                         <button className="action-button delete-button">Supprimer</button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements et leurs relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;








// frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import TemperatureEntryForm from '../components/TemperatureEntryForm'; // Importez le nouveau formulaire de température
// import EquipmentForm from '../components/EquipmentForm'; // Importez le nouveau formulaire d'équipement
// import './AdminClientDashboardPage.css';

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]); // Nouveau état pour les équipements
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true); // Nouveau état de chargement
//   const [errorEquipments, setErrorEquipments] = useState(''); // Nouvelle erreur
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   useEffect(() => {
//     fetchAdminClientProfile();
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//     fetchEquipments(); // Nouvelle fonction à appeler
//   }, []);

//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       // CORRECTED: Changed /api/users/me to /api/users/profile
//       const response = await axios.get('http://localhost:5001/api/users/profile', config);
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       // Added array check
//       if (Array.isArray(response.data)) {
//         setEmployees(response.data);
//       } else {
//         console.warn('API for employees did not return an array, defaulting to empty array.', response.data);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       // Added array check
//       if (Array.isArray(response.data)) {
//         setTemperatureRecords(response.data);
//       } else {
//         console.warn('API for temperature records did not return an array, defaulting to empty array.', response.data);
//         setTemperatureRecords([]);
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   // NOUVELLE FONCTION : Récupérer les équipements de l'Admin Client
//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/equipments', config); // Nouvelle route backend
//       // CORRECTED: Added check for array before setting state
//       // --- CORRECTION ICI : Accéder directement à .equipments et vérifier si c'est un tableau ---
//     if (response.data && Array.isArray(response.data.equipments)) {
//       setEquipments(response.data.equipments);
//     } else {
//       // Si la propriété 'equipments' n'est pas un tableau ou response.data est invalide
//       console.warn('API for equipments did not return an array in the "equipments" property, defaulting to empty array.', response.data);
//       setEquipments([]);
//     }
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   // NOUVELLE FONCTION : Gérer l'enregistrement/modification d'un équipement
//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       // Si l'équipement existe déjà (mise à jour)
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       // Nouvel équipement
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     // Après avoir enregistré, rafraîchir potentiellement la liste des emplacements
//     fetchEquipments();
//   };

//   // NOUVELLE FONCTION : Gérer la suppression d'un équipement
//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         const token = localStorage.getItem('userToken');
//         const config = { headers: { 'Authorization': `Bearer ${token}` } };
//         await axios.delete(`http://localhost:5001/api/admin-client/equipments/${equipmentId}`, config);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   // Définition des boutons pour la barre latérale de l'Admin Client
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Nom</th>
//                   <th>Prénom</th>
//                   <th>Entreprise</th>
//                   <th>SIRET</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {employees.map(emp => (
//                   <tr key={emp.id}>
//                     <td>{emp.id}</td>
//                     <td>{emp.email}</td>
//                     <td>{emp.nom_client}</td>
//                     <td>{emp.prenom_client}</td>
//                     <td>{emp.nom_entreprise}</td>
//                     <td>{emp.siret}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements', // NOUVEAU BOUTON
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message">{errorEquipments}</p>}
//           {loadingEquipments ? <p>Chargement des équipements...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Nom</th>
//                   <th>Type</th>
//                   <th>Temp. Type</th>
//                   <th>Min. Temp.</th>
//                   <th>Max. Temp.</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {/* CORRECTED: equipments is now guaranteed to be an array or empty array */}
//                 {equipments.map(eq => (
//                   <tr key={eq.id}>
//                     <td>{eq.id}</td>
//                     <td>{eq.name}</td>
//                     <td>{eq.type}</td>
//                     <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                     <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                     <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                     <td>
//                       {/* Ici, vous pouvez ajouter une logique pour l'édition, par exemple une modale */}
//                       <button className="action-button edit-button" onClick={() => {
//                         // Implémentez la logique d'édition ici (ex: afficher un formulaire d'édition dans une modale)
//                         alert(`Modifier l'équipement ${eq.name}`);
//                       }}>Modifier</button>
//                       <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Type App.</th> {/* Changé 'Type' en 'Type App.' pour clarifier */}
//                   <th>Emplacement</th>
//                   <th>Temp.</th>
//                   <th>Type Temp.</th> {/* Nouveau: Type de température */}
//                   <th>Date</th>
//                   <th>Employé ID</th>
//                   <th>Entreprise Client</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.map(record => (
//                   <tr key={record.id}>
//                     <td>{record.id}</td>
//                     <td>{record.type}</td>
//                     <td>{record.location}</td>
//                     <td>{record.temperature}°C</td>
//                     <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td> {/* Affiche le nouveau champ */}
//                     <td>{new Date(record.timestamp).toLocaleString()}</td>
//                     <td>{record.user_id}</td>
//                     <td>{record.client_nom_entreprise}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           {/* Option pour ajouter un relevé de température si vous le souhaitez */}
//           {/* <h4 className="mt-4">Ajouter un relevé de température</h4>
//           <TemperatureEntryForm
//             onTemperatureRecorded={fetchEmployeeTemperatureRecords} // Rafraîchit la liste après enregistrement
//             availableLocations={equipments.map(eq => ({ id: eq.id, name: eq.name }))} // Passe les noms des équipements
//           /> */}
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements et leurs relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;














// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import TemperatureEntryForm from '../components/TemperatureEntryForm'; // Importez le nouveau formulaire de température
// import EquipmentForm from '../components/EquipmentForm'; // Importez le nouveau formulaire d'équipement
// import './AdminClientDashboardPage.css';

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [equipments, setEquipments] = useState([]); // Nouveau état pour les équipements
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [loadingEquipments, setLoadingEquipments] = useState(true); // Nouveau état de chargement
//   const [errorEquipments, setErrorEquipments] = useState(''); // Nouvelle erreur
//   const [adminClientProfile, setAdminClientProfile] = useState(null);

//   useEffect(() => {
//     fetchAdminClientProfile();
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//     fetchEquipments(); // Nouvelle fonction à appeler
//   }, []);

//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/users/profile', config);
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//     }
//   };

//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       setEmployees(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//   };

//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       setTemperatureRecords(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   // NOUVELLE FONCTION : Récupérer les équipements de l'Admin Client
//   const fetchEquipments = async () => {
//     setLoadingEquipments(true);
//     setErrorEquipments('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/admin-client/equipments', config); // Nouvelle route backend
//       setEquipments(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des équipements:', err);
//       setErrorEquipments('Erreur lors du chargement des équipements.');
//     } finally {
//       setLoadingEquipments(false);
//     }
//   };

//   // NOUVELLE FONCTION : Gérer l'enregistrement/modification d'un équipement
//   const handleEquipmentSaved = (newOrUpdatedEquipment) => {
//     if (newOrUpdatedEquipment.id) {
//       // Si l'équipement existe déjà (mise à jour)
//       setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
//     } else {
//       // Nouvel équipement
//       setEquipments(prev => [...prev, newOrUpdatedEquipment]);
//     }
//     // Après avoir enregistré, rafraîchir potentiellement la liste des emplacements
//     fetchEquipments();
//   };

//   // NOUVELLE FONCTION : Gérer la suppression d'un équipement
//   const handleDeleteEquipment = async (equipmentId) => {
//     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
//       try {
//         const token = localStorage.getItem('userToken');
//         const config = { headers: { 'Authorization': `Bearer ${token}` } };
//         await axios.delete(`http://localhost:5001/api/admin-client/equipments/${equipmentId}`, config);
//         setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
//         alert('Équipement supprimé avec succès.');
//       } catch (err) {
//         console.error('Erreur lors de la suppression de l\'équipement:', err);
//         alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
//       }
//     }
//   };

//   const employeeFormInitialData = adminClientProfile ? {
//     admin_client_id: adminClientProfile.id,
//     isCreatingEmployeeByAdminClient: true
//   } : {
//     isCreatingEmployeeByAdminClient: true
//   };

//   // Définition des boutons pour la barre latérale de l'Admin Client
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Nom</th>
//                   <th>Prénom</th>
//                   <th>Entreprise</th>
//                   <th>SIRET</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {employees.map(emp => (
//                   <tr key={emp.id}>
//                     <td>{emp.id}</td>
//                     <td>{emp.email}</td>
//                     <td>{emp.nom_client}</td>
//                     <td>{emp.prenom_client}</td>
//                     <td>{emp.nom_entreprise}</td>
//                     <td>{emp.siret}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
//               isCreatingEmployeeByAdminClient={true}
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Équipements', // NOUVEAU BOUTON
//       title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Équipements</h3>
//           {errorEquipments && <p className="error-message">{errorEquipments}</p>}
//           {loadingEquipments ? <p>Chargement des équipements...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Nom</th>
//                   <th>Type</th>
//                   <th>Temp. Type</th>
//                   <th>Min. Temp.</th>
//                   <th>Max. Temp.</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {equipments.map(eq => (
//                   <tr key={eq.id}>
//                     <td>{eq.id}</td>
//                     <td>{eq.name}</td>
//                     <td>{eq.type}</td>
//                     <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
//                     <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
//                     <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
//                     <td>
//                       {/* Ici, vous pouvez ajouter une logique pour l'édition, par exemple une modale */}
//                       <button className="action-button edit-button" onClick={() => {
//                         // Implémentez la logique d'édition ici (ex: afficher un formulaire d'édition dans une modale)
//                         alert(`Modifier l'équipement ${eq.name}`);
//                       }}>Modifier</button>
//                       <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel équipement</h4>
//           <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Type App.</th> {/* Changé 'Type' en 'Type App.' pour clarifier */}
//                   <th>Emplacement</th>
//                   <th>Temp.</th>
//                   <th>Type Temp.</th> {/* Nouveau: Type de température */}
//                   <th>Date</th>
//                   <th>Employé ID</th>
//                   <th>Entreprise Client</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.map(record => (
//                   <tr key={record.id}>
//                     <td>{record.id}</td>
//                     <td>{record.type}</td>
//                     <td>{record.location}</td>
//                     <td>{record.temperature}°C</td>
//                     <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td> {/* Affiche le nouveau champ */}
//                     <td>{new Date(record.timestamp).toLocaleString()}</td>
//                     <td>{record.user_id}</td>
//                     <td>{record.client_nom_entreprise}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           {/* Option pour ajouter un relevé de température si vous le souhaitez */}
//           {/* <h4 className="mt-4">Ajouter un relevé de température</h4>
//           <TemperatureEntryForm
//             onTemperatureRecorded={fetchEmployeeTemperatureRecords} // Rafraîchit la liste après enregistrement
//             availableLocations={equipments.map(eq => ({ id: eq.id, name: eq.name }))} // Passe les noms des équipements
//           /> */}
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements et leurs relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;





// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import './AdminClientDashboardPage.css';

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true); // Fixed: Added useState(true)
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null); // Pour stocker les infos de l'Admin Client

//   // Récupérer l'ID de l'Admin Client connecté depuis le localStorage
//   const adminClientId = parseInt(localStorage.getItem('userId'));

//   useEffect(() => {
//     fetchAdminClientProfile(); // Charger le profil de l'Admin Client
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//   }, []);

//   // Fonction pour récupérer le profil de l'Admin Client connecté
//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/users/me', config);
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//       // Gérer l'erreur, peut-être déconnecter si le token est invalide
//     }
//   };

//   // Fonction pour charger les employés rattachés à cet Admin Client
//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       setEmployees(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   // Fonction de rappel après la création d'un employé
//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//     // La modale se fermera automatiquement via le DashboardLayout si elle est gérée par le layout
//     // Sinon, vous devriez ajouter une logique pour fermer le formulaire ici.
//   };

//   // Fonction pour charger les relevés de température des employés rattachés
//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       setTemperatureRecords(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   // Préparer les données initiales pour la création d'un employé par l'Admin Client
//   // Note: siret n'est PAS inclus car l'employé n'a pas de siret propre.
//   // nom_entreprise, adresse, et admin_client_siret seront gérés automatiquement par le UserForm
//   // grâce à l'appel /api/users/me et le rôle 'employer' est forcé.
//   const employeeFormInitialData = adminClientProfile ? {
//     // Les champs de l'entreprise et de l'adresse seront pré-remplis par UserForm via 'users/me'
//     // C'est pourquoi nous ne les passons pas directement ici.
//     // admin_client_id: adminClientId est passé pour le backend, si nécessaire.
//     admin_client_id: adminClientId,
//     isCreatingEmployeeByAdminClient: true // <-- Déjà inclus dans la prop, mais bon de le rappeler
//   } : {
//     isCreatingEmployeeByAdminClient: true // <-- Si le profile n'est pas encore chargé, au moins cette prop est là
//   };


//   // Définition des boutons pour la barre latérale de l'Admin Client
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Nom</th>
//                   <th>Prénom</th>
//                   <th>Entreprise</th>
//                   <th>SIRET</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {employees.map(emp => (
//                   <tr key={emp.id}>
//                     <td>{emp.id}</td>
//                     <td>{emp.email}</td>
//                     <td>{emp.nom_client}</td>
//                     <td>{emp.prenom_client}</td>
//                     <td>{emp.nom_entreprise}</td>
//                     <td>{emp.siret}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
//               // C'EST LA LIGNE CLÉ : Indique au UserForm qu'un Admin Client crée un employé
//               isCreatingEmployeeByAdminClient={true} // <-- AJOUTÉE OU CONFIRMÉE ICI
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Type</th>
//                   <th>Emplacement</th>
//                   <th>Temp.</th>
//                   <th>Date</th>
//                   <th>Employé ID</th>
//                   <th>Entreprise Client</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.map(record => (
//                   <tr key={record.id}>
//                     <td>{record.id}</td>
//                     <td>{record.type}</td>
//                     <td>{record.location}</td>
//                     <td>{record.temperature}°C</td>
//                     <td>{new Date(record.timestamp).toLocaleString()}</td>
//                     <td>{record.user_id}</td>
//                     <td>{record.client_nom_entreprise}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés et leurs relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;










// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm';
// import './AdminClientDashboardPage.css';

// const AdminClientDashboardPage = () => {
//   const [employees, setEmployees] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(true);
//   const [errorEmployees, setErrorEmployees] = useState('');
//   const [loadingTemperatures, setLoadingTemperatures] = useState(true);
//   const [errorTemperatures, setErrorTemperatures] = useState('');
//   const [adminClientProfile, setAdminClientProfile] = useState(null); // Pour stocker les infos de l'Admin Client

//   // Récupérer l'ID de l'Admin Client connecté depuis le localStorage
//   const adminClientId = parseInt(localStorage.getItem('userId'));

//   useEffect(() => {
//     fetchAdminClientProfile(); // Charger le profil de l'Admin Client
//     fetchMyEmployees();
//     fetchEmployeeTemperatureRecords();
//   }, []);

//   // Fonction pour récupérer le profil de l'Admin Client connecté
//   const fetchAdminClientProfile = async () => {
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = { headers: { 'Authorization': `Bearer ${token}` } };
//       const response = await axios.get('http://localhost:5001/api/users/me', config);
//       setAdminClientProfile(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
//       // Gérer l'erreur, peut-être déconnecter si le token est invalide
//     }
//   };

//   // Fonction pour charger les employés rattachés à cet Admin Client
//   const fetchMyEmployees = async () => {
//     setLoadingEmployees(true);
//     setErrorEmployees('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
//       setEmployees(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des employés:', err);
//       setErrorEmployees('Erreur lors du chargement des employés.');
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   // Fonction de rappel après la création d'un employé
//   const handleEmployeeCreated = (newEmployee) => {
//     setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
//     // La modale se fermera automatiquement via le DashboardLayout
//   };

//   // Fonction pour charger les relevés de température des employés rattachés
//   const fetchEmployeeTemperatureRecords = async () => {
//     setLoadingTemperatures(true);
//     setErrorTemperatures('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
//       setTemperatureRecords(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température des employés:', err);
//       setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
//     } finally {
//       setLoadingTemperatures(false);
//     }
//   };

//   // Préparer les données initiales pour la création d'un employé par l'Admin Client
//   const employeeFormInitialData = adminClientProfile ? {
//     nom_entreprise: adminClientProfile.nom_entreprise,
//     adresse: adminClientProfile.adresse,
//     siret: adminClientProfile.siret,
//     role: 'employer',
//     admin_client_id: adminClientId
//   } : {};


//   // Définition des boutons pour la barre latérale de l'Admin Client
//   const sidebarButtons = [
//     {
//       label: 'Gérer mes Employés',
//       title: 'Gestion des employés de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Liste de mes Employés</h3>
//           {errorEmployees && <p className="error-message">{errorEmployees}</p>}
//           {loadingEmployees ? <p>Chargement des employés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Nom</th>
//                   <th>Prénom</th>
//                   <th>Entreprise</th>
//                   <th>SIRET</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {employees.map(emp => (
//                   <tr key={emp.id}>
//                     <td>{emp.id}</td>
//                     <td>{emp.email}</td>
//                     <td>{emp.nom_client}</td>
//                     <td>{emp.prenom_client}</td>
//                     <td>{emp.nom_entreprise}</td>
//                     <td>{emp.siret}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel employé</h4>
//           {adminClientProfile ? (
//             <UserForm
//               onUserCreated={handleEmployeeCreated}
//               initialData={employeeFormInitialData}
//               apiEndpointForCreation="http://localhost:5001/api/admin-client/employees" // CORRECTION ICI
//             />
//           ) : (
//             <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
//           )}
//         </div>
//       )
//     },
//     {
//       label: 'Relevés de mes Employés',
//       title: 'Historique des relevés de température de votre établissement',
//       content: (
//         <div className="admin-section">
//           <h3>Relevés de Température des Employés</h3>
//           {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
//           {loadingTemperatures ? <p>Chargement des relevés...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Type</th>
//                   <th>Emplacement</th>
//                   <th>Temp.</th>
//                   <th>Date</th>
//                   <th>Employé ID</th>
//                   <th>Entreprise Client</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {temperatureRecords.map(record => (
//                   <tr key={record.id}>
//                     <td>{record.id}</td>
//                     <td>{record.type}</td>
//                     <td>{record.location}</td>
//                     <td>{record.temperature}°C</td>
//                     <td>{new Date(record.timestamp).toLocaleString()}</td>
//                     <td>{record.user_id}</td>
//                     <td>{record.client_nom_entreprise}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Admin Client</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés et leurs relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminClientDashboardPage;













// // frontend/src/pages/AdminClientDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './AdminClientDashboardPage.css'; // Create this CSS file

// // Import components for admin_client management
// import UserClientManagement from '../components/UserClientManagement'; // To manage clients
// import TemperatureClientManagement from '../components/TemperatureClientManagement'; // To manage temperatures of their clients

// const AdminClientDashboardPage = () => {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'temperatures'

//     useEffect(() => {
//         const userRole = localStorage.getItem('userRole');
//         if (userRole !== 'admin_client') {
//             alert("Accès refusé. Seuls les administrateurs clients peuvent accéder à ce tableau de bord.");
//             navigate('/');
//         }
//     }, [navigate]);

//     return (
//         <div className="admin-client-dashboard-container">
//             <h1>Tableau de Bord Admin Client</h1>

//             <nav className="admin-client-nav">
//                 <button
//                     className={activeTab === 'clients' ? 'active' : ''}
//                     onClick={() => setActiveTab('clients')}
//                 >
//                     Gérer Mes Clients
//                 </button>
//                 <button
//                     className={activeTab === 'temperatures' ? 'active' : ''}
//                     onClick={() => setActiveTab('temperatures')}
//                 >
//                     Gérer les Relevés de Mes Clients
//                 </button>
//             </nav>

//             <div className="admin-client-content">
//                 {activeTab === 'clients' && <UserClientManagement />}
//                 {activeTab === 'temperatures' && <TemperatureClientManagement />}
//             </div>
//         </div>
//     );
// };

// export default AdminClientDashboardPage;