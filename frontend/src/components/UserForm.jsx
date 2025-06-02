// frontend/src/components/UserForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// Helper function to create initial form state based on initialData
const createInitialFormData = (data, isCreatingEmployer, isRegisteringAdminClient) => {
  const baseData = {
    nom_entreprise: data.nom_entreprise || '',
    nom_client: data.nom_client || '',
    prenom_client: data.prenom_client || '',
    email: data.email || '',
    password: '', // Password is never pre-filled for security
    telephone: data.telephone || '',
    adresse: data.adresse || '',
    siret: data.siret || '', // SIRET peut être fourni ou non
    admin_client_siret: data.admin_client_siret || '' // admin_client_siret peut être fourni ou non
  };

  if (isCreatingEmployer) {
    // Mode: Admin Client crée un Employé
    return {
      ...baseData,
      // Ces champs seront pré-remplis par le useEffect ou ignorés par le backend
      nom_entreprise: data.nom_entreprise || '',
      adresse: data.adresse || '',
      siret: '', // L'employé n'a pas de SIRET propre
      role: 'employer', // Rôle forcé à 'employer'
      admin_client_siret: data.admin_client_siret || ''
    };
  } else if (isRegisteringAdminClient) {
    // Mode: Enregistrement d'un nouvel Admin Client
    return {
      ...baseData,
      role: 'admin_client', // Rôle forcé à 'admin_client'
      admin_client_siret: '' // Pas de admin_client_siret pour un admin_client
    };
  } else {
    // Mode: Super Admin crée/met à jour n'importe quel type d'utilisateur
    return {
      ...baseData,
      role: data.role || 'employer' // Rôle par défaut 'employer' si non spécifié
    };
  }
};


