import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// Composant de formulaire pour créer/modifier un utilisateur ou créer un employé
const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = 'http://localhost:5001/api/admin/users' }) => {
  const [formData, setFormData] = useState({
    nom_entreprise: initialData.nom_entreprise || '',
    nom_client: initialData.nom_client || '',
    prenom_client: initialData.prenom_client || '',
    email: initialData.email || '',
    password: '',
    telephone: initialData.telephone || '',
    adresse: initialData.adresse || '',
    siret: initialData.siret || '', // This is the company's SIRET (for admin_client role)
    role: initialData.role || 'employer',
    admin_client_siret: initialData.admin_client_siret || '' // This is the admin_client's SIRET (for employer role)
  });

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);

  // Determine if this form instance is specifically for an Admin Client creating an employee
  // This is true if initialData explicitly indicates an admin_client_siret and role 'employer'
  // and it's a creation (not an update of an existing employee).
  const isCreatingEmployeeByAdminClient = initialData.isCreatingEmployeeByAdminClient || false;

  useEffect(() => {
    // When the component is used by an Admin Client to create an employee
    if (isCreatingEmployeeByAdminClient && !isUpdate) {
      setLoadingAdminClientData(true);
      const fetchAdminClientData = async () => {
        try {
          const token = localStorage.getItem('userToken');
          if (!token) {
            setMessage('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
            return;
          }

          // Fetch current logged-in user's data (the Admin Client)
          const response = await axios.get('http://localhost:5001/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const adminClientData = response.data;

          if (adminClientData.role === 'admin_client' && adminClientData.siret) {
            setFormData(prevData => ({
              ...prevData,
              nom_entreprise: adminClientData.nom_entreprise,
              adresse: adminClientData.adresse,
              siret: '', // Employee's SIRET should be null/empty
              role: 'employer', // Force role to employer
              admin_client_siret: adminClientData.siret // Auto-fill with admin client's SIRET
            }));
          } else {
            setMessage('Erreur: Vous n\'êtes pas un Admin Client ou votre SIRET n\'est pas défini.');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
          setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
        } finally {
          setLoadingAdminClientData(false);
        }
      };
      fetchAdminClientData();
    } else if (isUpdate) {
      // For updates, populate form with initialData
      setFormData(prevData => ({
        ...prevData,
        nom_entreprise: initialData.nom_entreprise || '',
        nom_client: initialData.nom_client || '',
        prenom_client: initialData.prenom_client || '',
        email: initialData.email || '',
        telephone: initialData.telephone || '',
        adresse: initialData.adresse || '',
        siret: initialData.siret || '',
        role: initialData.role || 'employer',
        admin_client_siret: initialData.admin_client_siret || ''
      }));
    } else {
        // For standard creation by Super Admin
        setFormData(prevData => ({
          ...prevData,
          nom_entreprise: '',
          nom_client: '',
          prenom_client: '',
          email: '',
          password: '',
          telephone: '',
          adresse: '',
          siret: '',
          role: 'employer',
          admin_client_siret: ''
        }));
    }
  }, [initialData, isUpdate, isCreatingEmployeeByAdminClient]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const token = localStorage.getItem('userToken');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const dataToSend = { ...formData };

    // Clean up dataToSend based on the form's purpose
    if (isCreatingEmployeeByAdminClient) {
        // For employee creation by admin client, the backend automatically sets
        // nom_entreprise, siret (to NULL), and admin_client_siret based on the authenticated user.
        // So, we only send the employee's personal details.
        delete dataToSend.nom_entreprise;
        delete dataToSend.siret; // Employee's own SIRET should be null, backend handles this
        delete dataToSend.role; // Role is fixed to 'employer' by backend
        delete dataToSend.admin_client_siret; // Backend derives this from auth token
    } else {
        // For Super Admin creating any user (including admin_client or employer)
        // Ensure admin_client_siret is null if not an employer or not provided
        if (dataToSend.role !== 'employer') {
            dataToSend.admin_client_siret = null;
        } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
            dataToSend.admin_client_siret = null; // Ensure null if empty string
        }

        // Ensure siret is null if not an admin_client or not provided
        if (dataToSend.role !== 'admin_client') {
            dataToSend.siret = null;
        } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
            dataToSend.siret = null; // Ensure null if empty string
        }
    }


    if (isUpdate && !dataToSend.password) {
      delete dataToSend.password; // Don't send password if not changed during update
    }

    try {
      let response;
      if (isUpdate) {
        // Assuming you have an ID for update and a PUT endpoint
        // You'll need to pass initialData.id to this endpoint
        response = await axios.put(`http://localhost:5001/api/admin/users/${initialData.id}`, dataToSend, config);
      } else {
        // Use the specified API endpoint for creation
        // If isCreatingEmployeeByAdminClient is true, apiEndpointForCreation should be '/api/admin-client/employees'
        // Otherwise, it's '/api/admin/users'
        response = await axios.post(apiEndpointForCreation, dataToSend, config);
      }

      setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
      if (onUserCreated) {
        onUserCreated(response.data);
      }
      if (!isUpdate && !isCreatingEmployeeByAdminClient) { // Only clear for super admin creation
        setFormData(prevData => ({
          ...prevData,
          nom_client: '',
          prenom_client: '',
          email: '',
          password: '',
          telephone: '',
          adresse: '',
          siret: '',
          admin_client_siret: '',
          nom_entreprise: '',
          role: 'employer' // Reset to default role
        }));
      } else if (!isUpdate && isCreatingEmployeeByAdminClient) { // Clear for employee creation by admin client
        setFormData(prevData => ({
          ...prevData,
          nom_client: '',
          prenom_client: '',
          email: '',
          password: '',
          telephone: '',
          adresse: '',
          // nom_entreprise, siret, admin_client_siret remain auto-filled
        }));
      }
    } catch (error) {
      console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
      setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAdminClientData) {
    return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
  }

  return (
    <div className="user-form-container">
      <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployeeByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
      <form onSubmit={handleSubmit} className="user-form">
        {/* Nom Entreprise - ReadOnly pour la création d'employé par Admin Client */}
        <div className="form-group">
          <label htmlFor="nom_entreprise">Nom Entreprise:</label>
          <input
            type="text"
            id="nom_entreprise"
            name="nom_entreprise"
            value={formData.nom_entreprise}
            onChange={handleChange}
            required
            readOnly={isCreatingEmployeeByAdminClient}
            className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nom_client">{isCreatingEmployeeByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
          <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="prenom_client">{isCreatingEmployeeByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
          <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe: {isUpdate && <span className="optional-field">(Laisser vide pour ne pas changer)</span>}</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isUpdate} />
        </div>
        <div className="form-group">
          <label htmlFor="telephone">Téléphone:</label>
          <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="adresse">Adresse:</label>
          <input
            type="text"
            id="adresse"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            readOnly={isCreatingEmployeeByAdminClient}
            className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
          />
        </div>
        {/* SIRET field: Only editable for admin_client role, or if not creating employee by admin client */}
        {(!isCreatingEmployeeByAdminClient || formData.role === 'admin_client') && (
            <div className="form-group">
                <label htmlFor="siret">SIRET (pour Admin Client):</label>
                <input
                    type="text"
                    id="siret"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                    readOnly={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client'}
                    className={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client' ? 'read-only' : ''}
                />
            </div>
        )}

        {/* Le champ Rôle est masqué ou en lecture seule si l'Admin Client crée un employé */}
        {!isCreatingEmployeeByAdminClient && (
          <div className="form-group">
            <label htmlFor="role">Rôle:</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="super_admin">Super Admin</option>
              <option value="admin_client">Admin Client</option>
              <option value="employer">Employé</option>
            </select>
          </div>
        )}
        {/* admin_client_siret field: Displayed only if role is 'employer' and not creating employee by admin client */}
        {!isCreatingEmployeeByAdminClient && formData.role === 'employer' && (
          <div className="form-group">
            <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
            <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
          </div>
        )}
        {/* Hidden fields for employee creation by Admin Client to ensure correct role and admin_client_siret are sent */}
        {isCreatingEmployeeByAdminClient && (
            // This field displays the auto-filled admin_client_siret for visibility
            <div className="form-group">
                <label htmlFor="admin_client_siret_display">SIRET de rattachement (Automatique):</label>
                <input
                    type="text"
                    id="admin_client_siret_display"
                    value={formData.admin_client_siret}
                    readOnly
                    className="read-only"
                />
            </div>
        )}
        {isCreatingEmployeeByAdminClient && (
            // These hidden inputs ensure the correct role and admin_client_siret are conceptually part of formData
            // However, the backend will derive these from the authenticated user, so sending them is redundant
            // but harmless if the backend ignores them for this specific route.
            // Given your backend's `createEmployeeByAdminClient` logic, these are not strictly necessary to send.
            // I'll keep them as hidden for clarity if your backend *did* expect them.
            <>
                <input type="hidden" name="role" value="employer" />
                <input type="hidden" name="admin_client_siret" value={formData.admin_client_siret} />
            </>
        )}


        <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
          {isSubmitting ? 'Envoi en cours...' : (isUpdate ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
        )}
        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
};

export default UserForm;











// // frontend/src/components/UserForm.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserForm.css';

// // Ajout d'une prop apiEndpoint pour permettre de spécifier l'endpoint de création
// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = 'http://localhost:5001/api/admin/users' }) => {
//   const [formData, setFormData] = useState({
//     nom_entreprise: initialData.nom_entreprise || '',
//     nom_client: initialData.nom_client || '',
//     prenom_client: initialData.prenom_client || '',
//     email: initialData.email || '',
//     password: '',
//     telephone: initialData.telephone || '',
//     adresse: initialData.adresse || '',
//     siret: initialData.siret || '',
//     role: initialData.role || 'employer',
//     admin_client_id: initialData.admin_client_id || ''
//   });
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const isCreatingEmployeeByAdmin = initialData.admin_client_id && initialData.role === 'employer';

//   useEffect(() => {
//     if (isCreatingEmployeeByAdmin) {
//       setFormData(prevData => ({
//         ...prevData,
//         nom_entreprise: initialData.nom_entreprise || '',
//         adresse: initialData.adresse || '',
//         siret: initialData.siret || '',
//         role: 'employer',
//         admin_client_id: initialData.admin_client_id || ''
//       }));
//     } else if (isUpdate) {
//         setFormData(prevData => ({
//             ...prevData,
//             nom_entreprise: initialData.nom_entreprise || '',
//             nom_client: initialData.nom_client || '',
//             prenom_client: initialData.prenom_client || '',
//             email: initialData.email || '',
//             telephone: initialData.telephone || '',
//             adresse: initialData.adresse || '',
//             siret: initialData.siret || '',
//             role: initialData.role || 'employer',
//             admin_client_id: initialData.admin_client_id || ''
//         }));
//     }
//   }, [initialData, isUpdate, isCreatingEmployeeByAdmin]);


//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setIsSubmitting(true);

//     const token = localStorage.getItem('userToken');
//     const config = {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       }
//     };

//     const dataToSend = { ...formData };
//     dataToSend.admin_client_id = dataToSend.admin_client_id ? parseInt(dataToSend.admin_client_id) : null;

//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password;
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         setMessage('La modification d\'utilisateur n\'est pas encore implémentée.');
//         setIsSubmitting(false);
//         return;
//       } else {
//         // Utilise la nouvelle prop apiEndpointForCreation
//         response = await axios.post(apiEndpointForCreation, dataToSend, config);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       if (!isUpdate) {
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           // nom_entreprise, adresse, siret, role, admin_client_id restent les mêmes si isCreatingEmployeeByAdmin
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployeeByAdmin}
//             className={isCreatingEmployeeByAdmin ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">Nom Employé:</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">Prénom Employé:</label>
//           <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="email">Email:</label>
//           <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe: {isUpdate && <span className="optional-field">(Laisser vide pour ne pas changer)</span>}</label>
//           <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isUpdate} />
//         </div>
//         <div className="form-group">
//           <label htmlFor="telephone">Téléphone:</label>
//           <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
//         </div>
//         <div className="form-group">
//           <label htmlFor="adresse">Adresse:</label>
//           <input
//             type="text"
//             id="adresse"
//             name="adresse"
//             value={formData.adresse}
//             onChange={handleChange}
//             readOnly={isCreatingEmployeeByAdmin}
//             className={isCreatingEmployeeByAdmin ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="siret">SIRET:</label>
//           <input
//             type="text"
//             id="siret"
//             name="siret"
//             value={formData.siret}
//             onChange={handleChange}
//             readOnly={isCreatingEmployeeByAdmin}
//             className={isCreatingEmployeeByAdmin ? 'read-only' : ''}
//           />
//         </div>
//         {/* Le champ Rôle est masqué ou en lecture seule si l'Admin Client crée un employé */}
//         {!isCreatingEmployeeByAdmin && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* Le champ admin_client_id est masqué si l'Admin Client crée un employé */}
//         {!isCreatingEmployeeByAdmin && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_id">ID Admin Client (pour les employés):</label>
//             <input type="number" id="admin_client_id" name="admin_client_id" value={formData.admin_client_id} onChange={handleChange} />
//           </div>
//         )}
//         {isCreatingEmployeeByAdmin && (
//             <input type="hidden" name="role" value="employer" />
//         )}
//         {isCreatingEmployeeByAdmin && (
//             <input type="hidden" name="admin_client_id" value={formData.admin_client_id} />
//         )}

//         <button type="submit" disabled={isSubmitting}>
//           {isSubmitting ? 'Envoi en cours...' : (isUpdate ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur')}
//         </button>
//         {onCancel && (
//           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
//         )}
//         {message && <p className="form-message">{message}</p>}
//       </form>
//     </div>
//   );
// };

// export default UserForm;









// // // frontend/src/components/UserForm.jsx
// // import React, { useState } from 'react';
// // import axios from 'axios';
// // import './UserForm.css'; // Assurez-vous de créer ce fichier CSS

// // const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false }) => {
// //   const [formData, setFormData] = useState({
// //     nom_entreprise: initialData.nom_entreprise || '',
// //     nom_client: initialData.nom_client || '',
// //     prenom_client: initialData.prenom_client || '',
// //     email: initialData.email || '',
// //     password: '', // Le mot de passe n'est jamais pré-rempli pour la sécurité
// //     telephone: initialData.telephone || '',
// //     adresse: initialData.adresse || '',
// //     siret: initialData.siret || '',
// //     role: initialData.role || 'employer', // Valeur par défaut 'employer'
// //     admin_client_id: initialData.admin_client_id || '' // Peut être vide pour super_admin/admin_client
// //   });
// //   const [message, setMessage] = useState('');
// //   const [isSubmitting, setIsSubmitting] = useState(false);

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData(prevData => ({
// //       ...prevData,
// //       [name]: value
// //     }));
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setMessage('');
// //     setIsSubmitting(true);

// //     const token = localStorage.getItem('userToken');
// //     const config = {
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Authorization': `Bearer ${token}`
// //       }
// //     };

// //     // Préparer les données pour l'envoi
// //     const dataToSend = { ...formData };
// //     // Convertir admin_client_id en nombre ou null
// //     dataToSend.admin_client_id = dataToSend.admin_client_id ? parseInt(dataToSend.admin_client_id) : null;

// //     // Supprimer le champ password si c'est une mise à jour et qu'il n'est pas modifié
// //     if (isUpdate && !dataToSend.password) {
// //       delete dataToSend.password;
// //     }

// //     try {
// //       let response;
// //       if (isUpdate) {
// //         // TODO: Implémenter la logique de mise à jour (nécessitera un endpoint PUT et l'ID de l'utilisateur)
// //         // response = await axios.put(`http://localhost:5001/api/admin/users/${initialData.id}`, dataToSend, config);
// //         setMessage('La modification d\'utilisateur n\'est pas encore implémentée.');
// //         setIsSubmitting(false);
// //         return;
// //       } else {
// //         response = await axios.post('http://localhost:5001/api/admin/users', dataToSend, config);
// //       }

// //       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
// //       if (onUserCreated) {
// //         onUserCreated(response.data); // Appelle la fonction de rappel pour rafraîchir la liste
// //       }
// //       // Réinitialiser le formulaire si c'est une création
// //       if (!isUpdate) {
// //         setFormData({
// //           nom_entreprise: '',
// //           nom_client: '',
// //           prenom_client: '',
// //           email: '',
// //           password: '',
// //           telephone: '',
// //           adresse: '',
// //           siret: '',
// //           role: 'employer',
// //           admin_client_id: ''
// //         });
// //       }
// //     } catch (error) {
// //       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
// //       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div className="user-form-container">
// //       <h3>{isUpdate ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}</h3>
// //       <form onSubmit={handleSubmit} className="user-form">
// //         <div className="form-group">
// //           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
// //           <input type="text" id="nom_entreprise" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="nom_client">Nom Client:</label>
// //           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="prenom_client">Prénom Client:</label>
// //           <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} required />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="email">Email:</label>
// //           <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="password">Mot de passe: {isUpdate && <span className="optional-field">(Laisser vide pour ne pas changer)</span>}</label>
// //           <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isUpdate} />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="telephone">Téléphone:</label>
// //           <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="adresse">Adresse:</label>
// //           <input type="text" id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="siret">SIRET:</label>
// //           <input type="text" id="siret" name="siret" value={formData.siret} onChange={handleChange} />
// //         </div>
// //         <div className="form-group">
// //           <label htmlFor="role">Rôle:</label>
// //           <select id="role" name="role" value={formData.role} onChange={handleChange} required>
// //             <option value="super_admin">Super Admin</option>
// //             <option value="admin_client">Admin Client</option>
// //             <option value="employer">Employé</option>
// //           </select>
// //         </div>
// //         {formData.role === 'employer' && (
// //           <div className="form-group">
// //             <label htmlFor="admin_client_id">ID Admin Client (pour les employés):</label>
// //             <input type="number" id="admin_client_id" name="admin_client_id" value={formData.admin_client_id} onChange={handleChange} />
// //           </div>
// //         )}
// //         <button type="submit" disabled={isSubmitting}>
// //           {isSubmitting ? 'Envoi en cours...' : (isUpdate ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur')}
// //         </button>
// //         {onCancel && (
// //           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
// //         )}
// //         {message && <p className="form-message">{message}</p>}
// //       </form>
// //     </div>
// //   );
// // };

// // export default UserForm;
