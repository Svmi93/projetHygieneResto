import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import DashboardLayout from '../components/DashboardLayout';
import EquipmentForm from '../components/EquipmentForm';
import UserForm from '../components/UserForm'; // Le formulaire pour créer des utilisateurs/employés

// --- IMPORTS POUR LES ALERTES ---
import AlertPopup from '../components/AlertPopup';
import { getMyAlerts, markAlertAsRead } from '../services/alertService';
// --- FIN IMPORTS ALERTES ---

// --- NOUVEAUX IMPORTS POUR LA TRAÇABILITÉ ---
import AddTraceabilityForm from '../components/Traceability/AddTraceabilityForm';
import TraceabilityRecordsGallery from '../components/Traceability/TraceabilityRecordsGallery';
// --- FIN NOUVEAUX IMPORTS TRAÇABILITÉ ---

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
  const [, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  // --- FIN ÉTATS ALERTES ---

  // --- ÉTATS POUR LA TRAÇABILITÉ ---
  const [refreshTraceability, setRefreshTraceability] = useState(0);
  // --- FIN ÉTATS TRAÇABILITÉ ---


  // useEffect pour le chargement initial des données et la gestion des intervalles
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("AdminClientDashboardPage: Authenticated, fetching data...");
      fetchAdminClientProfile();
      fetchMyEmployees();
      fetchEmployeeTemperatureRecords();
      fetchEquipments();
      fetchAndDisplayAlerts(); // Déclenchement initial des alertes

      // Logique pour les alertes (intervalle)
      const alertInterval = setInterval(fetchAndDisplayAlerts, 60000);
      return () => {
        clearInterval(alertInterval); // Nettoyage de l'intervalle au démontage du composant
      };
    } else {
      console.log("AdminClientDashboardPage: Not authenticated or user not set, skipping data fetch.");
      // Réinitialiser les états si l'utilisateur n'est plus authentifié
      setEmployees([]);
      setTemperatureRecords([]);
      setEquipments([]);
      setAdminClientProfile(null);
      setAlerts([]);
      setCurrentAlert(null);
      setLoadingEmployees(false);
      setLoadingTemperatures(false);
      setLoadingEquipments(false);
    }
  }, [isAuthenticated, user]); // Dépendances: isAuthenticated et user. Les autres déclencheurs sont gérés par les handlers.

  // useEffect séparé pour les alertes et la traçabilité qui ont des déclencheurs spécifiques
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAndDisplayAlerts();
    }
  }, [currentAlert, refreshTraceability, isAuthenticated, user]); // Garder isAuthenticated et user ici pour s'assurer que les appels se font après auth


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
    console.log("Nouvel employé créé:", newEmployee);
    fetchMyEmployees(); // Re-fetch pour s'assurer que la liste est à jour après ajout
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
    if (newOrUpdatedEquipment.equipment) {
      // Add the new equipment to the state immediately
      setEquipments(prev => [...prev, newOrUpdatedEquipment.equipment]);
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
    setRefreshTraceability(prev => prev + 1); // Incrémente pour déclencher le re-fetch de la galerie
  };
  // --- FIN FONCTION RAFRAÎCHIR ---

  // --- LOGIQUE POUR LES ALERTES (fetcher) ---
  const fetchAndDisplayAlerts = async () => {
    try {
      const fetchedAlerts = await getMyAlerts();
      setAlerts(fetchedAlerts);
      const newAlert = fetchedAlerts.find(alert => alert.status === 'new');
      if (newAlert && !currentAlert) {
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
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      {/* Affichage conditionnel du logo de l'entreprise */}
      {isAuthenticated && user && user.logoUrl && (
        <div className="dashboard-logo-container mb-6">
          <img
            src={user.logoUrl}
            alt="Logo de l'entreprise"
            className="company-dashboard-logo rounded-md shadow-sm"
            style={{ maxWidth: '180px', maxHeight: '180px' }}
          />
        </div>
      )}

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
