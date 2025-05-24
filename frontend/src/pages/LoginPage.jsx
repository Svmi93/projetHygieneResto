// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios'; // Assure-toi d'avoir axios installé: npm install axios
import './LoginPage.css'; // Pour les styles spécifiques à la page de login

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Tentative de soumission du formulaire de connexion."); 
    setMessage('');
    setIsSubmitting(true);
    setError(''); // Réinitialise les messages d'erreur
    setSuccess(''); // Réinitialise les messages de succès

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });

      console.log('Connexion réussie:', response.data);
      const { token, role, userId } = response.data;

      // Stocker le token et le rôle dans le localStorage
      localStorage.setItem('userToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', userId); // Si tu en as besoin côté frontend

      setSuccess('Connexion réussie ! Redirection...');
      onLoginSuccess(role); // Appelle la fonction de rappel pour mettre à jour l'état de l'App
    } catch (err) {
      console.error('Erreur de connexion:', err);
      if (err.response) {
        // Le serveur a répondu avec un statut d'erreur (4xx ou 5xx)
        setError(err.response.data.message || 'Erreur lors de la connexion.');
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue (ex: API non démarrée)
        setError('Impossible de se connecter au serveur. Le backend est-il démarré ?');
      } else {
        // Autre chose s'est produite lors de la configuration de la requête
        setError('Erreur inattendue lors de la connexion.');
      }
    }
  };

  return (
    <div className="login-page-container">
      <h2>Connexion</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe :</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button">Se connecter</button>
      </form>
      <p className="register-hint">
        Pas encore de compte ? Contactez votre administrateur.
        {/* Plus tard, on pourra ajouter un bouton "S'inscrire" ici si on a une route d'inscription publique */}
      </p>
    </div>
  );
}

export default LoginPage;