const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = '/admin/users', isRegisteringAdminClient = false }) => {

  const isCreatingEmployerByAdminClient = initialData.isCreatingEmployerByAdminClient || false;

  const [formData, setFormData] = useState(() => createInitialFormData(initialData, isCreatingEmployerByAdminClient, isRegisteringAdminClient));

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);


  // Effect to re-populate form data for updates or to clear for new general creations.
  useEffect(() => {
    if (isUpdate && initialData.id) {
      setFormData(createInitialFormData(initialData, false, false));
    } else if (!isUpdate && !isCreatingEmployerByAdminClient && !isRegisteringAdminClient) {
      setFormData(createInitialFormData({}, false, false));
    } else if (!isUpdate && isCreatingEmployerByAdminClient) {
      setFormData(createInitialFormData({
          nom_client: initialData.nom_client || '',
          prenom_client: initialData.prenom_client || '',
          email: initialData.email || '',
          telephone: initialData.telephone || '',
      }, true, false));
    } else if (!isUpdate && isRegisteringAdminClient) {
      setFormData(createInitialFormData({
          nom_client: initialData.nom_client || '',
          prenom_client: initialData.prenom_client || '',
          email: initialData.email || '',
          telephone: initialData.telephone || '',
          siret: initialData.siret || '', // SIRET est requis pour l'enregistrement d'Admin Client
          nom_entreprise: initialData.nom_entreprise || '',
          adresse: initialData.adresse || ''
      }, false, true));
    }
  }, [initialData.id, isUpdate, isCreatingEmployerByAdminClient, isRegisteringAdminClient]);


  // Effect specifically for fetching Admin Client data when creating an employee.
  useEffect(() => {
    if (isCreatingEmployerByAdminClient && !isUpdate) {
      setLoadingAdminClientData(true);
      const fetchAdminClientData = async () => {
        try {
          const response = await axiosInstance.get('/users/profile');
          const adminClientData = response.data;

          if (adminClientData.nom_entreprise && adminClientData.siret) {
            setFormData(prevData => ({
              ...prevData,
              nom_entreprise: adminClientData.nom_entreprise,
              adresse: adminClientData.adresse,
              siret: '', // L'employé n'a pas de SIRET propre
              role: 'employer', // Rôle forcé à 'employer'
              admin_client_siret: adminClientData.siret
            }));
          } else {
            setMessage('Erreur: Les informations de l\'Admin Client (nom d\'entreprise ou SIRET) sont manquantes.');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
          setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
        } finally {
          setLoadingAdminClientData(false);
        }
      };
      fetchAdminClientData();
    }
  }, [isCreatingEmployerByAdminClient, isUpdate]);

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

    const dataToSend = { ...formData };

    // Nettoyer dataToSend en fonction du but du formulaire
    if (isCreatingEmployerByAdminClient) {
        // Pour la création d'employé par un admin client, le backend gère automatiquement
        // nom_entreprise, siret (à NULL), et admin_client_siret basé sur l'utilisateur authentifié.
        // Nous n'envoyons donc que les détails personnels de l'employé.
        delete dataToSend.nom_entreprise;
        delete dataToSend.siret;
        delete dataToSend.role;
        delete dataToSend.admin_client_siret;
    } else if (isRegisteringAdminClient) {
        // Pour l'enregistrement d'un Admin Client, forcer le rôle et s'assurer que siret est présent
        dataToSend.role = 'admin_client';
        dataToSend.admin_client_siret = null; // Un admin_client n'a pas de admin_client_siret
        if (!dataToSend.siret || dataToSend.siret.length !== 14) {
            setMessage('Le SIRET est obligatoire et doit contenir 14 chiffres pour un Admin Client.');
            setIsSubmitting(false);
            return;
        }
    } else {
        // Pour Super Admin créant n'importe quel utilisateur
        if (dataToSend.role !== 'employer') {
            dataToSend.admin_client_siret = null;
        } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
            dataToSend.admin_client_siret = null;
        }

        if (dataToSend.role !== 'admin_client') {
            dataToSend.siret = null;
        } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
            dataToSend.siret = null;
        }
    }

    if (isUpdate && !dataToSend.password) {
      delete dataToSend.password;
    }
    // Si le mot de passe est vide pour une création, retourner une erreur
    if (!isUpdate && !dataToSend.password) {
        setMessage('Le mot de passe est obligatoire pour la création.');
        setIsSubmitting(false);
        return;
    }


    try {
      let response;
      if (isUpdate) {
        response = await axiosInstance.put(`/admin/users/${initialData.id}`, dataToSend);
      } else {
        // Utilise l'endpoint passé par la prop, qui sera /auth/register pour le nouvel Admin Client
        response = await axiosInstance.post(apiEndpointForCreation, dataToSend);
      }

      setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
      if (onUserCreated) {
        onUserCreated(response.data);
      }
      // Vider le formulaire après succès
      setFormData(createInitialFormData(
        isCreatingEmployerByAdminClient ? { nom_entreprise: formData.nom_entreprise, adresse: formData.adresse, admin_client_siret: formData.admin_client_siret } : {},
        isCreatingEmployerByAdminClient,
        isRegisteringAdminClient
      ));
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
      <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployerByAdminClient ? 'Créer un nouvel employé' : (isRegisteringAdminClient ? 'Enregistrer un nouvel Admin Client' : 'Créer un nouvel utilisateur'))}</h3>
      <form onSubmit={handleSubmit} className="user-form">
        {/* Nom Entreprise - Auto-rempli et ReadOnly pour la création d'employé par Admin Client, ou éditable pour Super Admin/Nouvel Admin Client */}
        <div className="form-group">
          <label htmlFor="nom_entreprise">Nom Entreprise:</label>
          <input
            type="text"
            id="nom_entreprise"
            name="nom_entreprise"
            value={formData.nom_entreprise}
            onChange={handleChange}
            placeholder="SARL RESTAURENT"
            required
            readOnly={isCreatingEmployerByAdminClient}
            className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nom_client">{isCreatingEmployerByAdminClient ? 'Nom Employé:' : 'Nom Contact:'}</label>
          <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} placeholder="DURANT" required />
        </div>
        <div className="form-group">
          <label htmlFor="prenom_client">{isCreatingEmployerByAdminClient ? 'Prénom Employé:' : 'Prénom Contact:'}</label>
          <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} placeholder="ALEXANDRE" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="votre.email@exemple.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe: {isUpdate && <span className="optional-field">(Laisser vide pour ne pas changer)</span>}</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Votre mot de passe secret"
 required={!isUpdate} />
        </div>
        <div className="form-group">
          <label htmlFor="telephone">Téléphone:</label>
          <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="07XXXXXXXX"
 />
        </div>
        <div className="form-group">
          <label htmlFor="adresse">Adresse:</label>
          <input
            type="text"
            id="adresse"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            placeholder="123 rue de la republique 75010 paris "
            readOnly={isCreatingEmployerByAdminClient}
            className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
          />
        </div>
        {/* SIRET field:
            - Visible et requis si isRegisteringAdminClient est true.
            - Caché si l'Admin Client est en train de créer un employé.
            - Sinon (pour Super Admin), visible et modifiable uniquement si le rôle est 'admin_client'.
        */}
        {(isRegisteringAdminClient || (!isCreatingEmployerByAdminClient && formData.role === 'admin_client')) && (
            <div className="form-group">
                <label htmlFor="siret">SIRET (pour Admin Client):</label>
                <input
                    type="text"
                    id="siret"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                    placeholder="55217863900132"

                    required={isRegisteringAdminClient || formData.role === 'admin_client'}
                    readOnly={isCreatingEmployerByAdminClient || (formData.role !== 'admin_client' && !isRegisteringAdminClient)} // ReadOnly si pas admin_client et pas en mode enregistrement
                    className={(isCreatingEmployerByAdminClient || (formData.role !== 'admin_client' && !isRegisteringAdminClient)) ? 'read-only' : ''}
                />
            </div>
        )}

        {/* Le champ Rôle est masqué si l'Admin Client crée un employé ou si c'est un enregistrement Admin Client */}
        {!(isCreatingEmployerByAdminClient || isRegisteringAdminClient) && (
          <div className="form-group">
            <label htmlFor="role">Rôle:</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="super_admin">Super Admin</option>
              <option value="admin_client">Admin Client</option>
              <option value="employer">Employé</option>
            </select>
          </div>
        )}
        {/* admin_client_siret field:
            - Caché si l'Admin Client est en train de créer un employé (le backend gère le rattachement via le token) ou si c'est un enregistrement Admin Client.
            - Visible uniquement si le Super Admin relie un employeur à un admin_client existant.
        */}
        {!(isCreatingEmployerByAdminClient || isRegisteringAdminClient) && formData.role === 'employer' && (
          <div className="form-group">
            <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
            <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
          </div>
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
//src/components/UserForm.jsx
// import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
// import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// // Helper function to create initial form state based on initialData
// const createInitialFormData = (data, isCreatingEmployer) => {
//   // Common fields for all roles
//   const baseData = {
//     nom_entreprise: data.nom_entreprise || '',
//     nom_client: data.nom_client || '',
//     prenom_client: data.prenom_client || '',
//     email: data.email || '',
//     password: '', // Password is never pre-filled for security
//     telephone: data.telephone || '',
//     adresse: data.adresse || '',
//     // Default role: 'employer' if creating an employee, otherwise as provided or 'employer' for general new users
//     role: isCreatingEmployer ? 'employer' : (data.role || 'employer')
//   };

//   if (isCreatingEmployer) {
//     // When an Admin Client creates an employee, specific fields are fixed or nulled
//     return {
//       ...baseData,
//       nom_entreprise: data.nom_entreprise || '', // Will be updated by API call for admin client's data
//       adresse: data.adresse || '', // Will be updated by API call for admin client's data
//       siret: '', // Employee's SIRET is typically null/empty, not relevant here
//       role: 'employer', // Force role to employer, no choice
//       admin_client_siret: data.admin_client_siret || '' // Will be updated by API call for admin client's siret
//     };
//   } else {
//     // For Super Admin creation/update, or general updates
//     return {
//       ...baseData,
//       siret: data.siret || '', // Admin Client's SIRET
//       admin_client_siret: data.admin_client_siret || '' // Employer's Admin Client SIRET
//     };
//   }
// };


// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = '/admin/users' }) => { // apiEndpointForCreation est maintenant relatif

//   // Determine if this form instance is specifically for an Admin Client creating an employee
//   const isCreatingEmployerByAdminClient = initialData.isCreatingEmployerByAdminClient || false;

//   // Initialize formData directly using the helper function.
//   const [formData, setFormData] = useState(() => createInitialFormData(initialData, isCreatingEmployerByAdminClient));

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);


//   // Effect to re-populate form data for updates or to clear for new general creations.
//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       // For updates, set form data based on the provided initialData
//       setFormData(createInitialFormData(initialData, false)); // No 'isCreatingEmployee' context for general updates
//     } else if (!isUpdate && !isCreatingEmployerByAdminClient) {
//       // For standard creation by Super Admin, reset the form.
//       setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//     } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // Special case for initial load of Admin Client creating employee:
//         // Ensure initial form state is correctly set for employee creation.
//         // The fetchAdminClientData useEffect will then populate the company details.
//         setFormData(createInitialFormData({
//             // Preserve some initial details if provided, but reset others
//             nom_client: initialData.nom_client || '',
//             prenom_client: initialData.prenom_client || '',
//             email: initialData.email || '',
//             telephone: initialData.telephone || '',
//         }, true)); // Pass true for isCreatingEmployee to ensure correct initial role etc.
//     }
//   }, [initialData.id, isUpdate, isCreatingEmployerByAdminClient]);


//   // Effect specifically for fetching Admin Client data when creating an employee.
//   useEffect(() => {
//     if (isCreatingEmployerByAdminClient && !isUpdate) {
//       setLoadingAdminClientData(true);
//       const fetchAdminClientData = async () => {
//         try {
//           // Utilise axiosInstance.get() sans l'en-tête Authorization manuel
//           // Le backend renvoie 'nom_entreprise' et 'siret' pour le profil
//           const response = await axiosInstance.get('/users/profile'); // Chemin relatif à baseURL de axiosInstance

//           const adminClientData = response.data;

//           // Vérifie que le rôle est bien admin_client et que le siret est défini
//           // Le backend devrait déjà s'assurer que c'est un admin_client via authorizeRoles
//           if (adminClientData.nom_entreprise && adminClientData.siret) { // Vérifie la présence de nom_entreprise et siret
//             setFormData(prevData => ({
//               ...prevData,
//               nom_entreprise: adminClientData.nom_entreprise, // Pré-rempli avec le nom de l'entreprise de l'admin client
//               adresse: adminClientData.adresse, // Pré-rempli avec l'adresse de l'admin client
//               siret: '', // Le SIRET de l'employé est NULL côté backend, donc vide ici
//               role: 'employer', // Le rôle est forcé à 'employer'
//               admin_client_siret: adminClientData.siret // Le SIRET de l'admin client est auto-rempli
//             }));
//           } else {
//             // Ce cas ne devrait pas se produire si le backend est correctement configuré pour /users/profile
//             setMessage('Erreur: Les informations de l\'Admin Client (nom d\'entreprise ou SIRET) sont manquantes.');
//           }
//         } catch (error) {
//           console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
//           setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
//         } finally {
//           setLoadingAdminClientData(false);
//         }
//       };
//       fetchAdminClientData();
//     }
//   }, [isCreatingEmployerByAdminClient, isUpdate]); // Dependencies for this specific effect

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

//     const dataToSend = { ...formData };

//     // Clean up dataToSend based on the form's purpose
//     if (isCreatingEmployerByAdminClient) {
//         // Pour la création d'employé par un admin client, le backend gère automatiquement
//         // nom_entreprise, siret (à NULL), et admin_client_siret basé sur l'utilisateur authentifié.
//         // Donc, nous n'envoyons que les détails personnels de l'employé.
//         delete dataToSend.nom_entreprise;
//         delete dataToSend.siret; // Le SIRET de l'employé doit être NULL, le backend le gère
//         delete dataToSend.role; // Le rôle est fixé à 'employer' par le backend
//         delete dataToSend.admin_client_siret; // Le backend le dérive du token d'authentification
//     } else {
//         // Pour le Super Admin créant n'importe quel utilisateur (y compris admin_client ou employer)
//         // S'assurer que admin_client_siret est null si ce n'est pas un employeur ou non fourni
//         if (dataToSend.role !== 'employer') {
//             dataToSend.admin_client_siret = null;
//         } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
//             dataToSend.admin_client_siret = null; // S'assurer que c'est null si chaîne vide
//         }

//         // S'assurer que siret est null si ce n'est pas un admin_client ou non fourni
//         if (dataToSend.role !== 'admin_client') {
//             dataToSend.siret = null;
//         } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
//             dataToSend.siret = null; // S'assurer que c'est null si chaîne vide
//         }
//     }

//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password; // Ne pas envoyer le mot de passe s'il n'est pas changé lors de la mise à jour
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         response = await axiosInstance.put(`/admin/users/${initialData.id}`, dataToSend);
//       } else {
//         response = await axiosInstance.post(apiEndpointForCreation, dataToSend);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       // Réinitialiser les données du formulaire après une création réussie, mais seulement pour les nouvelles entrées
//       if (!isUpdate && !isCreatingEmployerByAdminClient) {
//         setFormData(createInitialFormData({}, false)); // Réinitialiser pour la création par Super Admin
//       } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // Pour la création d'employé par admin client, conserver nom_entreprise et adresse mais effacer les détails personnels
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           // nom_entreprise, adresse, siret, admin_client_siret sont pré-remplis/fixés
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingAdminClientData) {
//     return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
//   }

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployerByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         {/* Nom Entreprise - Auto-rempli et ReadOnly pour la création d'employé par Admin Client */}
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">{isCreatingEmployerByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">{isCreatingEmployerByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
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
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         {/* SIRET field:
//             - Caché si l'Admin Client est en train de créer un employé (le SIRET de l'employé est nul, celui de l'entreprise est le SIRET du parent).
//             - Sinon (pour Super Admin), visible et modifiable uniquement si le rôle est 'admin_client'.
//         */}
//         {!isCreatingEmployerByAdminClient && (
//             <div className="form-group">
//                 <label htmlFor="siret">SIRET (pour Admin Client):</label>
//                 <input
//                     type="text"
//                     id="siret"
//                     name="siret"
//                     value={formData.siret}
//                     onChange={handleChange}
//                     readOnly={formData.role !== 'admin_client'} // Modifiable seulement si le rôle est admin_client
//                     className={formData.role !== 'admin_client' ? 'read-only' : ''}
//                 />
//             </div>
//         )}

//         {/* Le champ Rôle est masqué si l'Admin Client crée un employé (seul le rôle 'employer' est possible) */}
//         {!isCreatingEmployerByAdminClient && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* admin_client_siret field:
//             - Caché si l'Admin Client est en train de créer un employé (le backend gère le rattachement via le token).
//             - Visible uniquement si le Super Admin relie un employeur à un admin_client existant.
//         */}
//         {!isCreatingEmployerByAdminClient && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
//             <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
//           </div>
//         )}

//         <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
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














// // frontend/src/components/UserForm.jsx
// import React, { useState, useEffect } from 'react';
// import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
// import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// // Helper function to create initial form state based on initialData
// const createInitialFormData = (data, isCreatingEmployer) => {
//   // Common fields for all roles
//   const baseData = {
//     nom_entreprise: data.nom_entreprise || '',
//     nom_client: data.nom_client || '',
//     prenom_client: data.prenom_client || '',
//     email: data.email || '',
//     password: '', // Password is never pre-filled for security
//     telephone: data.telephone || '',
//     adresse: data.adresse || '',
//     // Default role: 'employer' if creating an employee, otherwise as provided or 'employer' for general new users
//     role: isCreatingEmployer ? 'employer' : (data.role || 'employer')
//   };

//   if (isCreatingEmployer) {
//     // When an Admin Client creates an employee, specific fields are fixed or nulled
//     return {
//       ...baseData,
//       nom_entreprise: data.nom_entreprise || '', // Will be updated by API call for admin client's data
//       adresse: data.adresse || '', // Will be updated by API call for admin client's data
//       siret: '', // Employee's SIRET is typically null/empty, not relevant here
//       role: 'employer', // Force role to employer, no choice
//       admin_client_siret: data.admin_client_siret || '' // Will be updated by API call for admin client's siret
//     };
//   } else {
//     // For Super Admin creation/update, or general updates
//     return {
//       ...baseData,
//       siret: data.siret || '', // Admin Client's SIRET
//       admin_client_siret: data.admin_client_siret || '' // Employer's Admin Client SIRET
//     };
//   }
// };


// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = '/admin/users' }) => { // apiEndpointForCreation est maintenant relatif

//   // Determine if this form instance is specifically for an Admin Client creating an employee
//   const isCreatingEmployerByAdminClient = initialData.isCreatingEmployerByAdminClient || false;

//   // Initialize formData directly using the helper function.
//   const [formData, setFormData] = useState(() => createInitialFormData(initialData, isCreatingEmployerByAdminClient));

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);


//   // Effect to re-populate form data for updates or to clear for new general creations.
//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       // For updates, set form data based on the provided initialData
//       setFormData(createInitialFormData(initialData, false)); // No 'isCreatingEmployee' context for general updates
//     } else if (!isUpdate && !isCreatingEmployerByAdminClient) {
//       // For standard creation by Super Admin, reset the form.
//       setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//     } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // Special case for initial load of Admin Client creating employee:
//         // Ensure initial form state is correctly set for employee creation.
//         // The fetchAdminClientData useEffect will then populate the company details.
//         setFormData(createInitialFormData({
//             // Preserve some initial details if provided, but reset others
//             nom_client: initialData.nom_client || '',
//             prenom_client: initialData.prenom_client || '',
//             email: initialData.email || '',
//             telephone: initialData.telephone || '',
//         }, true)); // Pass true for isCreatingEmployee to ensure correct initial role etc.
//     }
//   }, [initialData.id, isUpdate, isCreatingEmployerByAdminClient]);


//   // Effect specifically for fetching Admin Client data when creating an employee.
//   useEffect(() => {
//     if (isCreatingEmployerByAdminClient && !isUpdate) {
//       setLoadingAdminClientData(true);
//       const fetchAdminClientData = async () => {
//         try {
//           // Plus besoin de récupérer le token ici, l'intercepteur axiosInstance s'en charge
//           // const token = localStorage.getItem('userToken');
//           // if (!token) {
//           //   setMessage('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
//           //   return;
//           // }

//           // Fetch current logged-in user's data (the Admin Client)
//           // Utilise axiosInstance.get() sans l'en-tête Authorization manuel
//           const response = await axiosInstance.get('/users/profile'); // Chemin relatif à baseURL de axiosInstance

//           const adminClientData = response.data;

//           if (adminClientData.role === 'admin_client' && adminClientData.siret) {
//             setFormData(prevData => ({
//               ...prevData,
//               nom_entreprise: adminClientData.nom_entreprise,
//               adresse: adminClientData.adresse,
//               siret: '', // Employee's SIRET should be null/empty, not relevant here
//               role: 'employer', // Force role to employer, no choice
//               admin_client_siret: adminClientData.siret // Auto-fill with admin client's SIRET
//             }));
//           } else {
//             setMessage('Erreur: Vous n\'êtes pas un Admin Client ou votre SIRET n\'est pas défini.');
//           }
//         } catch (error) {
//           console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
//           setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
//         } finally {
//           setLoadingAdminClientData(false);
//         }
//       };
//       fetchAdminClientData();
//     }
//   }, [isCreatingEmployerByAdminClient, isUpdate]); // Dependencies for this specific effect

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

//     // Plus besoin de récupérer le token ni de créer l'objet config ici,
//     // l'intercepteur axiosInstance s'en charge automatiquement.
//     // const token = localStorage.getItem('userToken');
//     // const config = {
//     //   headers: {
//     //     'Content-Type': 'application/json',
//     //     'Authorization': `Bearer ${token}`
//     //   }
//     // };

//     const dataToSend = { ...formData };

//     // Clean up dataToSend based on the form's purpose
//     if (isCreatingEmployerByAdminClient) {
//         // For employee creation by admin client, the backend automatically sets
//         // nom_entreprise, siret (to NULL), and admin_client_siret based on the authenticated user.
//         // So, we only send the employee's personal details.
//         delete dataToSend.nom_entreprise;
//         delete dataToSend.siret; // Employee's own SIRET should be null, backend handles this
//         delete dataToSend.role; // Role is fixed to 'employer' by backend
//         delete dataToSend.admin_client_siret; // Backend derives this from auth token
//     } else {
//         // For Super Admin creating any user (including admin_client or employer)
//         // Ensure admin_client_siret is null if not an employer or not provided
//         if (dataToSend.role !== 'employer') {
//             dataToSend.admin_client_siret = null;
//         } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
//             dataToSend.admin_client_siret = null; // Ensure null if empty string
//         }

//         // Ensure siret is null if not an admin_client or not provided
//         if (dataToSend.role !== 'admin_client') {
//             dataToSend.siret = null;
//         } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
//             dataToSend.siret = null; // Ensure null if empty string
//         }
//     }


//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password; // Don't send password if not changed during update
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         // Utilise axiosInstance.put() sans l'objet config
//         response = await axiosInstance.put(`/admin/users/${initialData.id}`, dataToSend);
//       } else {
//         // Utilise axiosInstance.post() sans l'objet config
//         response = await axiosInstance.post(apiEndpointForCreation, dataToSend);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       // Clear form data after successful creation, but only for new entries
//       if (!isUpdate && !isCreatingEmployerByAdminClient) {
//         setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//       } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // For employee creation by admin client, keep nom_entreprise and adresse but clear personal details
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           // nom_entreprise, adresse, siret, admin_client_siret are pre-filled/fixed
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingAdminClientData) {
//     return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
//   }

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployerByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         {/* Nom Entreprise - Auto-rempli et ReadOnly pour la création d'employé par Admin Client */}
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">{isCreatingEmployerByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">{isCreatingEmployerByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
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
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         {/* SIRET field:
//             - Caché si l'Admin Client est en train de créer un employé (le SIRET de l'employé est nul, celui de l'entreprise est le SIRET du parent).
//             - Sinon (pour Super Admin), visible et modifiable uniquement si le rôle est 'admin_client'.
//         */}
//         {!isCreatingEmployerByAdminClient && (
//             <div className="form-group">
//                 <label htmlFor="siret">SIRET (pour Admin Client):</label>
//                 <input
//                     type="text"
//                     id="siret"
//                     name="siret"
//                     value={formData.siret}
//                     onChange={handleChange}
//                     readOnly={formData.role !== 'admin_client'} // Modifiable seulement si le rôle est admin_client
//                     className={formData.role !== 'admin_client' ? 'read-only' : ''}
//                 />
//             </div>
//         )}

//         {/* Le champ Rôle est masqué si l'Admin Client crée un employé (seul le rôle 'employer' est possible) */}
//         {!isCreatingEmployerByAdminClient && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* admin_client_siret field:
//             - Caché si l'Admin Client est en train de créer un employé (le backend gère le rattachement via le token).
//             - Visible uniquement si le Super Admin relie un employeur à un admin_client existant.
//         */}
//         {!isCreatingEmployerByAdminClient && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
//             <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
//           </div>
//         )}

//         <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
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









// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// // Helper function to create initial form state based on initialData
// const createInitialFormData = (data, isCreatingEmployer) => {
//   // Common fields for all roles
//   const baseData = {
//     nom_entreprise: data.nom_entreprise || '',
//     nom_client: data.nom_client || '',
//     prenom_client: data.prenom_client || '',
//     email: data.email || '',
//     password: '', // Password is never pre-filled for security
//     telephone: data.telephone || '',
//     adresse: data.adresse || '',
//     // Default role: 'employer' if creating an employee, otherwise as provided or 'employer' for general new users
//     role: isCreatingEmployer ? 'employer' : (data.role || 'employer')
//   };

//   if (isCreatingEmployer) {
//     // When an Admin Client creates an employee, specific fields are fixed or nulled
//     return {
//       ...baseData,
//       nom_entreprise: data.nom_entreprise || '', // Will be updated by API call for admin client's data
//       adresse: data.adresse || '', // Will be updated by API call for admin client's data
//       siret: '', // Employee's SIRET is typically null/empty, not relevant here
//       role: 'employer', // Force role to employer, no choice
//       admin_client_siret: data.admin_client_siret || '' // Will be updated by API call for admin client's siret
//     };
//   } else {
//     // For Super Admin creation/update, or general updates
//     return {
//       ...baseData,
//       siret: data.siret || '', // Admin Client's SIRET
//       admin_client_siret: data.admin_client_siret || '' // Employer's Admin Client SIRET
//     };
//   }
// };


// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = 'http://localhost:5001/api/admin/users' }) => {

//   // Determine if this form instance is specifically for an Admin Client creating an employee
//   const isCreatingEmployerByAdminClient = initialData.isCreatingEmployerByAdminClient || false;

//   // Initialize formData directly using the helper function.
//   const [formData, setFormData] = useState(() => createInitialFormData(initialData, isCreatingEmployerByAdminClient));

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);


//   // Effect to re-populate form data for updates or to clear for new general creations.
//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       // For updates, set form data based on the provided initialData
//       setFormData(createInitialFormData(initialData, false)); // No 'isCreatingEmployee' context for general updates
//     } else if (!isUpdate && !isCreatingEmployerByAdminClient) {
//       // For standard creation by Super Admin, reset the form.
//       setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//     } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // Special case for initial load of Admin Client creating employee:
//         // Ensure initial form state is correctly set for employee creation.
//         // The fetchAdminClientData useEffect will then populate the company details.
//         setFormData(createInitialFormData({
//             // Preserve some initial details if provided, but reset others
//             nom_client: initialData.nom_client || '',
//             prenom_client: initialData.prenom_client || '',
//             email: initialData.email || '',
//             telephone: initialData.telephone || '',
//         }, true)); // Pass true for isCreatingEmployee to ensure correct initial role etc.
//     }
//   }, [initialData.id, isUpdate, isCreatingEmployerByAdminClient]);


//   // Effect specifically for fetching Admin Client data when creating an employee.
//   useEffect(() => {
//     if (isCreatingEmployerByAdminClient && !isUpdate) {
//       setLoadingAdminClientData(true);
//       const fetchAdminClientData = async () => {
//         try {
//           const token = localStorage.getItem('userToken');
//           if (!token) {
//             setMessage('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
//             return;
//           }

//           // Fetch current logged-in user's data (the Admin Client)
//           const response = await axios.get('http://localhost:5001/api/users/profile', {
//             headers: { Authorization: `Bearer ${token}` }
//           });

//           const adminClientData = response.data;

//           if (adminClientData.role === 'admin_client' && adminClientData.siret) {
//             setFormData(prevData => ({
//               ...prevData,
//               nom_entreprise: adminClientData.nom_entreprise,
//               adresse: adminClientData.adresse,
//               siret: '', // Employee's SIRET should be null/empty, not relevant here
//               role: 'employer', // Force role to employer, no choice
//               admin_client_siret: adminClientData.siret // Auto-fill with admin client's SIRET
//             }));
//           } else {
//             setMessage('Erreur: Vous n\'êtes pas un Admin Client ou votre SIRET n\'est pas défini.');
//           }
//         } catch (error) {
//           console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
//           setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
//         } finally {
//           setLoadingAdminClientData(false);
//         }
//       };
//       fetchAdminClientData();
//     }
//   }, [isCreatingEmployerByAdminClient, isUpdate]); // Dependencies for this specific effect

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

//     // Clean up dataToSend based on the form's purpose
//     if (isCreatingEmployerByAdminClient) {
//         // For employee creation by admin client, the backend automatically sets
//         // nom_entreprise, siret (to NULL), and admin_client_siret based on the authenticated user.
//         // So, we only send the employee's personal details.
//         delete dataToSend.nom_entreprise;
//         delete dataToSend.siret; // Employee's own SIRET should be null, backend handles this
//         delete dataToSend.role; // Role is fixed to 'employer' by backend
//         delete dataToSend.admin_client_siret; // Backend derives this from auth token
//     } else {
//         // For Super Admin creating any user (including admin_client or employer)
//         // Ensure admin_client_siret is null if not an employer or not provided
//         if (dataToSend.role !== 'employer') {
//             dataToSend.admin_client_siret = null;
//         } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
//             dataToSend.admin_client_siret = null; // Ensure null if empty string
//         }

//         // Ensure siret is null if not an admin_client or not provided
//         if (dataToSend.role !== 'admin_client') {
//             dataToSend.siret = null;
//         } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
//             dataToSend.siret = null; // Ensure null if empty string
//         }
//     }


//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password; // Don't send password if not changed during update
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         response = await axios.put(`http://localhost:5001/api/admin/users/${initialData.id}`, dataToSend, config);
//       } else {
//         response = await axios.post(apiEndpointForCreation, dataToSend, config);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       // Clear form data after successful creation, but only for new entries
//       if (!isUpdate && !isCreatingEmployerByAdminClient) {
//         setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//       } else if (!isUpdate && isCreatingEmployerByAdminClient) {
//         // For employee creation by admin client, keep nom_entreprise and adresse but clear personal details
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           // nom_entreprise, adresse, siret, admin_client_siret are pre-filled/fixed
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingAdminClientData) {
//     return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
//   }

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployerByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         {/* Nom Entreprise - Auto-rempli et ReadOnly pour la création d'employé par Admin Client */}
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">{isCreatingEmployerByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">{isCreatingEmployerByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
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
//             readOnly={isCreatingEmployerByAdminClient}
//             className={isCreatingEmployerByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         {/* SIRET field:
//             - Caché si l'Admin Client est en train de créer un employé (le SIRET de l'employé est nul, celui de l'entreprise est le SIRET du parent).
//             - Sinon (pour Super Admin), visible et modifiable uniquement si le rôle est 'admin_client'.
//         */}
//         {!isCreatingEmployerByAdminClient && (
//             <div className="form-group">
//                 <label htmlFor="siret">SIRET (pour Admin Client):</label>
//                 <input
//                     type="text"
//                     id="siret"
//                     name="siret"
//                     value={formData.siret}
//                     onChange={handleChange}
//                     readOnly={formData.role !== 'admin_client'} // Modifiable seulement si le rôle est admin_client
//                     className={formData.role !== 'admin_client' ? 'read-only' : ''}
//                 />
//             </div>
//         )}

//         {/* Le champ Rôle est masqué si l'Admin Client crée un employé (seul le rôle 'employer' est possible) */}
//         {!isCreatingEmployerByAdminClient && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* admin_client_siret field:
//             - Caché si l'Admin Client est en train de créer un employé (le backend gère le rattachement via le token).
//             - Visible uniquement si le Super Admin relie un employeur à un admin_client existant.
//         */}
//         {!isCreatingEmployerByAdminClient && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
//             <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
//           </div>
//         )}

//         <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
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





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// // Helper function to create initial form state based on initialData
// // This function helps keep the state initialization logic clean and reusable.
// const createInitialFormData = (data, isCreatingEmployee) => {
//   // Common fields for all roles
//   const baseData = {
//     nom_entreprise: data.nom_entreprise || '',
//     nom_client: data.nom_client || '',
//     prenom_client: data.prenom_client || '',
//     email: data.email || '',
//     password: '', // Password is never pre-filled for security
//     telephone: data.telephone || '',
//     adresse: data.adresse || '',
//     // Default role for new creations, can be overridden by initialData
//     role: data.role || 'employer'
//   };

//   if (isCreatingEmployee) {
//     // When an Admin Client creates an employee, specific fields are fixed or nulled
//     return {
//       ...baseData,
//       nom_entreprise: data.nom_entreprise || '', // Will be updated by API call for admin client's data
//       adresse: data.adresse || '', // Will be updated by API call for admin client's data
//       siret: '', // Employee's SIRET is typically null/empty
//       role: 'employer', // Force role to employer
//       admin_client_siret: data.admin_client_siret || '' // Will be updated by API call for admin client's siret
//     };
//   } else {
//     // For Super Admin creation/update, or general updates
//     return {
//       ...baseData,
//       siret: data.siret || '', // Admin Client's SIRET
//       admin_client_siret: data.admin_client_siret || '' // Employer's Admin Client SIRET
//     };
//   }
// };


// // Composant de formulaire pour créer/modifier un utilisateur ou créer un employé
// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = 'http://localhost:5001/api/admin/users' }) => {

//   // Determine if this form instance is specifically for an Admin Client creating an employee
//   // This is true if initialData explicitly indicates an admin_client_siret and role 'employer'
//   // and it's a creation (not an update of an existing employee).
//   // We extract this here to use it in the useState initializer.
//   const isCreatingEmployeeByAdminClient = initialData.isCreatingEmployeeByAdminClient || false;

//   // Initialize formData directly using the helper function.
//   // The function passed to useState runs only once on initial render.
//   const [formData, setFormData] = useState(() => createInitialFormData(initialData, isCreatingEmployeeByAdminClient));

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);


//   // Effect to re-populate form data for updates or to clear for new general creations.
//   // This runs only when relevant identifiers (like initialData.id) or modes (isUpdate) change.
//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       // For updates, set form data based on the provided initialData
//       // We pass `false` for `isCreatingEmployee` because this branch is for general updates, not employee creation by admin client.
//       setFormData(createInitialFormData(initialData, false));
//     } else if (!isUpdate && !isCreatingEmployeeByAdminClient) {
//       // For standard creation by Super Admin, reset the form.
//       // Pass an empty object to clear all fields to their defaults.
//       setFormData(createInitialFormData({}, false));
//     }
//     // Dependencies: only re-run if the user being edited (initialData.id) changes,
//     // or if the form mode (isUpdate, isCreatingEmployeeByAdminClient) changes.
//   }, [initialData.id, isUpdate, isCreatingEmployeeByAdminClient]);


//   // Effect specifically for fetching Admin Client data when creating an employee.
//   // This runs only when `isCreatingEmployeeByAdminClient` becomes true and it's a creation form.
//   useEffect(() => {
//     if (isCreatingEmployeeByAdminClient && !isUpdate) {
//       setLoadingAdminClientData(true);
//       const fetchAdminClientData = async () => {
//         try {
//           const token = localStorage.getItem('userToken');
//           if (!token) {
//             setMessage('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
//             return;
//           }

//           // Fetch current logged-in user's data (the Admin Client)
//           const response = await axios.get('http://localhost:5001/api/users/me', {
//             headers: { Authorization: `Bearer ${token}` }
//           });

//           const adminClientData = response.data;

//           if (adminClientData.role === 'admin_client' && adminClientData.siret) {
//             setFormData(prevData => ({
//               ...prevData,
//               nom_entreprise: adminClientData.nom_entreprise,
//               adresse: adminClientData.adresse,
//               siret: '', // Employee's SIRET should be null/empty
//               role: 'employer', // Force role to employer
//               admin_client_siret: adminClientData.siret // Auto-fill with admin client's SIRET
//             }));
//           } else {
//             setMessage('Erreur: Vous n\'êtes pas un Admin Client ou votre SIRET n\'est pas défini.');
//           }
//         } catch (error) {
//           console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
//           setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
//         } finally {
//           setLoadingAdminClientData(false);
//         }
//       };
//       fetchAdminClientData();
//     }
//   }, [isCreatingEmployeeByAdminClient, isUpdate]); // Dependencies for this specific effect

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

//     // Clean up dataToSend based on the form's purpose
//     if (isCreatingEmployeeByAdminClient) {
//         // For employee creation by admin client, the backend automatically sets
//         // nom_entreprise, siret (to NULL), and admin_client_siret based on the authenticated user.
//         // So, we only send the employee's personal details.
//         delete dataToSend.nom_entreprise;
//         delete dataToSend.siret; // Employee's own SIRET should be null, backend handles this
//         delete dataToSend.role; // Role is fixed to 'employer' by backend
//         delete dataToSend.admin_client_siret; // Backend derives this from auth token
//     } else {
//         // For Super Admin creating any user (including admin_client or employer)
//         // Ensure admin_client_siret is null if not an employer or not provided
//         if (dataToSend.role !== 'employer') {
//             dataToSend.admin_client_siret = null;
//         } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
//             dataToSend.admin_client_siret = null; // Ensure null if empty string
//         }

//         // Ensure siret is null if not an admin_client or not provided
//         if (dataToSend.role !== 'admin_client') {
//             dataToSend.siret = null;
//         } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
//             dataToSend.siret = null; // Ensure null if empty string
//         }
//     }


//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password; // Don't send password if not changed during update
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         // Assuming you have an ID for update and a PUT endpoint
//         // You'll need to pass initialData.id to this endpoint
//         response = await axios.put(`http://localhost:5001/api/admin/users/${initialData.id}`, dataToSend, config);
//       } else {
//         // Use the specified API endpoint for creation
//         // If isCreatingEmployeeByAdminClient is true, apiEndpointForCreation should be '/api/admin-client/employees'
//         // Otherwise, it's '/api/admin/users'
//         response = await axios.post(apiEndpointForCreation, dataToSend, config);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       // Clear form data after successful creation, but only for new entries
//       if (!isUpdate && !isCreatingEmployeeByAdminClient) {
//         setFormData(createInitialFormData({}, false)); // Clear for Super Admin creation
//       } else if (!isUpdate && isCreatingEmployeeByAdminClient) {
//         // For employee creation by admin client, keep nom_entreprise and adresse but clear personal details
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           // nom_entreprise, adresse, siret, admin_client_siret are pre-filled/fixed
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingAdminClientData) {
//     return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
//   }

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployeeByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         {/* Nom Entreprise - ReadOnly pour la création d'employé par Admin Client */}
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployeeByAdminClient}
//             className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">{isCreatingEmployeeByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">{isCreatingEmployeeByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
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
//             readOnly={isCreatingEmployeeByAdminClient}
//             className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         {/* SIRET field: Only editable for admin_client role, or if not creating employee by admin client */}
//         {(!isCreatingEmployeeByAdminClient || formData.role === 'admin_client') && (
//             <div className="form-group">
//                 <label htmlFor="siret">SIRET (pour Admin Client):</label>
//                 <input
//                     type="text"
//                     id="siret"
//                     name="siret"
//                     value={formData.siret}
//                     onChange={handleChange}
//                     readOnly={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client'}
//                     className={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client' ? 'read-only' : ''}
//                 />
//             </div>
//         )}

