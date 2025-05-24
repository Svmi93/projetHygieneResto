// frontend/src/pages/AdminClientDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import UserForm from '../components/UserForm';
import TemperatureEntryForm from '../components/TemperatureEntryForm'; // Importez le nouveau formulaire de température
import EquipmentForm from '../components/EquipmentForm'; // Importez le nouveau formulaire d'équipement
import './AdminClientDashboardPage.css';

const AdminClientDashboardPage = () => {
  const [employees, setEmployees] = useState([]);
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [equipments, setEquipments] = useState([]); // Nouveau état pour les équipements
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState('');
  const [loadingTemperatures, setLoadingTemperatures] = useState(true);
  const [errorTemperatures, setErrorTemperatures] = useState('');
  const [loadingEquipments, setLoadingEquipments] = useState(true); // Nouveau état de chargement
  const [errorEquipments, setErrorEquipments] = useState(''); // Nouvelle erreur
  const [adminClientProfile, setAdminClientProfile] = useState(null);

  useEffect(() => {
    fetchAdminClientProfile();
    fetchMyEmployees();
    fetchEmployeeTemperatureRecords();
    fetchEquipments(); // Nouvelle fonction à appeler
  }, []);

  const fetchAdminClientProfile = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      // CORRECTED: Changed /api/users/me to /api/users/profile
      const response = await axios.get('http://localhost:5001/api/users/profile', config);
      setAdminClientProfile(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du profil de l\'Admin Client:', err);
    }
  };

  const fetchMyEmployees = async () => {
    setLoadingEmployees(true);
    setErrorEmployees('');
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5001/api/admin-client/employees', config);
      // Added array check
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
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5001/api/admin-client/temperatures', config);
      // Added array check
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

  // NOUVELLE FONCTION : Récupérer les équipements de l'Admin Client
  const fetchEquipments = async () => {
    setLoadingEquipments(true);
    setErrorEquipments('');
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5001/api/admin-client/equipments', config); // Nouvelle route backend
      // CORRECTED: Added check for array before setting state
      // --- CORRECTION ICI : Accéder directement à .equipments et vérifier si c'est un tableau ---
    if (response.data && Array.isArray(response.data.equipments)) {
      setEquipments(response.data.equipments);
    } else {
      // Si la propriété 'equipments' n'est pas un tableau ou response.data est invalide
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

  // NOUVELLE FONCTION : Gérer l'enregistrement/modification d'un équipement
  const handleEquipmentSaved = (newOrUpdatedEquipment) => {
    if (newOrUpdatedEquipment.id) {
      // Si l'équipement existe déjà (mise à jour)
      setEquipments(prev => prev.map(eq => eq.id === newOrUpdatedEquipment.id ? newOrUpdatedEquipment : eq));
    } else {
      // Nouvel équipement
      setEquipments(prev => [...prev, newOrUpdatedEquipment]);
    }
    // Après avoir enregistré, rafraîchir potentiellement la liste des emplacements
    fetchEquipments();
  };

  // NOUVELLE FONCTION : Gérer la suppression d'un équipement
  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
      try {
        const token = localStorage.getItem('userToken');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        await axios.delete(`http://localhost:5001/api/admin-client/equipments/${equipmentId}`, config);
        setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
        alert('Équipement supprimé avec succès.');
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'équipement:', err);
        alert(`Erreur lors de la suppression de l'équipement: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const employeeFormInitialData = adminClientProfile ? {
    admin_client_id: adminClientProfile.id,
    isCreatingEmployeeByAdminClient: true
  } : {
    isCreatingEmployeeByAdminClient: true
  };

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
              apiEndpointForCreation="http://localhost:5001/api/admin-client/employees"
              isCreatingEmployeeByAdminClient={true}
            />
          ) : (
            <p>Chargement des informations de l'Admin Client pour le formulaire...</p>
          )}
        </div>
      )
    },
    {
      label: 'Gérer les Équipements', // NOUVEAU BOUTON
      title: 'Gestion de vos équipements (frigos, congélateurs, etc.)',
      content: (
        <div className="admin-section">
          <h3>Liste de mes Équipements</h3>
          {errorEquipments && <p className="error-message">{errorEquipments}</p>}
          {loadingEquipments ? <p>Chargement des équipements...</p> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Temp. Type</th>
                  <th>Min. Temp.</th>
                  <th>Max. Temp.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* CORRECTED: equipments is now guaranteed to be an array or empty array */}
                {equipments.map(eq => (
                  <tr key={eq.id}>
                    <td>{eq.id}</td>
                    <td>{eq.name}</td>
                    <td>{eq.type}</td>
                    <td>{eq.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td>
                    <td>{eq.min_temp !== null ? `${eq.min_temp}°C` : 'N/A'}</td>
                    <td>{eq.max_temp !== null ? `${eq.max_temp}°C` : 'N/A'}</td>
                    <td>
                      {/* Ici, vous pouvez ajouter une logique pour l'édition, par exemple une modale */}
                      <button className="action-button edit-button" onClick={() => {
                        // Implémentez la logique d'édition ici (ex: afficher un formulaire d'édition dans une modale)
                        alert(`Modifier l'équipement ${eq.name}`);
                      }}>Modifier</button>
                      <button className="action-button delete-button" onClick={() => handleDeleteEquipment(eq.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h4 className="mt-4">Ajouter un nouvel équipement</h4>
          <EquipmentForm onEquipmentSaved={handleEquipmentSaved} />
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
                  <th>Type App.</th> {/* Changé 'Type' en 'Type App.' pour clarifier */}
                  <th>Emplacement</th>
                  <th>Temp.</th>
                  <th>Type Temp.</th> {/* Nouveau: Type de température */}
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
                    <td>{record.temperature_type === 'positive' ? 'Positive' : 'Négative'}</td> {/* Affiche le nouveau champ */}
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
          {/* Option pour ajouter un relevé de température si vous le souhaitez */}
          {/* <h4 className="mt-4">Ajouter un relevé de température</h4>
          <TemperatureEntryForm
            onTemperatureRecorded={fetchEmployeeTemperatureRecords} // Rafraîchit la liste après enregistrement
            availableLocations={equipments.map(eq => ({ id: eq.id, name: eq.name }))} // Passe les noms des équipements
          /> */}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      <h2 className="welcome-message">Tableau de bord Admin Client</h2>
      <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer vos employés, vos équipements et leurs relevés de température.</p>
    </DashboardLayout>
  );
};

export default AdminClientDashboardPage;














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