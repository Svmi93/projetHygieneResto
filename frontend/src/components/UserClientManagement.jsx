// frontend/src/components/UserClientManagement.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './UserClientManagement.css'; // Create this CSS file

// L'URL de base est maintenant gérée par axiosInstance, donc le chemin est relatif
const API_BASE_URL_RELATIVE = '/admin-client';

const UserClientManagement = () => {
    // Renommé en 'employees' pour plus de clarté, car un admin_client gère des employés
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null); // Renommé pour l'édition
    const [newEmployee, setNewEmployee] = useState({ // Renommé pour la création
        nom_client: '', prenom_client: '', email: '',
        telephone: '', adresse: '', password: '', // Password needed for creation
        role: 'employer' // Le rôle est toujours 'employer' pour la création par un admin_client
    });
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission

    /**
     * Récupère la liste des employés via l'API.
     * Cible la route /admin-client/employees.
     */
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`${API_BASE_URL_RELATIVE}/employees`);
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors de la récupération des employés:', err);
            setError(err.response?.data?.message || 'Impossible de charger les employés. Accès refusé ou erreur serveur.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Ajoute un nouvel employé via l'API.
     * Cible la route /admin-client/employees.
     * @param {Object} employeeData Les données de l'employé à ajouter.
     */
    const addEmployee = async (employeeData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL_RELATIVE}/employees`, employeeData);
            setEmployees([...employees, response.data]);
            setNewEmployee({ // Réinitialise le formulaire
                nom_client: '', prenom_client: '', email: '',
                telephone: '', adresse: '', password: '', role: 'employer'
            });
            setError(null);
            alert('Employé ajouté avec succès!');
        } catch (err) {
            console.error('Erreur lors de l\'ajout de l\'employé:', err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'employé.');
        }
    };

    /**
     * Met à jour un employé existant via l'API.
     * Cible la route /admin-client/employees/:id.
     * @param {number} id L'ID de l'employé à mettre à jour.
     * @param {Object} updatedData Les données mises à jour de l'employé.
     */
    const updateEmployee = async (id, updatedData) => {
        try {
            const response = await axiosInstance.put(`${API_BASE_URL_RELATIVE}/employees/${id}`, updatedData);
            setEmployees(employees.map(emp => emp.id === id ? response.data : emp));
            setEditingEmployee(null);
            setError(null);
            alert('Employé mis à jour avec succès!');
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'employé:', err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'employé.');
        }
    };

    /**
     * Supprime un employé via l'API.
     * Cible la route /admin-client/employees/:id.
     * @param {number} id L'ID de l'employé à supprimer.
     */
    const deleteEmployee = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) {
            try {
                await axiosInstance.delete(`${API_BASE_URL_RELATIVE}/employees/${id}`);
                setEmployees(employees.filter(emp => emp.id !== id));
                setError(null);
                alert('Employé supprimé avec succès!');
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'employé:', err.response ? err.response.data : err);
                setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'employé.');
            }
        }
    };

    // Charge les employés au montage initial du composant
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Gestionnaire de changement pour le formulaire d'ajout de nouvel employé
    const handleNewEmployeeChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({ ...prev, [name]: value }));
    };

    // Gestionnaire de changement pour le formulaire d'édition d'employé
    const handleEditEmployeeChange = (e) => {
        const { name, value } = e.target;
        setEditingEmployee(prev => ({ ...prev, [name]: value }));
    };

    // Gestionnaire de soumission pour le formulaire d'ajout de nouvel employé
    const handleNewEmployeeSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addEmployee(newEmployee);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gestionnaire de soumission pour le formulaire d'édition d'employé
    const handleEditEmployeeSubmit = (e) => {
        e.preventDefault();
        updateEmployee(editingEmployee.id, editingEmployee);
    };

    // Affichage des messages de chargement et d'erreur
    if (loading) return <div className="loading-message">Chargement des employés...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="user-client-management-container">
            <h2>Gérer Mes Employés</h2>

            <section className="add-client-section">
                <h3>Ajouter un nouvel employé</h3>
                <form onSubmit={handleNewEmployeeSubmit}>
                    {/* Nom Entreprise et Adresse sont gérés par le backend pour les employés créés par admin_client */}
                    {/* <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newEmployee.nom_entreprise} onChange={handleNewEmployeeChange} required /> */}
                    <input type="text" name="nom_client" placeholder="Nom Employé" value={newEmployee.nom_client} onChange={handleNewEmployeeChange} required />
                    <input type="text" name="prenom_client" placeholder="Prénom Employé" value={newEmployee.prenom_client} onChange={handleNewEmployeeChange} required />
                    <input type="email" name="email" placeholder="Email" value={newEmployee.email} onChange={handleNewEmployeeChange} required />
                    <input type="password" name="password" placeholder="Mot de passe" value={newEmployee.password} onChange={handleNewEmployeeChange} required />
                    <input type="text" name="telephone" placeholder="Téléphone" value={newEmployee.telephone} onChange={handleNewEmployeeChange} />
                    <input type="text" name="adresse" placeholder="Adresse" value={newEmployee.adresse} onChange={handleNewEmployeeChange} />
                    {/* Le SIRET n'est pas pertinent pour un employé */}
                    <button type="submit" className="add-button" disabled={isSubmitting}>
                        {isSubmitting ? "Envoi en cours..." : "Ajouter Employé"}
                    </button>
                </form>
            </section>

            <section className="clients-list-section">
                <h3>Liste de Mes Employés</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom Employé</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(employee => (
                            <tr key={employee.id}>
                                <td>{employee.id}</td>
                                <td>{employee.nom_client} {employee.prenom_client}</td>
                                <td>{employee.email}</td>
                                <td>{employee.telephone || '-'}</td>
                                <td className="actions-cell">
                                    <button onClick={() => setEditingEmployee({ ...employee, password: '' })} className="edit-button">Éditer</button>
                                    <button onClick={() => deleteEmployee(employee.id)} className="delete-button">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {editingEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Éditer Employé</h3>
                        <form onSubmit={handleEditEmployeeSubmit}>
                            <label>Nom Employé:</label><input type="text" name="nom_client" value={editingEmployee.nom_client} onChange={handleEditEmployeeChange} required />
                            <label>Prénom Employé:</label><input type="text" name="prenom_client" value={editingEmployee.prenom_client} onChange={handleEditEmployeeChange} required />
                            <label>Email:</label><input type="email" name="email" value={editingEmployee.email} onChange={handleEditEmployeeChange} required />
                            <label>Mot de passe: (Laisser vide pour ne pas changer)</label><input type="password" name="password" value={editingEmployee.password} onChange={handleEditEmployeeChange} />
                            <label>Téléphone:</label><input type="text" name="telephone" value={editingEmployee.telephone || ''} onChange={handleEditEmployeeChange} />
                            <label>Adresse:</label><input type="text" name="adresse" value={editingEmployee.adresse || ''} onChange={handleEditEmployeeChange} />
                            <div className="modal-buttons">
                                <button type="submit" className="save-button">Enregistrer</button>
                                <button type="button" onClick={() => setEditingEmployee(null)} className="cancel-button">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserClientManagement;







// // frontend/src/components/UserClientManagement.jsx
// import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
// import './UserClientManagement.css'; // Create this CSS file

// // L'URL de base est maintenant gérée par axiosInstance, donc le chemin est relatif
// const API_BASE_URL_RELATIVE = '/admin-client';

// const UserClientManagement = () => {
//     // Renommé en 'employees' pour plus de clarté, car un admin_client gère des employés
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [editingEmployee, setEditingEmployee] = useState(null); // Renommé pour l'édition
//     const [newEmployee, setNewEmployee] = useState({ // Renommé pour la création
//         nom_client: '', prenom_client: '', email: '',
//         telephone: '', adresse: '', password: '', // Password needed for creation
//         role: 'employer' // Le rôle est toujours 'employer' pour la création par un admin_client
//     });

//     /**
//      * Récupère la liste des employés via l'API.
//      * Cible la route /admin-client/employees.
//      */
//     const fetchEmployees = async () => {
//         setLoading(true);
//         try {
//             const response = await axiosInstance.get(`${API_BASE_URL_RELATIVE}/employees`); // CORRIGÉ ICI
//             setEmployees(response.data);
//             setError(null);
//         } catch (err) {
//             console.error('Erreur lors de la récupération des employés:', err);
//             setError(err.response?.data?.message || 'Impossible de charger les employés. Accès refusé ou erreur serveur.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     /**
//      * Ajoute un nouvel employé via l'API.
//      * Cible la route /admin-client/employees.
//      * @param {Object} employeeData Les données de l'employé à ajouter.
//      */
//     const addEmployee = async (employeeData) => {
//         try {
//             const response = await axiosInstance.post(`${API_BASE_URL_RELATIVE}/employees`, employeeData); // CORRIGÉ ICI
//             setEmployees([...employees, response.data]);
//             setNewEmployee({ // Réinitialise le formulaire
//                 nom_client: '', prenom_client: '', email: '',
//                 telephone: '', adresse: '', password: '', role: 'employer'
//             });
//             setError(null);
//             alert('Employé ajouté avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de l\'ajout de l\'employé:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'employé.');
//         }
//     };

//     /**
//      * Met à jour un employé existant via l'API.
//      * Cible la route /admin-client/employees/:id.
//      * @param {number} id L'ID de l'employé à mettre à jour.
//      * @param {Object} updatedData Les données mises à jour de l'employé.
//      */
//     const updateEmployee = async (id, updatedData) => {
//         try {
//             const response = await axiosInstance.put(`${API_BASE_URL_RELATIVE}/employees/${id}`, updatedData); // CORRIGÉ ICI
//             setEmployees(employees.map(emp => emp.id === id ? response.data : emp));
//             setEditingEmployee(null);
//             setError(null);
//             alert('Employé mis à jour avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de la mise à jour de l\'employé:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'employé.');
//         }
//     };

//     /**
//      * Supprime un employé via l'API.
//      * Cible la route /admin-client/employees/:id.
//      * @param {number} id L'ID de l'employé à supprimer.
//      */
//     const deleteEmployee = async (id) => {
//         if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) {
//             try {
//                 await axiosInstance.delete(`${API_BASE_URL_RELATIVE}/employees/${id}`); // CORRIGÉ ICI
//                 setEmployees(employees.filter(emp => emp.id !== id));
//                 setError(null);
//                 alert('Employé supprimé avec succès!');
//             } catch (err) {
//                 console.error('Erreur lors de la suppression de l\'employé:', err.response ? err.response.data : err);
//                 setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'employé.');
//             }
//         }
//     };

//     // Charge les employés au montage initial du composant
//     useEffect(() => {
//         fetchEmployees();
//     }, []);

//     // Gestionnaire de changement pour le formulaire d'ajout de nouvel employé
//     const handleNewEmployeeChange = (e) => {
//         const { name, value } = e.target;
//         setNewEmployee(prev => ({ ...prev, [name]: value }));
//     };

//     // Gestionnaire de changement pour le formulaire d'édition d'employé
//     const handleEditEmployeeChange = (e) => {
//         const { name, value } = e.target;
//         setEditingEmployee(prev => ({ ...prev, [name]: value }));
//     };

//     // Gestionnaire de soumission pour le formulaire d'ajout de nouvel employé
//     const handleNewEmployeeSubmit = (e) => {
//         e.preventDefault();
//         addEmployee(newEmployee);
//     };

//     // Gestionnaire de soumission pour le formulaire d'édition d'employé
//     const handleEditEmployeeSubmit = (e) => {
//         e.preventDefault();
//         updateEmployee(editingEmployee.id, editingEmployee);
//     };

//     // Affichage des messages de chargement et d'erreur
//     if (loading) return <div className="loading-message">Chargement des employés...</div>;
//     if (error) return <div className="error-message">{error}</div>;

//     return (
//         <div className="user-client-management-container">
//             <h2>Gérer Mes Employés</h2>

//             <section className="add-client-section">
//                 <h3>Ajouter un nouvel employé</h3>
//                 <form onSubmit={handleNewEmployeeSubmit}>
//                     {/* Nom Entreprise et Adresse sont gérés par le backend pour les employés créés par admin_client */}
//                     {/* <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newEmployee.nom_entreprise} onChange={handleNewEmployeeChange} required /> */}
//                     <input type="text" name="nom_client" placeholder="Nom Employé" value={newEmployee.nom_client} onChange={handleNewEmployeeChange} required />
//                     <input type="text" name="prenom_client" placeholder="Prénom Employé" value={newEmployee.prenom_client} onChange={handleNewEmployeeChange} required />
//                     <input type="email" name="email" placeholder="Email" value={newEmployee.email} onChange={handleNewEmployeeChange} required />
//                     <input type="password" name="password" placeholder="Mot de passe" value={newEmployee.password} onChange={handleNewEmployeeChange} required />
//                     <input type="text" name="telephone" placeholder="Téléphone" value={newEmployee.telephone} onChange={handleNewEmployeeChange} />
//                     <input type="text" name="adresse" placeholder="Adresse" value={newEmployee.adresse} onChange={handleNewEmployeeChange} />
//                     {/* Le SIRET n'est pas pertinent pour un employé */}
//                     <button type="submit" className="add-button">Ajouter Employé</button>
//                 </form>
//             </section>

//             <section className="clients-list-section">
//                 <h3>Liste de Mes Employés</h3>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>ID</th>
//                             <th>Nom Employé</th>
//                             <th>Email</th>
//                             <th>Téléphone</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {employees.map(employee => (
//                             <tr key={employee.id}>
//                                 <td>{employee.id}</td>
//                                 <td>{employee.nom_client} {employee.prenom_client}</td>
//                                 <td>{employee.email}</td>
//                                 <td>{employee.telephone || '-'}</td>
//                                 <td className="actions-cell">
//                                     <button onClick={() => setEditingEmployee({ ...employee, password: '' })} className="edit-button">Éditer</button>
//                                     <button onClick={() => deleteEmployee(employee.id)} className="delete-button">Supprimer</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </section>

//             {editingEmployee && (
//                 <div className="modal-overlay">
//                     <div className="modal-content">
//                         <h3>Éditer Employé</h3>
//                         <form onSubmit={handleEditEmployeeSubmit}>
//                             <label>Nom Employé:</label><input type="text" name="nom_client" value={editingEmployee.nom_client} onChange={handleEditEmployeeChange} required />
//                             <label>Prénom Employé:</label><input type="text" name="prenom_client" value={editingEmployee.prenom_client} onChange={handleEditEmployeeChange} required />
//                             <label>Email:</label><input type="email" name="email" value={editingEmployee.email} onChange={handleEditEmployeeChange} required />
//                             <label>Mot de passe: (Laisser vide pour ne pas changer)</label><input type="password" name="password" value={editingEmployee.password} onChange={handleEditEmployeeChange} />
//                             <label>Téléphone:</label><input type="text" name="telephone" value={editingEmployee.telephone || ''} onChange={handleEditEmployeeChange} />
//                             <label>Adresse:</label><input type="text" name="adresse" value={editingEmployee.adresse || ''} onChange={handleEditEmployeeChange} />
//                             <div className="modal-buttons">
//                                 <button type="submit" className="save-button">Enregistrer</button>
//                                 <button type="button" onClick={() => setEditingEmployee(null)} className="cancel-button">Annuler</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default UserClientManagement;










// // frontend/src/components/UserClientManagement.jsx
// import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
// import './UserClientManagement.css'; // Create this CSS file

// // L'URL de base est maintenant gérée par axiosInstance, donc le chemin est relatif
// const API_BASE_URL_RELATIVE = '/admin-client';

// const UserClientManagement = () => {
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [editingClient, setEditingClient] = useState(null);
//     const [newClient, setNewClient] = useState({
//         nom_entreprise: '', nom_client: '', prenom_client: '', email: '',
//         telephone: '', adresse: '', siret: '', password: '' // Password needed for creation
//     });

//     // La fonction getToken n'est plus nécessaire car l'intercepteur d'axiosInstance gère le token
//     // const getToken = () => localStorage.getItem('userToken');

//     /**
//      * Récupère la liste des clients via l'API.
//      */
//     const fetchClients = async () => {
//         setLoading(true);
//         try {
//             // Utilise axiosInstance.get() sans ajouter manuellement le header Authorization
//             const response = await axiosInstance.get(`${API_BASE_URL_RELATIVE}/clients`);
//             setClients(response.data);
//             setError(null);
//         } catch (err) {
//             console.error('Erreur lors de la récupération des clients:', err);
//             setError(err.response?.data?.message || 'Impossible de charger les clients. Accès refusé ou erreur serveur.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     /**
//      * Ajoute un nouveau client via l'API.
//      * @param {Object} clientData Les données du client à ajouter.
//      */
//     const addClient = async (clientData) => {
//         try {
//             // Utilise axiosInstance.post() sans ajouter manuellement le header Authorization
//             const response = await axiosInstance.post(`${API_BASE_URL_RELATIVE}/clients`, clientData);
//             setClients([...clients, response.data]);
//             setNewClient({ nom_entreprise: '', nom_client: '', prenom_client: '', email: '', telephone: '', adresse: '', siret: '', password: '' });
//             setError(null);
//             alert('Client ajouté avec succès!'); // Affiche une alerte de succès
//         } catch (err) {
//             console.error('Erreur lors de l\'ajout du client:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de l\'ajout du client.');
//         }
//     };

//     /**
//      * Met à jour un client existant via l'API.
//      * @param {number} id L'ID du client à mettre à jour.
//      * @param {Object} updatedData Les données mises à jour du client.
//      */
//     const updateClient = async (id, updatedData) => {
//         try {
//             // Utilise axiosInstance.put() sans ajouter manuellement le header Authorization
//             const response = await axiosInstance.put(`${API_BASE_URL_RELATIVE}/clients/${id}`, updatedData);
//             setClients(clients.map(client => client.id === id ? response.data : client));
//             setEditingClient(null);
//             setError(null);
//             alert('Client mis à jour avec succès!'); // Affiche une alerte de succès
//         } catch (err) {
//             console.error('Erreur lors de la mise à jour du client:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de la mise à jour du client.');
//         }
//     };

//     /**
//      * Supprime un client via l'API.
//      * @param {number} id L'ID du client à supprimer.
//      */
//     const deleteClient = async (id) => {
//         if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client?')) {
//             try {
//                 // Utilise axiosInstance.delete() sans ajouter manuellement le header Authorization
//                 await axiosInstance.delete(`${API_BASE_URL_RELATIVE}/clients/${id}`);
//                 setClients(clients.filter(client => client.id !== id));
//                 setError(null);
//                 alert('Client supprimé avec succès!'); // Affiche une alerte de succès
//             } catch (err) {
//                 console.error('Erreur lors de la suppression du client:', err.response ? err.response.data : err);
//                 setError(err.response?.data?.message || 'Erreur lors de la suppression du client.');
//             }
//         }
//     };

//     // Charge les clients au montage initial du composant
//     useEffect(() => {
//         fetchClients();
//     }, []); // Le tableau vide assure que cela ne s'exécute qu'une seule fois au montage

//     // Gestionnaire de changement pour le formulaire d'ajout de nouveau client
//     const handleNewClientChange = (e) => {
//         const { name, value } = e.target;
//         setNewClient(prev => ({ ...prev, [name]: value }));
//     };

//     // Gestionnaire de changement pour le formulaire d'édition de client
//     const handleEditClientChange = (e) => {
//         const { name, value } = e.target;
//         setEditingClient(prev => ({ ...prev, [name]: value }));
//     };

//     // Gestionnaire de soumission pour le formulaire d'ajout de nouveau client
//     const handleNewClientSubmit = (e) => {
//         e.preventDefault();
//         addClient(newClient);
//     };

//     // Gestionnaire de soumission pour le formulaire d'édition de client
//     const handleEditClientSubmit = (e) => {
//         e.preventDefault();
//         updateClient(editingClient.id, editingClient);
//     };

//     // Affichage des messages de chargement et d'erreur
//     if (loading) return <div className="loading-message">Chargement des clients...</div>;
//     if (error) return <div className="error-message">{error}</div>;

//     return (
//         <div className="user-client-management-container">
//             <h2>Gérer Mes Clients</h2>

//             <section className="add-client-section">
//                 <h3>Ajouter un nouveau client</h3>
//                 <form onSubmit={handleNewClientSubmit}>
//                     <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newClient.nom_entreprise} onChange={handleNewClientChange} required />
//                     <input type="text" name="nom_client" placeholder="Nom Contact Client" value={newClient.nom_client} onChange={handleNewClientChange} required />
//                     <input type="text" name="prenom_client" placeholder="Prénom Contact Client" value={newClient.prenom_client} onChange={handleNewClientChange} required />
//                     <input type="email" name="email" placeholder="Email" value={newClient.email} onChange={handleNewClientChange} required />
//                     <input type="password" name="password" placeholder="Mot de passe (pour le client)" value={newClient.password} onChange={handleNewClientChange} required />
//                     <input type="text" name="telephone" placeholder="Téléphone" value={newClient.telephone} onChange={handleNewClientChange} />
//                     <input type="text" name="adresse" placeholder="Adresse" value={newClient.adresse} onChange={handleNewClientChange} />
//                     <input type="text" name="siret" placeholder="Siret" value={newClient.siret} onChange={handleNewClientChange} />
//                     <button type="submit" className="add-button">Ajouter Client</button>
//                 </form>
//             </section>

//             <section className="clients-list-section">
//                 <h3>Liste de Mes Clients</h3>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>ID</th>
//                             <th>Entreprise</th>
//                             <th>Contact</th>
//                             <th>Email</th>
//                             <th>Téléphone</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {clients.map(client => (
//                             <tr key={client.id}>
//                                 <td>{client.id}</td>
//                                 <td>{client.nom_entreprise}</td>
//                                 <td>{client.nom_client} {client.prenom_client}</td>
//                                 <td>{client.email}</td>
//                                 <td>{client.telephone || '-'}</td>
//                                 <td className="actions-cell">
//                                     <button onClick={() => setEditingClient({ ...client })} className="edit-button">Éditer</button>
//                                     <button onClick={() => deleteClient(client.id)} className="delete-button">Supprimer</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </section>

//             {editingClient && (
//                 <div className="modal-overlay">
//                     <div className="modal-content">
//                         <h3>Éditer Client</h3>
//                         <form onSubmit={handleEditClientSubmit}>
//                             <label>Nom Entreprise:</label><input type="text" name="nom_entreprise" value={editingClient.nom_entreprise} onChange={handleEditClientChange} required />
//                             <label>Nom Client:</label><input type="text" name="nom_client" value={editingClient.nom_client} onChange={handleEditClientChange} required />
//                             <label>Prénom Client:</label><input type="text" name="prenom_client" value={editingClient.prenom_client} onChange={handleEditClientChange} required />
//                             <label>Email:</label><input type="email" name="email" value={editingClient.email} onChange={handleEditClientChange} required />
//                             <label>Téléphone:</label><input type="text" name="telephone" value={editingClient.telephone || ''} onChange={handleEditClientChange} />
//                             <label>Adresse:</label><input type="text" name="adresse" value={editingClient.adresse || ''} onChange={handleEditClientChange} />
//                             <label>Siret:</label><input type="text" name="siret" value={editingClient.siret || ''} onChange={handleEditClientChange} />
//                             <div className="modal-buttons">
//                                 <button type="submit" className="save-button">Enregistrer</button>
//                                 <button type="button" onClick={() => setEditingClient(null)} className="cancel-button">Annuler</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default UserClientManagement;












// // frontend/src/components/UserClientManagement.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserClientManagement.css'; // Create this CSS file

// const API_BASE_URL = 'http://localhost:5001/api/admin-client';

// const UserClientManagement = () => {
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [editingClient, setEditingClient] = useState(null);
//     const [newClient, setNewClient] = useState({
//         nom_entreprise: '', nom_client: '', prenom_client: '', email: '',
//         telephone: '', adresse: '', siret: '', password: '' // Password needed for creation
//     });

//     const getToken = () => localStorage.getItem('userToken');

//     const fetchClients = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.get(`${API_BASE_URL}/clients`, {
//                 headers: { Authorization: `Bearer ${getToken()}` },
//             });
//             setClients(response.data);
//             setError(null);
//         } catch (err) {
//             console.error('Erreur lors de la récupération des clients:', err);
//             setError(err.response?.data?.message || 'Impossible de charger les clients. Accès refusé ou erreur serveur.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const addClient = async (clientData) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/clients`, clientData, {
//                 headers: { Authorization: `Bearer ${getToken()}` },
//             });
//             setClients([...clients, response.data]);
//             setNewClient({ nom_entreprise: '', nom_client: '', prenom_client: '', email: '', telephone: '', adresse: '', siret: '', password: '' });
//             setError(null);
//             alert('Client ajouté avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de l\'ajout du client:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de l\'ajout du client.');
//         }
//     };

//     const updateClient = async (id, updatedData) => {
//         try {
//             const response = await axios.put(`${API_BASE_URL}/clients/${id}`, updatedData, {
//                 headers: { Authorization: `Bearer ${getToken()}` },
//             });
//             setClients(clients.map(client => client.id === id ? response.data : client));
//             setEditingClient(null);
//             setError(null);
//             alert('Client mis à jour avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de la mise à jour du client:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de la mise à jour du client.');
//         }
//     };

//     const deleteClient = async (id) => {
//         if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client?')) {
//             try {
//                 await axios.delete(`${API_BASE_URL}/clients/${id}`, {
//                     headers: { Authorization: `Bearer ${getToken()}` },
//                 });
//                 setClients(clients.filter(client => client.id !== id));
//                 setError(null);
//                 alert('Client supprimé avec succès!');
//             } catch (err) {
//                 console.error('Erreur lors de la suppression du client:', err.response ? err.response.data : err);
//                 setError(err.response?.data?.message || 'Erreur lors de la suppression du client.');
//             }
//         }
//     };

//     useEffect(() => {
//         fetchClients();
//     }, []);

//     const handleNewClientChange = (e) => {
//         const { name, value } = e.target;
//         setNewClient(prev => ({ ...prev, [name]: value }));
//     };

//     const handleEditClientChange = (e) => {
//         const { name, value } = e.target;
//         setEditingClient(prev => ({ ...prev, [name]: value }));
//     };

//     const handleNewClientSubmit = (e) => {
//         e.preventDefault();
//         addClient(newClient);
//     };

//     const handleEditClientSubmit = (e) => {
//         e.preventDefault();
//         updateClient(editingClient.id, editingClient);
//     };

//     if (loading) return <div className="loading-message">Chargement des clients...</div>;
//     if (error) return <div className="error-message">{error}</div>;

//     return (
//         <div className="user-client-management-container">
//             <h2>Gérer Mes Clients</h2>

//             <section className="add-client-section">
//                 <h3>Ajouter un nouveau client</h3>
//                 <form onSubmit={handleNewClientSubmit}>
//                     <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newClient.nom_entreprise} onChange={handleNewClientChange} required />
//                     <input type="text" name="nom_client" placeholder="Nom Contact Client" value={newClient.nom_client} onChange={handleNewClientChange} required />
//                     <input type="text" name="prenom_client" placeholder="Prénom Contact Client" value={newClient.prenom_client} onChange={handleNewClientChange} required />
//                     <input type="email" name="email" placeholder="Email" value={newClient.email} onChange={handleNewClientChange} required />
//                     <input type="password" name="password" placeholder="Mot de passe (pour le client)" value={newClient.password} onChange={handleNewClientChange} required />
//                     <input type="text" name="telephone" placeholder="Téléphone" value={newClient.telephone} onChange={handleNewClientChange} />
//                     <input type="text" name="adresse" placeholder="Adresse" value={newClient.adresse} onChange={handleNewClientChange} />
//                     <input type="text" name="siret" placeholder="Siret" value={newClient.siret} onChange={handleNewClientChange} />
//                     <button type="submit" className="add-button">Ajouter Client</button>
//                 </form>
//             </section>

//             <section className="clients-list-section">
//                 <h3>Liste de Mes Clients</h3>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>ID</th>
//                             <th>Entreprise</th>
//                             <th>Contact</th>
//                             <th>Email</th>
//                             <th>Téléphone</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {clients.map(client => (
//                             <tr key={client.id}>
//                                 <td>{client.id}</td>
//                                 <td>{client.nom_entreprise}</td>
//                                 <td>{client.nom_client} {client.prenom_client}</td>
//                                 <td>{client.email}</td>
//                                 <td>{client.telephone || '-'}</td>
//                                 <td className="actions-cell">
//                                     <button onClick={() => setEditingClient({ ...client })} className="edit-button">Éditer</button>
//                                     <button onClick={() => deleteClient(client.id)} className="delete-button">Supprimer</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </section>

//             {editingClient && (
//                 <div className="modal-overlay">
//                     <div className="modal-content">
//                         <h3>Éditer Client</h3>
//                         <form onSubmit={handleEditClientSubmit}>
//                             <label>Nom Entreprise:</label><input type="text" name="nom_entreprise" value={editingClient.nom_entreprise} onChange={handleEditClientChange} required />
//                             <label>Nom Client:</label><input type="text" name="nom_client" value={editingClient.nom_client} onChange={handleEditClientChange} required />
//                             <label>Prénom Client:</label><input type="text" name="prenom_client" value={editingClient.prenom_client} onChange={handleEditClientChange} required />
//                             <label>Email:</label><input type="email" name="email" value={editingClient.email} onChange={handleEditClientChange} required />
//                             <label>Téléphone:</label><input type="text" name="telephone" value={editingClient.telephone || ''} onChange={handleEditClientChange} />
//                             <label>Adresse:</label><input type="text" name="adresse" value={editingClient.adresse || ''} onChange={handleEditClientChange} />
//                             <label>Siret:</label><input type="text" name="siret" value={editingClient.siret || ''} onChange={handleEditClientChange} />
//                             <div className="modal-buttons">
//                                 <button type="submit" className="save-button">Enregistrer</button>
//                                 <button type="button" onClick={() => setEditingClient(null)} className="cancel-button">Annuler</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default UserClientManagement;