//         {/* Le champ Rôle est masqué ou en lecture seule si l'Admin Client crée un employé */}
//         {!isCreatingEmployeeByAdminClient && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* admin_client_siret field: Displayed only if role is 'employer' and not creating employee by admin client */}
//         {/* This field is for Super Admin to link an employer to an admin_client */}
//         {!isCreatingEmployeeByAdminClient && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
//             <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
//           </div>
//         )}

//         <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
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








// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './UserForm.css'; // Assurez-vous que ce fichier CSS existe et est stylisé

// // Composant de formulaire pour créer/modifier un utilisateur ou créer un employé
// const UserForm = ({ onUserCreated, initialData = {}, onCancel, isUpdate = false, apiEndpointForCreation = 'http://localhost:5001/api/admin/users' }) => {
//   const [formData, setFormData] = useState({
//     nom_entreprise: initialData.nom_entreprise || '',
//     nom_client: initialData.nom_client || '',
//     prenom_client: initialData.prenom_client || '',
//     email: initialData.email || '',
//     password: '',
//     telephone: initialData.telephone || '',
//     adresse: initialData.adresse || '',
//     siret: initialData.siret || '', // This is the company's SIRET (for admin_client role)
//     role: initialData.role || 'employer',
//     admin_client_siret: initialData.admin_client_siret || '' // This is the admin_client's SIRET (for employer role)
//   });

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loadingAdminClientData, setLoadingAdminClientData] = useState(false);

