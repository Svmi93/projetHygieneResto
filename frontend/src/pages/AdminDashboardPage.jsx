// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import UserForm from '../components/UserForm';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [temperatureRecords, setTemperatureRecords] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');

  useEffect(() => {
    fetchAllUsers();
    // fetchAllTemperatureRecords(); // Décommenter quand vous implémenterez la gestion des relevés
  }, []);

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers('');
    try {
      const token = localStorage.getItem('userToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.get('http://localhost:5001/api/admin/users', config);
      if (Array.isArray(response.data)) { // Ajout d'une vérification pour s'assurer que c'est un tableau
        setUsers(response.data);
      } else {
        console.warn('API for users did not return an array, defaulting to empty array.', response.data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setErrorUsers('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserCreated = (newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const fetchAllTemperatureRecords = async () => {
    // setLoading(true);
    // setError('');
    // try {
    //   // TODO: Implémenter l'appel API pour récupérer TOUS les relevés de température
    //   // Exemple: const response = await axios.get('http://localhost:5001/api/admin/temperatures', config);
    //   // setTemperatureRecords(response.data);
    //   console.log('Chargement de tous les relevés de température...');
    //   setTemperatureRecords([
    //     { id: 101, type: 'Frigo', location: 'Cuisine', temperature: 4.2, timestamp: '2023-01-01T10:00:00Z', user_id: 3 },
    //     { id: 102, type: 'Congélateur', location: 'Réserve', temperature: -18.5, timestamp: '2023-01-01T11:00:00Z', user_id: 3 },
    //   ]); // Données de test
    // } catch (err) {
    //   console.error('Erreur lors du chargement des relevés de température:', err);
    //   // setError('Erreur lors du chargement des relevés de température.');
    // } finally {
    //   // setLoading(false);
    // }
  };

  const sidebarButtons = [
    {
      label: 'Gérer les Utilisateurs',
      title: 'Gestion de tous les utilisateurs',
      content: (
        <div className="admin-section">
          <h3>Liste des Utilisateurs</h3>
          {errorUsers && <p className="error-message">{errorUsers}</p>}
          {loadingUsers ? <p>Chargement des utilisateurs...</p> : (
            <table className="data-table">
              <thead>
                {/* Nettoyage des espaces blancs dans la balise tr */}
                <tr><th>ID</th><th>Email</th><th>Rôle</th><th>Nom Entreprise</th><th>Nom Client</th><th>Prénom Client</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="7">Aucun utilisateur trouvé.</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.nom_entreprise}</td>
                      <td>{user.nom_client}</td>
                      <td>{user.prenom_client}</td>
                      <td>
                        <button className="action-button edit-button">Modifier</button>
                        <button className="action-button delete-button">Supprimer</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          <h4 className="mt-4">Ajouter un nouvel utilisateur</h4>
          <UserForm onUserCreated={handleUserCreated} />
        </div>
      )
    },
    {
      label: 'Gérer les Relevés',
      title: 'Gestion de tous les relevés de température',
      content: (
        <div className="admin-section">
          <h3>Tous les Relevés de Température</h3>
          <p>Tableau de tous les relevés de température ici.</p>
          <h4>Ajouter un relevé (pour un utilisateur spécifique)</h4>
          <p>Formulaire d'ajout de relevé ici (avec sélection d'utilisateur).</p>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout sidebarButtons={sidebarButtons}>
      <h2 className="welcome-message">Tableau de bord Super Admin</h2>
      <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer les utilisateurs et les relevés de température.</p>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;















// // frontend/src/pages/AdminDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DashboardLayout from '../components/DashboardLayout';
// import UserForm from '../components/UserForm'; // Importez le UserForm
// import './AdminDashboardPage.css'; // Créez ce fichier CSS si ce n'est pas déjà fait

// const AdminDashboardPage = () => {
//   const [users, setUsers] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]); // Garde cet état pour plus tard
//   const [loadingUsers, setLoadingUsers] = useState(true); // État de chargement spécifique aux utilisateurs
//   const [errorUsers, setErrorUsers] = useState(''); // Erreur spécifique aux utilisateurs

//   useEffect(() => {
//     fetchAllUsers();
//     // fetchAllTemperatureRecords(); // Décommenter quand vous implémenterez la gestion des relevés
//   }, []);

//   // Fonction pour charger tous les utilisateurs (pour le Super Admin)
//   const fetchAllUsers = async () => {
//     setLoadingUsers(true);
//     setErrorUsers('');
//     try {
//       const token = localStorage.getItem('userToken');
//       const config = {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       };
//       const response = await axios.get('http://localhost:5001/api/admin/users', config);
//       setUsers(response.data);
//     } catch (err) {
//       console.error('Erreur lors du chargement des utilisateurs:', err);
//       setErrorUsers('Erreur lors du chargement des utilisateurs.');
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

//   // Fonction de rappel après la création d'un utilisateur
//   const handleUserCreated = (newUser) => {
//     setUsers(prevUsers => [...prevUsers, newUser]); // Ajoute le nouvel utilisateur à la liste
//     // La modale se fermera automatiquement via le DashboardLayout
//   };

//   // Fonction pour charger tous les relevés de température (pour le Super Admin) - Placeholder pour l'instant
//   const fetchAllTemperatureRecords = async () => {
//     // setLoading(true);
//     // setError('');
//     // try {
//     //   // TODO: Implémenter l'appel API pour récupérer TOUS les relevés de température
//     //   // Exemple: const response = await axios.get('http://localhost:5001/api/admin/temperatures', config);
//     //   // setTemperatureRecords(response.data);
//     //   console.log('Chargement de tous les relevés de température...');
//     //   setTemperatureRecords([
//     //     { id: 101, type: 'Frigo', location: 'Cuisine', temperature: 4.2, timestamp: '2023-01-01T10:00:00Z', user_id: 3 },
//     //     { id: 102, type: 'Congélateur', location: 'Réserve', temperature: -18.5, timestamp: '2023-01-01T11:00:00Z', user_id: 3 },
//     //   ]); // Données de test
//     // } catch (err) {
//     //   console.error('Erreur lors du chargement des relevés de température:', err);
//     //   // setError('Erreur lors du chargement des relevés de température.');
//     // } finally {
//     //   // setLoading(false);
//     // }
//   };

//   // Définition des boutons pour la barre latérale du Super Admin
//   const sidebarButtons = [
//     {
//       label: 'Gérer les Utilisateurs',
//       title: 'Gestion de tous les utilisateurs',
//       content: (
//         <div className="admin-section">
//           <h3>Liste des Utilisateurs</h3>
//           {errorUsers && <p className="error-message">{errorUsers}</p>}
//           {loadingUsers ? <p>Chargement des utilisateurs...</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Rôle</th>
//                   <th>Nom Entreprise</th>
//                   <th>Nom Client</th>
//                   <th>Prénom Client</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map(user => (
//                   <tr key={user.id}>
//                     <td>{user.id}</td>
//                     <td>{user.email}</td>
//                     <td>{user.role}</td>
//                     <td>{user.nom_entreprise}</td>
//                     <td>{user.nom_client}</td>
//                     <td>{user.prenom_client}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4 className="mt-4">Ajouter un nouvel utilisateur</h4>
//           <UserForm onUserCreated={handleUserCreated} /> {/* Intégration du formulaire */}
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Relevés',
//       title: 'Gestion de tous les relevés de température',
//       content: (
//         <div className="admin-section">
//           <h3>Tous les Relevés de Température</h3>
//           {/* TODO: Remplacer par un composant AllTemperatureRecordsTable */}
//           <p>Tableau de tous les relevés de température ici.</p>
//           <h4>Ajouter un relevé (pour un utilisateur spécifique)</h4>
//           {/* TODO: Remplacer par un composant TemperatureEntryForm adapté pour Super Admin */}
//           <p>Formulaire d'ajout de relevé ici (avec sélection d'utilisateur).</p>
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Super Admin</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer les utilisateurs et les relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminDashboardPage;








// // frontend/src/pages/AdminDashboardPage.jsx
// import React, { useState, useEffect } from 'react';
// import DashboardLayout from '../components/DashboardLayout';
// import './AdminDashboardPage.css'; // Créez ce fichier CSS si ce n'est pas déjà fait

// const AdminDashboardPage = () => {
//   // État pour gérer les données (sera rempli par les composants de gestion des utilisateurs/températures)
//   const [users, setUsers] = useState([]);
//   const [temperatureRecords, setTemperatureRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Fonction pour charger tous les utilisateurs (pour le Super Admin)
//   const fetchAllUsers = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       // TODO: Implémenter l'appel API pour récupérer TOUS les utilisateurs
//       // Exemple: const response = await axios.get('http://localhost:5001/api/admin/users', config);
//       // setUsers(response.data);
//       console.log('Chargement de tous les utilisateurs...');
//       setUsers([
//         { id: 1, email: 'superadmin@example.com', role: 'super_admin', nom_entreprise: 'SuperCorp' },
//         { id: 2, email: 'adminclient1@example.com', role: 'admin_client', nom_entreprise: 'RestoPro' },
//         { id: 3, email: 'employee1@example.com', role: 'employer', nom_entreprise: 'RestoPro' },
//       ]); // Données de test
//     } catch (err) {
//       console.error('Erreur lors du chargement des utilisateurs:', err);
//       setError('Erreur lors du chargement des utilisateurs.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour charger tous les relevés de température (pour le Super Admin)
//   const fetchAllTemperatureRecords = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       // TODO: Implémenter l'appel API pour récupérer TOUS les relevés de température
//       // Exemple: const response = await axios.get('http://localhost:5001/api/admin/temperatures', config);
//       // setTemperatureRecords(response.data);
//       console.log('Chargement de tous les relevés de température...');
//       setTemperatureRecords([
//         { id: 101, type: 'Frigo', location: 'Cuisine', temperature: 4.2, timestamp: '2023-01-01T10:00:00Z', user_id: 3 },
//         { id: 102, type: 'Congélateur', location: 'Réserve', temperature: -18.5, timestamp: '2023-01-01T11:00:00Z', user_id: 3 },
//       ]); // Données de test
//     } catch (err) {
//       console.error('Erreur lors du chargement des relevés de température:', err);
//       setError('Erreur lors du chargement des relevés de température.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Définition des boutons pour la barre latérale du Super Admin
//   const sidebarButtons = [
//     {
//       label: 'Gérer les Utilisateurs',
//       title: 'Gestion de tous les utilisateurs',
//       content: (
//         <div className="admin-section">
//           <h3>Liste des Utilisateurs</h3>
//           {/* TODO: Remplacer par un composant UserManagementTable */}
//           {loading ? <p>Chargement des utilisateurs...</p> : error ? <p className="error-message">{error}</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Rôle</th>
//                   <th>Entreprise</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map(user => (
//                   <tr key={user.id}>
//                     <td>{user.id}</td>
//                     <td>{user.email}</td>
//                     <td>{user.role}</td>
//                     <td>{user.nom_entreprise}</td>
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4>Ajouter un nouvel utilisateur</h4>
//           {/* TODO: Remplacer par un composant UserForm */}
//           <p>Formulaire d'ajout d'utilisateur ici.</p>
//         </div>
//       )
//     },
//     {
//       label: 'Gérer les Relevés',
//       title: 'Gestion de tous les relevés de température',
//       content: (
//         <div className="admin-section">
//           <h3>Tous les Relevés de Température</h3>
//           {/* TODO: Remplacer par un composant AllTemperatureRecordsTable */}
//           {loading ? <p>Chargement des relevés...</p> : error ? <p className="error-message">{error}</p> : (
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Type</th>
//                   <th>Emplacement</th>
//                   <th>Temp.</th>
//                   <th>Date</th>
//                   <th>Utilisateur ID</th>
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
//                     <td>
//                       <button className="action-button edit-button">Modifier</button>
//                       <button className="action-button delete-button">Supprimer</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//           <h4>Ajouter un relevé (pour un utilisateur spécifique)</h4>
//           {/* TODO: Remplacer par un composant TemperatureEntryForm adapté pour Super Admin */}
//           <p>Formulaire d'ajout de relevé ici (avec sélection d'utilisateur).</p>
//         </div>
//       )
//     }
//   ];

//   return (
//     <DashboardLayout sidebarButtons={sidebarButtons}>
//       <h2 className="welcome-message">Tableau de bord Super Admin</h2>
//       <p className="dashboard-intro">Utilisez les boutons sur le côté gauche pour gérer les utilisateurs et les relevés de température.</p>
//     </DashboardLayout>
//   );
// };

// export default AdminDashboardPage;







// // // frontend/src/pages/AdminDashboardPage.jsx
// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import './AdminDashboardPage.css'; // Crée ce fichier CSS

// // // Importe les composants de gestion que nous allons créer
// // import UserManagement from '../components/UserManagement'; // Pour la gestion des utilisateurs
// // // import TemperatureManagement from '../components/TemperatureManagement'; // Pour la gestion des relevés (future)

// // const AdminDashboardPage = () => {
// //     const navigate = useNavigate();
// //     const [activeTab, setActiveTab] = useState('users'); // 'users', 'temperatures', etc.

// //     // Effet pour vérifier le rôle de l'utilisateur au chargement
// //     // et rediriger s'il n'est pas super_admin
// //     useEffect(() => {
// //         const userRole = localStorage.getItem('userRole');
// //         if (userRole !== 'super_admin') {
// //             alert("Accès refusé. Seuls les super administrateurs peuvent accéder à ce tableau de bord.");
// //             navigate('/'); // Redirige vers la page d'accueil
// //         }
// //     }, [navigate]); // Déclenche l'effet si 'navigate' change (rare, mais bonne pratique)

// //     return (
// //         <div className="admin-dashboard-container">
// //             <h1>Tableau de Bord Super Admin</h1>

// //             <nav className="admin-nav">
// //                 <button
// //                     className={activeTab === 'users' ? 'active' : ''}
// //                     onClick={() => setActiveTab('users')}
// //                 >
// //                     Gérer les utilisateurs
// //                 </button>
// //                 {/* Plus tard, ajoute d'autres boutons pour d'autres tables */}
// //                 {/*
// //                 <button
// //                     className={activeTab === 'temperatures' ? 'active' : ''}
// //                     onClick={() => setActiveTab('temperatures')}
// //                 >
// //                     Gérer les relevés de température
// //                 </button>
// //                 */}
// //             </nav>

// //             <div className="admin-content">
// //                 {activeTab === 'users' && <UserManagement />}
// //                 {/* {activeTab === 'temperatures' && <TemperatureManagement />} */}
// //             </div>
// //         </div>
// //     );
// // };

// // export default AdminDashboardPage;