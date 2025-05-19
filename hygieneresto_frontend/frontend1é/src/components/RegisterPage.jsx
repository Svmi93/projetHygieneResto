import React, { useState } from 'react';
import axios from 'axios'; // Pour les requêtes HTTP

function RegisterPage() {
  const [formData, setFormData] = useState({
    nomEntreprise: '',
    nomClient: '',
    prenomClient: '',
    email: '',
    telephone: '',
    adresse: '',
    siret: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      setMessage(response.data.message);
      setFormData({ // Réinitialise le formulaire après succès
        nomEntreprise: '', nomClient: '', prenomClient: '', email: '', telephone: '',
        adresse: '', siret: '', password: '', confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    }
  };

  return (
    <div className="register-container">
      <h2>Inscription Restaurateur</h2>
      <form onSubmit={handleSubmit}>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <label htmlFor="nomEntreprise">Nom de l'entreprise :</label>
        <input type="text" id="nomEntreprise" name="nomEntreprise" value={formData.nomEntreprise} onChange={handleChange} required />

        <label htmlFor="nomClient">Nom du contact principal :</label>
        <input type="text" id="nomClient" name="nomClient" value={formData.nomClient} onChange={handleChange} required />

        <label htmlFor="prenomClient">Prénom du contact principal :</label>
        <input type="text" id="prenomClient" name="prenomClient" value={formData.prenomClient} onChange={handleChange} required />

        <label htmlFor="email">Email :</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />

        <label htmlFor="telephone">Téléphone :</label>
        <input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} required />

        <label htmlFor="adresse">Adresse :</label>
        <input type="text" id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} required />

        <label htmlFor="siret">Numéro SIRET :</label>
        <input type="text" id="siret" name="siret" value={formData.siret} onChange={handleChange} required />

        <label htmlFor="password">Mot de passe :</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        <small>Min. 14 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.</small>

        <label htmlFor="confirmPassword">Confirmer le mot de passe :</label>
        <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />

        <button type="submit">S'inscrire</button>
      </form>
    </div>
  );
}

export default RegisterPage;