//   // Determine if this form instance is specifically for an Admin Client creating an employee
//   // This is true if initialData explicitly indicates an admin_client_siret and role 'employer'
//   // and it's a creation (not an update of an existing employee).
//   const isCreatingEmployeeByAdminClient = initialData.isCreatingEmployeeByAdminClient || false;

//   useEffect(() => {
//     // When the component is used by an Admin Client to create an employee
//     if (isCreatingEmployeeByAdminClient && !isUpdate) {
//       setLoadingAdminClientData(true);
//       const fetchAdminClientData = async () => {
//         try {
//           const token = localStorage.getItem('userToken');
//           if (!token) {
//             setMessage('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
//             return;
//           }

//           // Fetch current logged-in user's data (the Admin Client)
//           const response = await axios.get('http://localhost:5001/api/users/me', {
//             headers: { Authorization: `Bearer ${token}` }
//           });

//           const adminClientData = response.data;

//           if (adminClientData.role === 'admin_client' && adminClientData.siret) {
//             setFormData(prevData => ({
//               ...prevData,
//               nom_entreprise: adminClientData.nom_entreprise,
//               adresse: adminClientData.adresse,
//               siret: '', // Employee's SIRET should be null/empty
//               role: 'employer', // Force role to employer
//               admin_client_siret: adminClientData.siret // Auto-fill with admin client's SIRET
//             }));
//           } else {
//             setMessage('Erreur: Vous n\'êtes pas un Admin Client ou votre SIRET n\'est pas défini.');
//           }
//         } catch (error) {
//           console.error('Erreur lors de la récupération des données de l\'Admin Client:', error.response?.data || error.message);
//           setMessage(`Erreur de chargement des données Admin Client: ${error.response?.data?.message || error.message}`);
//         } finally {
//           setLoadingAdminClientData(false);
//         }
//       };
//       fetchAdminClientData();
//     } else if (isUpdate) {
//       // For updates, populate form with initialData
//       setFormData(prevData => ({
//         ...prevData,
//         nom_entreprise: initialData.nom_entreprise || '',
//         nom_client: initialData.nom_client || '',
//         prenom_client: initialData.prenom_client || '',
//         email: initialData.email || '',
//         telephone: initialData.telephone || '',
//         adresse: initialData.adresse || '',
//         siret: initialData.siret || '',
//         role: initialData.role || 'employer',
//         admin_client_siret: initialData.admin_client_siret || ''
//       }));
//     } else {
//         // For standard creation by Super Admin
//         setFormData(prevData => ({
//           ...prevData,
//           nom_entreprise: '',
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           adresse: '',
//           siret: '',
//           role: 'employer',
//           admin_client_siret: ''
//         }));
//     }
//   }, [initialData, isUpdate, isCreatingEmployeeByAdminClient]);


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

