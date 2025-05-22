// frontend/src/pages/AdminClientDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import UserForm from '../components/UserForm';
import './AdminClientDashboardPage.css';

const AdminClientDashboardPage = () => {
  const [employees, setEmployees] = useState([]);
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState('');
  const [loadingTemperatures, setLoadingTemperatures] = useState(true);
  const [errorTemperatures, setErrorTemperatures] = useState('');
  const [adminClientProfile, setAdminClientProfile] = useState(null); // Pour stocker les infos de l'Admin Client

  // Récupérer l'ID de l'Admin Client connecté depuis le localStorage
  const adminClientId = parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    fetchAdminClientProfile(); // Charger le profil de l'Admin Client
    fetchMyEmployees();
    fetchEmployeeTemperatureRecords();
  }, []);

  // Fonction pour récupérer le profil de l'Admin Client connecté
  const fetchAdminClientProfile = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5001/api/users/me', config);
      setAdminClientProfile(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
      // Gérer l'erreur, peut-être déconnecter si le token est invalide
    }
  };

  // Fonction pour charger les employés rattachés à cet Admin Client
  const fetchMyEmployees = async () => {
    setLoadingEmployees(true);
    setErrorEmployees('');
    try {
      const token = localStorage.getItem('userToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
      setEmployees(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des employés:', err);
      setErrorEmployees('Erreur lors du chargement des employés.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fonction de rappel après la création d'un employé
  const handleEmployeeCreated = (newEmployee) => {
    setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
    // La modale se fermera automatiquement via le DashboardLayout
  };

  // Fonction pour charger les relevés de température des employés rattachés
  const fetchEmployeeTemperatureRecords = async () => {
    setLoadingTemperatures(true);
    setErrorTemperatures('');
    try {
      const token = localStorage.getItem('userToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
      setTemperatureRecords(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des relevés de température des employés:', err);
      setErrorTemperatures('Erreur lors du chargement des relevés de température des employés.');
    } finally {
      setLoadingTemperatures(false);
    }
  };

  // Préparer les données initiales pour la création d'un employé par l'Admin Client
  const employeeFormInitialData = adminClientProfile ? {
    nom_entreprise: adminClientProfile.nom_entreprise,
    adresse: adminClientProfile.adresse,
    siret: adminClientProfile.siret,
    role: 'employer',
    admin_client_id: adminClientId
  } : {};


  // Définition des boutons pour la barre latérale de l'Admin Client
  const sidebarButtons = [
    {
      label: 'Gérer mes Employés',
      title: 'Gestion des employés de votre établissement',
      content: (
        <div className="admin-section">
          <h3>Liste de mes Employés</h3>
          {errorEmployees && <p className="error-message">{errorEmployees}</p>}
          {loadingEmployees ? <p>Chargement des employés...</p> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Entreprise</th>
                  <th>SIRET</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.email}</td>
                    <td>{emp.nom_client}</td>
                    <td>{emp.prenom_client}</td>
                    <td>{emp.nom_entreprise}</td>
                    <td>{emp.siret}</td>
                    <td>
                      <button className="action-button edit-button">Modifier</button>
                      <button className="action-button delete-button">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h4 className="mt-4">Ajouter un nouvel employé</h4>
          {adminClientProfile ? (
            <UserForm
              onUserCreated={handleEmployeeCreated}
              initialData={employeeFormInitialData}
              apiEndpointForCreation="http://localhost:5001/api/admin-client/employees" // CORRECTION ICI
            />
          ) : (
            <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
          )}
        </div>
      )
    },
    {
      label: 'Relevés de mes Employés',
      title: 'Historique des relevés de température de votre établissement',
      content: (
        <div className="admin-section">
          <h3>Relevés de Température des Employés</h3>
          {errorTemperatures && <p className="error-message">{errorTemperatures}</p>}
          {loadingTemperatures ? <p>Chargement des relevés...</p> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Emplacement</th>
                  <th>Temp.</th>
                  <th>Date</th>
                  <th>Employé ID</th>
                  <th>Entreprise Client</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {temperatureRecords.map(record => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.type}</td>
                    <td>{record.location}</td>
                    <td>{record.temperature}°C</td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                    <td>{record.user_id}</td>
                    <td>{record.client_nom_entreprise}</td>
                    <td>
                      <button className="action-button edit-button">Modifier</button>
                      <button className="action-button delete-button">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      <h2 className="welcome-message">Tableau de bord Admin Client</h2>
      <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés et leurs relevés de température.</p>
    </DashboardLayout>
  );
};

export default AdminClientDashboardPage;













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