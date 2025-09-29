// frontend/src/components/UserForm.jsx
import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import './UserForm.css';

// Helper pour initialiser le formulaire
const createInitialFormData = (data, isCreatingEmployer, isRegisteringAdminClient) => {
  const baseData = {
    nom_entreprise: data.nom_entreprise || '',
    nom_client: data.nom_client || '',
    prenom_client: data.prenom_client || '',
    email: data.email || '',
    password: '',
    confirmPassword: '',
    telephone: data.telephone || '',
    adresse: data.adresse || '',
    siret: data.siret || '',
    admin_client_siret: data.admin_client_siret || ''
  };

  if (isCreatingEmployer) {
    return {
      ...baseData,
      siret: '',
      role: 'employer',
      admin_client_siret: data.admin_client_siret || ''
    };
  } else if (isRegisteringAdminClient) {
    return {
      ...baseData,
      role: 'admin_client',
      admin_client_siret: ''
    };
  } else {
    return {
      ...baseData,
      role: data.role || 'employer'
    };
  }
};

const UserForm = ({
  onUserCreated,
  initialData = {},
  onCancel,
  isUpdate = false,
  isRegisteringAdminClient = false
}) => {
  const isCreatingEmployerByAdminClient = initialData.isCreatingEmployerByAdminClient || false;

  const [formData, setFormData] = useState(() =>
    createInitialFormData(initialData, isCreatingEmployerByAdminClient, isRegisteringAdminClient)
  );

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const dataToSend = { ...formData };

    // Nettoyage selon le mode
    if (isCreatingEmployerByAdminClient) {
      delete dataToSend.nom_entreprise;
      delete dataToSend.adresse;
      delete dataToSend.siret;
      delete dataToSend.role;
    } else if (isRegisteringAdminClient) {
      dataToSend.role = 'admin_client';
      dataToSend.admin_client_siret = null;
      if (!dataToSend.siret || dataToSend.siret.length !== 14) {
        setMessage('Le SIRET est obligatoire et doit contenir 14 chiffres pour un Admin Client.');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (dataToSend.role !== 'employer') {
        dataToSend.admin_client_siret = null;
      } else if (dataToSend.role === 'employer' && !dataToSend.admin_client_siret) {
        setMessage('Un employé doit être rattaché à un Admin Client via son SIRET.');
        setIsSubmitting(false);
        return;
      }

      if (dataToSend.role !== 'admin_client') {
        dataToSend.siret = null;
      } else if (dataToSend.role === 'admin_client' && (!dataToSend.siret || dataToSend.siret.length !== 14)) {
        setMessage('Le SIRET est obligatoire et doit contenir 14 chiffres pour un Admin Client.');
        setIsSubmitting(false);
        return;
      }
    }

    delete dataToSend.confirmPassword;

    if (isUpdate && !dataToSend.password) {
      delete dataToSend.password;
    }

    try {
      let response;
      if (isUpdate) {
        response = await axiosInstance.put(`/admin-client/employees/${initialData.id}`, dataToSend);
      } else {
        response = await axiosInstance.post('/admin-client/employees', dataToSend);
      }

      setMessage(`Utilisateur ${isUpdate ? 'mis à jour' : 'créé'} avec succès !`);
      if (onUserCreated) {
        onUserCreated(response.data);
      }

      if (!isUpdate) {
        setFormData(
          createInitialFormData(
            isCreatingEmployerByAdminClient
              ? {
                  nom_entreprise: formData.nom_entreprise,
                  adresse: formData.adresse,
                  admin_client_siret: formData.admin_client_siret
                }
              : {},
            isCreatingEmployerByAdminClient,
            isRegisteringAdminClient
          )
        );
      }
    } catch (error) {
      console.error(
        `Erreur lors ${isUpdate ? 'de la modification' : 'de la création'} de l'utilisateur:`,
        error.response?.data || error.message
      );
      setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-form-container">
      <h3>
        {isUpdate
          ? "Modifier l'utilisateur"
          : isCreatingEmployerByAdminClient
          ? 'Créer un nouvel employé'
          : isRegisteringAdminClient
          ? 'Enregistrer un nouvel Admin Client'
          : 'Créer un nouvel utilisateur'}
      </h3>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="nom_client">{isCreatingEmployerByAdminClient ? 'Nom Employé:' : 'Nom:'}</label>
          <input
            type="text"
            id="nom_client"
            name="nom_client"
            value={formData.nom_client}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prenom_client">{isCreatingEmployerByAdminClient ? 'Prénom Employé:' : 'Prénom:'}</label>
          <input
            type="text"
            id="prenom_client"
            name="prenom_client"
            value={formData.prenom_client}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">
            Mot de passe: {isUpdate && <span className="optional-field">(laisser vide pour ne pas changer)</span>}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!isUpdate}
          />
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
            readOnly={isCreatingEmployerByAdminClient}
          />
        </div>

        {/* Champ SIRET */}
        {isCreatingEmployerByAdminClient ? (
          <div className="form-group">
            <label htmlFor="siret">SIRET :</label>
            <input
              type="text"
              id="siret"
              name="siret"
              value=""
              placeholder="Non applicable pour un employé"
              readOnly
              className="read-only"
            />
          </div>
        ) : (isRegisteringAdminClient || formData.role === 'admin_client') && (
          <div className="form-group">
            <label htmlFor="siret">SIRET (Admin Client) :</label>
            <input
              type="text"
              id="siret"
              name="siret"
              value={formData.siret}
              onChange={handleChange}
              placeholder="55217863900132"
              required
            />
          </div>
        )}

        {/* Champ admin_client_siret (si super admin crée un employé) */}
        {!isCreatingEmployerByAdminClient && !isRegisteringAdminClient && formData.role === 'employer' && (
  <div className="form-group">
    <label htmlFor="admin_client_siret">SIRET Admin Client (pour rattacher l’employé) :</label>
    <input
      type="text"
      id="admin_client_siret"
      name="admin_client_siret"
      value={formData.admin_client_siret}
      onChange={handleChange}
      placeholder="SIRET de l'Admin Client"
      required={formData.role === 'employer' && !isCreatingEmployerByAdminClient}
    />
  </div>
)}

        {/* Champ rôle */}
        {!isCreatingEmployerByAdminClient && !isRegisteringAdminClient && (
          <div className="form-group">
            <label htmlFor="role">Rôle:</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="super_admin">Super Admin</option>
              <option value="admin_client">Admin Client</option>
              <option value="employer">Employé</option>
            </select>
          </div>
        )}

        <div className="buttonContainer">
          <button type="submit" disabled={isSubmitting} className="buttonSubmit">
            {isSubmitting ? 'Envoi en cours...' : isUpdate ? "Modifier l'utilisateur" : "Créer l'utilisateur"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="cancel-button">
              Annuler
            </button>
          )}
        </div>

        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
};

export default UserForm;