//     // Clean up dataToSend based on the form's purpose
//     if (isCreatingEmployeeByAdminClient) {
//         // For employee creation by admin client, the backend automatically sets
//         // nom_entreprise, siret (to NULL), and admin_client_siret based on the authenticated user.
//         // So, we only send the employee's personal details.
//         delete dataToSend.nom_entreprise;
//         delete dataToSend.siret; // Employee's own SIRET should be null, backend handles this
//         delete dataToSend.role; // Role is fixed to 'employer' by backend
//         delete dataToSend.admin_client_siret; // Backend derives this from auth token
//     } else {
//         // For Super Admin creating any user (including admin_client or employer)
//         // Ensure admin_client_siret is null if not an employer or not provided
//         if (dataToSend.role !== 'employer') {
//             dataToSend.admin_client_siret = null;
//         } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
//             dataToSend.admin_client_siret = null; // Ensure null if empty string
//         }

//         // Ensure siret is null if not an admin_client or not provided
//         if (dataToSend.role !== 'admin_client') {
//             dataToSend.siret = null;
//         } else if (dataToSend.role === 'admin_client' && !dataToSend.siret) {
//             dataToSend.siret = null; // Ensure null if empty string
//         }
//     }


//     if (isUpdate && !dataToSend.password) {
//       delete dataToSend.password; // Don't send password if not changed during update
//     }

