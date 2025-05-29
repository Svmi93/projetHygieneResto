// frontend/src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './UserManagement.css';

const API_BASE_URL_ADMIN = '/admin/users'; // Chemin relatif pour les routes admin

const UserManagement = () => {
    // Déclaration des états pour la gestion des utilisateurs, du chargement, des erreurs, etc.
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null); // Utilisateur en cours d'édition
    const [newUser, setNewUser] = useState({ // Nouvel utilisateur à ajouter
        username: '',
        email: '',
        password: '', // Temporaire pour la création, non pour l'édition
        role: 'client', // Valeur par défaut
        nom_entreprise: '',
        nom_client: '',
        prenom_client: '',
        telephone: '',
        adresse: '',
        siret: ''
    });

    // La fonction getToken() n'est plus nécessaire ici car axiosInstance gère l'ajout du token
    // const getToken = () => localStorage.getItem('userToken');

    // --- Fonctions API pour les utilisateurs ---

    /**
     * Récupère tous les utilisateurs depuis l'API.
     * Cette fonction est appelée au chargement initial du composant.
     */
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Utilise axiosInstance.get() sans avoir à ajouter manuellement le header Authorization
            const response = await axiosInstance.get(API_BASE_URL_ADMIN);
            setUsers(response.data);
            setError(null); // Réinitialise l'erreur en cas de succès
        } catch (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            // Affiche un message d'erreur plus convivial
            setError(err.response?.data?.message || 'Impossible de charger les utilisateurs. Accès refusé ou erreur serveur.');
        } finally {
            setLoading(false); // Termine l'état de chargement
        }
    };

    /**
     * Ajoute un nouvel utilisateur via l'API.
     * @param {Object} userData Les données du nouvel utilisateur à ajouter.
     */
    const addUser = async (userData) => {
        try {
            // Vérifie si le mot de passe est fourni pour l'ajout
            if (!userData.password) {
                setError('Le mot de passe est obligatoire pour l\'ajout d\'un utilisateur.');
                return;
            }
            // Utilise axiosInstance.post() sans avoir à ajouter manuellement le header Authorization
            const response = await axiosInstance.post(API_BASE_URL_ADMIN, userData);
            setUsers([...users, response.data]); // Ajoute le nouvel utilisateur à la liste locale
            // Réinitialise le formulaire d'ajout après succès
            setNewUser({
                username: '', email: '', password: '', role: 'client',
                nom_entreprise: '', nom_client: '', prenom_client: '',
                telephone: '', adresse: '', siret: ''
            });
            setError(null); // Réinitialise l'erreur
            alert('Utilisateur ajouté avec succès!'); // Affiche une alerte de succès
        } catch (err) {
            console.error('Erreur lors de l\'ajout de l\'utilisateur:', err.response ? err.response.data : err);
            // Affiche un message d'erreur plus convivial
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur.');
        }
    };

    /**
     * Met à jour un utilisateur existant via l'API.
     * @param {number} id L'ID de l'utilisateur à mettre à jour.
     * @param {Object} updatedData Les données mises à jour de l'utilisateur.
     */
    const updateUser = async (id, updatedData) => {
        try {
            // Utilise axiosInstance.put() sans avoir à ajouter manuellement le header Authorization
            const response = await axiosInstance.put(`${API_BASE_URL_ADMIN}/${id}`, updatedData);
            // Met à jour l'utilisateur dans la liste existante des utilisateurs
            setUsers(users.map(user => user.id === id ? response.data : user));
            setEditingUser(null); // Quitte le mode édition
            setError(null); // Réinitialise l'erreur
            alert('Utilisateur mis à jour avec succès!'); // Affiche une alerte de succès
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', err.response ? err.response.data : err);
            // Affiche un message d'erreur plus convivial
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur.');
        }
    };

    /**
     * Supprime un utilisateur via l'API.
     * @param {number} id L'ID de l'utilisateur à supprimer.
     */
    const deleteUser = async (id) => {
        // Demande confirmation avant de supprimer
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
            try {
                // Utilise axiosInstance.delete() sans avoir à ajouter manuellement le header Authorization
                await axiosInstance.delete(`${API_BASE_URL_ADMIN}/${id}`);
                // Retire l'utilisateur de la liste locale après suppression réussie
                setUsers(users.filter(user => user.id !== id));
                setError(null); // Réinitialise l'erreur
                alert('Utilisateur supprimé avec succès!'); // Affiche une alerte de succès
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'utilisateur:', err.response ? err.response.data : err);
                // Affiche un message d'erreur plus convivial
                setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
            }
        }
    };

    // Charger les utilisateurs au montage initial du composant
    useEffect(() => {
        fetchUsers();
    }, []); // Le tableau vide assure que cela ne s'exécute qu'une seule fois au montage

    // Gestionnaire de changement pour le formulaire d'ajout de nouvel utilisateur
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    // Gestionnaire de changement pour le formulaire d'édition d'utilisateur
    const handleEditUserChange = (e) => {
        const { name, value } = e.target;
        setEditingUser(prev => ({ ...prev, [name]: value }));
    };

    // Gestionnaire de soumission pour le formulaire d'ajout de nouvel utilisateur
    const handleNewUserSubmit = (e) => {
        e.preventDefault();
        addUser(newUser);
    };

    // Gestionnaire de soumission pour le formulaire d'édition d'utilisateur
    const handleEditUserSubmit = (e) => {
        e.preventDefault();
        updateUser(editingUser.id, editingUser);
    };

    // Affichage du message de chargement
    if (loading) return <div className="loading-message">Chargement des utilisateurs...</div>;
    // Affichage du message d'erreur
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="user-management-container">
            <h2>Gestion des Utilisateurs</h2>

            {/* Formulaire d'ajout d'utilisateur */}
            <section className="add-user-section">
                <h3>Ajouter un nouvel utilisateur</h3>
                <form onSubmit={handleNewUserSubmit}>
                    <div className="form-row">
                        <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newUser.nom_entreprise} onChange={handleNewUserChange} required />
                        <input type="text" name="nom_client" placeholder="Nom Client" value={newUser.nom_client} onChange={handleNewUserChange} required />
                        <input type="text" name="prenom_client" placeholder="Prénom Client" value={newUser.prenom_client} onChange={handleNewUserChange} required />
                    </div>
                    <div className="form-row">
                        <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleNewUserChange} required />
                        <input type="password" name="password" placeholder="Mot de passe" value={newUser.password} onChange={handleNewUserChange} required />
                        <input type="text" name="telephone" placeholder="Téléphone" value={newUser.telephone} onChange={handleNewUserChange} />
                    </div>
                    <div className="form-row">
                        <input type="text" name="adresse" placeholder="Adresse" value={newUser.adresse} onChange={handleNewUserChange} />
                        <input type="text" name="siret" placeholder="Siret" value={newUser.siret} onChange={handleNewUserChange} />
                        <select name="role" value={newUser.role} onChange={handleNewUserChange}>
                            <option value="client">Client</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                    <button type="submit" className="add-button">Ajouter Utilisateur</button>
                </form>
            </section>

            {/* Liste des utilisateurs */}
            <section className="users-list-section">
                <h3>Liste des Utilisateurs</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom Entreprise</th>
                            <th>Nom Client</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Rôle</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.nom_entreprise}</td>
                                <td>{user.nom_client} {user.prenom_client}</td>
                                <td>{user.email}</td>
                                <td>{user.telephone || '-'}</td>
                                <td>{user.role}</td>
                                <td className="actions-cell">
                                    <button onClick={() => setEditingUser({ ...user, password: '' })} className="edit-button">Éditer</button>
                                    <button onClick={() => deleteUser(user.id)} className="delete-button">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Modale d'édition d'utilisateur */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Éditer Utilisateur</h3>
                        <form onSubmit={handleEditUserSubmit}>
                            <div className="form-group">
                                <label>Nom Entreprise:</label>
                                <input type="text" name="nom_entreprise" value={editingUser.nom_entreprise} onChange={handleEditUserChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nom Client:</label>
                                <input type="text" name="nom_client" value={editingUser.nom_client} onChange={handleEditUserChange} required />
                            </div>
                            <div className="form-group">
                                <label>Prénom Client:</label>
                                <input type="text" name="prenom_client" value={editingUser.prenom_client} onChange={handleEditUserChange} required />
                            </div>
                            <div className="form-group">
                                <label>Email:</label>
                                <input type="email" name="email" value={editingUser.email} onChange={handleEditUserChange} required />
                            </div>
                             <div className="form-group">
                                <label>Téléphone:</label>
                                <input type="text" name="telephone" value={editingUser.telephone || ''} onChange={handleEditUserChange} />
                            </div>
                            <div className="form-group">
                                <label>Adresse:</label>
                                <input type="text" name="adresse" value={editingUser.adresse || ''} onChange={handleEditUserChange} />
                            </div>
                            <div className="form-group">
                                <label>Siret:</label>
                                <input type="text" name="siret" value={editingUser.siret || ''} onChange={handleEditUserChange} />
                            </div>
                            {/* Le mot de passe n'est pas édité directement ici pour la sécurité */}
                            {/* Pour changer le mot de passe, il faudrait un champ séparé et un appel API dédié */}
                            <div className="form-group">
                                <label>Rôle:</label>
                                <select name="role" value={editingUser.role} onChange={handleEditUserChange}>
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="modal-buttons">
                                <button type="submit" className="save-button">Enregistrer les modifications</button>
                                <button type="button" onClick={() => setEditingUser(null)} className="cancel-button">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

















// // frontend/src/components/UserManagement.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserManagement.css'; // Crée ce fichier CSS

// const API_BASE_URL = 'http://localhost:5001/api';

// const UserManagement = () => {
//     const [users, setUsers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [editingUser, setEditingUser] = useState(null); // Utilisateur en cours d'édition
//     const [newUser, setNewUser] = useState({ // Nouvel utilisateur à ajouter
//         username: '',
//         email: '',
//         password: '', // Temporaire pour la création, non pour l'édition
//         role: 'client', // Valeur par défaut
//         nom_entreprise: '',
//         nom_client: '',
//         prenom_client: '',
//         telephone: '',
//         adresse: '',
//         siret: ''
//     });

//     // Fonction pour récupérer le token de l'utilisateur connecté
//     const getToken = () => localStorage.getItem('userToken');

//     // --- Fonctions API pour les utilisateurs ---

//     const fetchUsers = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.get(`${API_BASE_URL}/admin/users`, {
//                 headers: {
//                     Authorization: `Bearer ${getToken()}`,
//                 },
//             });
//             setUsers(response.data);
//             setError(null);
//         } catch (err) {
//             console.error('Erreur lors de la récupération des utilisateurs:', err);
//             setError('Impossible de charger les utilisateurs. Accès refusé ou erreur serveur.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const addUser = async (userData) => {
//         try {
//             // Pour l'ajout, le mot de passe est obligatoire
//             if (!userData.password) {
//                 setError('Le mot de passe est obligatoire pour l\'ajout d\'un utilisateur.');
//                 return;
//             }
//             const response = await axios.post(`${API_BASE_URL}/admin/users`, userData, {
//                 headers: {
//                     Authorization: `Bearer ${getToken()}`,
//                 },
//             });
//             setUsers([...users, response.data]); // Ajoute le nouvel utilisateur à la liste
//             setNewUser({ // Réinitialise le formulaire d'ajout
//                 username: '', email: '', password: '', role: 'client',
//                 nom_entreprise: '', nom_client: '', prenom_client: '',
//                 telephone: '', adresse: '', siret: ''
//             });
//             setError(null);
//             alert('Utilisateur ajouté avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de l\'ajout de l\'utilisateur:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur.');
//         }
//     };

//     const updateUser = async (id, updatedData) => {
//         try {
//             const response = await axios.put(`${API_BASE_URL}/admin/users/${id}`, updatedData, {
//                 headers: {
//                     Authorization: `Bearer ${getToken()}`,
//                 },
//             });
//             // Met à jour l'utilisateur dans la liste existante
//             setUsers(users.map(user => user.id === id ? response.data : user));
//             setEditingUser(null); // Quitte le mode édition
//             setError(null);
//             alert('Utilisateur mis à jour avec succès!');
//         } catch (err) {
//             console.error('Erreur lors de la mise à jour de l\'utilisateur:', err.response ? err.response.data : err);
//             setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur.');
//         }
//     };

//     const deleteUser = async (id) => {
//         if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
//             try {
//                 await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
//                     headers: {
//                         Authorization: `Bearer ${getToken()}`,
//                     },
//                 });
//                 setUsers(users.filter(user => user.id !== id)); // Retire l'utilisateur de la liste
//                 setError(null);
//                 alert('Utilisateur supprimé avec succès!');
//             } catch (err) {
//                 console.error('Erreur lors de la suppression de l\'utilisateur:', err.response ? err.response.data : err);
//                 setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
//             }
//         }
//     };

//     // Charger les utilisateurs au montage du composant
//     useEffect(() => {
//         fetchUsers();
//     }, []);

//     // Gestionnaires de changement de formulaire
//     const handleNewUserChange = (e) => {
//         const { name, value } = e.target;
//         setNewUser(prev => ({ ...prev, [name]: value }));
//     };

//     const handleEditUserChange = (e) => {
//         const { name, value } = e.target;
//         setEditingUser(prev => ({ ...prev, [name]: value }));
//     };

//     const handleNewUserSubmit = (e) => {
//         e.preventDefault();
//         addUser(newUser);
//     };

//     const handleEditUserSubmit = (e) => {
//         e.preventDefault();
//         updateUser(editingUser.id, editingUser);
//     };

//     if (loading) return <div className="loading-message">Chargement des utilisateurs...</div>;
//     if (error) return <div className="error-message">{error}</div>;

//     return (
//         <div className="user-management-container">
//             <h2>Gestion des Utilisateurs</h2>

//             {/* Formulaire d'ajout d'utilisateur */}
//             <section className="add-user-section">
//                 <h3>Ajouter un nouvel utilisateur</h3>
//                 <form onSubmit={handleNewUserSubmit}>
//                     <div className="form-row">
//                         <input type="text" name="nom_entreprise" placeholder="Nom Entreprise" value={newUser.nom_entreprise} onChange={handleNewUserChange} required />
//                         <input type="text" name="nom_client" placeholder="Nom Client" value={newUser.nom_client} onChange={handleNewUserChange} required />
//                         <input type="text" name="prenom_client" placeholder="Prénom Client" value={newUser.prenom_client} onChange={handleNewUserChange} required />
//                     </div>
//                     <div className="form-row">
//                         <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleNewUserChange} required />
//                         <input type="password" name="password" placeholder="Mot de passe" value={newUser.password} onChange={handleNewUserChange} required />
//                         <input type="text" name="telephone" placeholder="Téléphone" value={newUser.telephone} onChange={handleNewUserChange} />
//                     </div>
//                     <div className="form-row">
//                         <input type="text" name="adresse" placeholder="Adresse" value={newUser.adresse} onChange={handleNewUserChange} />
//                         <input type="text" name="siret" placeholder="Siret" value={newUser.siret} onChange={handleNewUserChange} />
//                         <select name="role" value={newUser.role} onChange={handleNewUserChange}>
//                             <option value="client">Client</option>
//                             <option value="admin">Admin</option>
//                             <option value="super_admin">Super Admin</option>
//                         </select>
//                     </div>
//                     <button type="submit" className="add-button">Ajouter Utilisateur</button>
//                 </form>
//             </section>

//             {/* Liste des utilisateurs */}
//             <section className="users-list-section">
//                 <h3>Liste des Utilisateurs</h3>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>ID</th>
//                             <th>Nom Entreprise</th>
//                             <th>Nom Client</th>
//                             <th>Email</th>
//                             <th>Téléphone</th>
//                             <th>Rôle</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {users.map(user => (
//                             <tr key={user.id}>
//                                 <td>{user.id}</td>
//                                 <td>{user.nom_entreprise}</td>
//                                 <td>{user.nom_client} {user.prenom_client}</td>
//                                 <td>{user.email}</td>
//                                 <td>{user.telephone || '-'}</td>
//                                 <td>{user.role}</td>
//                                 <td className="actions-cell">
//                                     <button onClick={() => setEditingUser({ ...user, password: '' })} className="edit-button">Éditer</button>
//                                     <button onClick={() => deleteUser(user.id)} className="delete-button">Supprimer</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </section>

//             {/* Modale d'édition d'utilisateur */}
//             {editingUser && (
//                 <div className="modal-overlay">
//                     <div className="modal-content">
//                         <h3>Éditer Utilisateur</h3>
//                         <form onSubmit={handleEditUserSubmit}>
//                             <div className="form-group">
//                                 <label>Nom Entreprise:</label>
//                                 <input type="text" name="nom_entreprise" value={editingUser.nom_entreprise} onChange={handleEditUserChange} required />
//                             </div>
//                             <div className="form-group">
//                                 <label>Nom Client:</label>
//                                 <input type="text" name="nom_client" value={editingUser.nom_client} onChange={handleEditUserChange} required />
//                             </div>
//                             <div className="form-group">
//                                 <label>Prénom Client:</label>
//                                 <input type="text" name="prenom_client" value={editingUser.prenom_client} onChange={handleEditUserChange} required />
//                             </div>
//                             <div className="form-group">
//                                 <label>Email:</label>
//                                 <input type="email" name="email" value={editingUser.email} onChange={handleEditUserChange} required />
//                             </div>
//                              <div className="form-group">
//                                 <label>Téléphone:</label>
//                                 <input type="text" name="telephone" value={editingUser.telephone || ''} onChange={handleEditUserChange} />
//                             </div>
//                             <div className="form-group">
//                                 <label>Adresse:</label>
//                                 <input type="text" name="adresse" value={editingUser.adresse || ''} onChange={handleEditUserChange} />
//                             </div>
//                             <div className="form-group">
//                                 <label>Siret:</label>
//                                 <input type="text" name="siret" value={editingUser.siret || ''} onChange={handleEditUserChange} />
//                             </div>
//                             {/* Le mot de passe n'est pas édité directement ici pour la sécurité */}
//                             {/* Pour changer le mot de passe, il faudrait un champ séparé et un appel API dédié */}
//                             <div className="form-group">
//                                 <label>Rôle:</label>
//                                 <select name="role" value={editingUser.role} onChange={handleEditUserChange}>
//                                     <option value="client">Client</option>
//                                     <option value="admin">Admin</option>
//                                     <option value="super_admin">Super Admin</option>
//                                 </select>
//                             </div>
//                             <div className="modal-buttons">
//                                 <button type="submit" className="save-button">Enregistrer les modifications</button>
//                                 <button type="button" onClick={() => setEditingUser(null)} className="cancel-button">Annuler</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default UserManagement;