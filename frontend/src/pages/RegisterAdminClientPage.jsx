// frontend/src/pages/RegisterAdminClientPage.jsx
import React from 'react';
import UserForm from '../components/UserForm'; // Assurez-vous que le chemin est correct
import './RegisterAdminClientPage.css'; // Créez ce fichier CSS pour les styles spécifiques

// Ajout de la prop onCancel pour permettre à App.jsx de fermer le formulaire
// La prop onAdminClientRegistered est utilisée pour notifier App.jsx de l'enregistrement
function RegisterAdminClientPage({ onAdminClientRegistered, onCancel }) {

  return (
    <div className="register-admin-client-page-container">
      <h2>Enregistrer un nouvel Administrateur Client</h2>
      <p>Veuillez remplir les informations de votre entreprise et de votre compte.</p>
      <UserForm
        onUserCreated={onAdminClientRegistered} // Utilise la fonction de rappel de App.jsx
        onCancel={onCancel} // Utilise la fonction de rappel de App.jsx pour annuler
        initialData={{ role: 'admin_client' }} // Définit le rôle par défaut
        isRegisteringAdminClient={true} // Nouvelle prop pour contrôler le comportement du formulaire
        apiEndpointForCreation="/auth/register" // Endpoint pour l'enregistrement (pas /admin/users)
      />
    </div>
  );
}

export default RegisterAdminClientPage;