//     try {
//       let response;
//       if (isUpdate) {
//         // Assuming you have an ID for update and a PUT endpoint
//         // You'll need to pass initialData.id to this endpoint
//         response = await axios.put(`http://localhost:5001/api/admin/users/${initialData.id}`, dataToSend, config);
//       } else {
//         // Use the specified API endpoint for creation
//         // If isCreatingEmployeeByAdminClient is true, apiEndpointForCreation should be '/api/admin-client/employees'
//         // Otherwise, it's '/api/admin/users'
//         response = await axios.post(apiEndpointForCreation, dataToSend, config);
//       }

//       setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
//       if (onUserCreated) {
//         onUserCreated(response.data);
//       }
//       if (!isUpdate && !isCreatingEmployeeByAdminClient) { // Only clear for super admin creation
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           adresse: '',
//           siret: '',
//           admin_client_siret: '',
//           nom_entreprise: '',
//           role: 'employer' // Reset to default role
//         }));
//       } else if (!isUpdate && isCreatingEmployeeByAdminClient) { // Clear for employee creation by admin client
//         setFormData(prevData => ({
//           ...prevData,
//           nom_client: '',
//           prenom_client: '',
//           email: '',
//           password: '',
//           telephone: '',
//           adresse: '',
//           // nom_entreprise, siret, admin_client_siret remain auto-filled
//         }));
//       }
//     } catch (error) {
//       console.error(`Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingAdminClientData) {
//     return <div className="user-form-container"><p>Chargement des données de l'Admin Client...</p></div>;
//   }

//   return (
//     <div className="user-form-container">
//       <h3>{isUpdate ? 'Modifier l\'utilisateur' : (isCreatingEmployeeByAdminClient ? 'Créer un nouvel employé' : 'Créer un nouvel utilisateur')}</h3>
//       <form onSubmit={handleSubmit} className="user-form">
//         {/* Nom Entreprise - ReadOnly pour la création d'employé par Admin Client */}
//         <div className="form-group">
//           <label htmlFor="nom_entreprise">Nom Entreprise:</label>
//           <input
//             type="text"
//             id="nom_entreprise"
//             name="nom_entreprise"
//             value={formData.nom_entreprise}
//             onChange={handleChange}
//             required
//             readOnly={isCreatingEmployeeByAdminClient}
//             className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="nom_client">{isCreatingEmployeeByAdminClient ? 'Nom Employé:' : 'Nom Client:'}</label>
//           <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
//         </div>
//         <div className="form-group">
//           <label htmlFor="prenom_client">{isCreatingEmployeeByAdminClient ? 'Prénom Employé:' : 'Prénom Client:'}</label>
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
//             readOnly={isCreatingEmployeeByAdminClient}
//             className={isCreatingEmployeeByAdminClient ? 'read-only' : ''}
//           />
//         </div>
//         {/* SIRET field: Only editable for admin_client role, or if not creating employee by admin client */}
//         {(!isCreatingEmployeeByAdminClient || formData.role === 'admin_client') && (
//             <div className="form-group">
//                 <label htmlFor="siret">SIRET (pour Admin Client):</label>
//                 <input
//                     type="text"
//                     id="siret"
//                     name="siret"
//                     value={formData.siret}
//                     onChange={handleChange}
//                     readOnly={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client'}
//                     className={isCreatingEmployeeByAdminClient || formData.role !== 'admin_client' ? 'read-only' : ''}
//                 />
//             </div>
//         )}

//         {/* Le champ Rôle est masqué ou en lecture seule si l'Admin Client crée un employé */}
//         {!isCreatingEmployeeByAdminClient && (
//           <div className="form-group">
//             <label htmlFor="role">Rôle:</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="super_admin">Super Admin</option>
//               <option value="admin_client">Admin Client</option>
//               <option value="employer">Employé</option>
//             </select>
//           </div>
//         )}
//         {/* admin_client_siret field: Displayed only if role is 'employer' and not creating employee by admin client */}
//         {!isCreatingEmployeeByAdminClient && formData.role === 'employer' && (
//           <div className="form-group">
//             <label htmlFor="admin_client_siret">SIRET Admin Client (pour les employés):</label>
//             <input type="text" id="admin_client_siret" name="admin_client_siret" value={formData.admin_client_siret} onChange={handleChange} />
//           </div>
//         )}
//         {/* Hidden fields for employee creation by Admin Client to ensure correct role and admin_client_siret are sent */}
//         {isCreatingEmployeeByAdminClient && (
//             // This field displays the auto-filled admin_client_siret for visibility
//             <div className="form-group">
//                 <label htmlFor="admin_client_siret_display">SIRET de rattachement (Automatique):</label>
//                 <input
//                     type="text"
//                     id="admin_client_siret_display"
//                     value={formData.admin_client_siret}
//                     readOnly
//                     className="read-only"
//                 />
//             </div>
//         )}
//         {isCreatingEmployeeByAdminClient && (
//             // These hidden inputs ensure the correct role and admin_client_siret are conceptually part of formData
//             // However, the backend will derive these from the authenticated user, so sending them is redundant
//             // but harmless if the backend ignores them for this specific route.
//             // Given your backend's `createEmployeeByAdminClient` logic, these are not strictly necessary to send.
//             // I'll keep them as hidden for clarity if your backend *did* expect them.
//             <>
//                 <input type="hidden" name="role" value="employer" />
//                 <input type="hidden" name="admin_client_siret" value={formData.admin_client_siret} />
//             </>
//         )}


//         <button type="submit" disabled={isSubmitting || loadingAdminClientData}>
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
