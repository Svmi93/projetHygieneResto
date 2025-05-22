// frontend/src/components/TemperatureEntryForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './TemperatureEntryForm.css'; // Assurez-vous d'avoir ce fichier CSS pour le style

const TemperatureEntryForm = ({ onRecordAdded, userRole }) => {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState(''); // Garder comme string pour l'input
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    // Convertir la température en nombre
    const tempValue = parseFloat(temperature);

    // Récupérer le user_id depuis localStorage (pour les employés/clients)
    // Pour les Admin Clients qui ajoutent pour un employé, le user_id viendra d'un sélecteur
    const userId = localStorage.getItem('userId'); // L'ID de l'utilisateur connecté (employé)

    // Validation côté client
    if (!type || !location || isNaN(tempValue)) {
      setMessage('Veuillez remplir tous les champs obligatoires (Type, Emplacement, Température).');
      setIsSubmitting(false);
      return;
    }

    // Le timestamp sera généré par le backend ou ici avant l'envoi
    const timestamp = new Date().toISOString(); // Format ISO 8601 pour compatibilité DB

    const recordData = {
      type,
      location,
      temperature: tempValue, // Envoyer la valeur numérique
      timestamp,
      notes,
      user_id: userRole === 'client' ? parseInt(userId) : undefined // user_id pour les employés
    };

    // Si c'est un Admin Client qui utilise ce formulaire pour un employé, il devra fournir l'user_id
    // Pour l'instant, ce formulaire est pensé pour l'employé lui-même.
    // Si l'Admin Client doit l'utiliser, il faudra un champ supplémentaire pour sélectionner l'employé.

    try {
      const token = localStorage.getItem('userToken');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      let endpoint = '';
      if (userRole === 'client') { // Pour les employés
        endpoint = 'http://localhost:5001/api/client/temperatures';
      } else if (userRole === 'admin_client') { // Si l'admin client utilise ce formulaire
        // Il faudra un champ user_id dans le formulaire pour l'admin client
        // Pour l'instant, on suppose que ce formulaire est pour le rôle 'client' (employé)
        setMessage('Ce formulaire n\'est pas configuré pour les Admin Clients sans sélection d\'employé.');
        setIsSubmitting(false);
        return;
      } else if (userRole === 'super_admin') { // Si le super admin utilise ce formulaire
         // Il faudra un champ user_id dans le formulaire pour le super admin
        setMessage('Ce formulaire n\'est pas configuré pour les Super Admins sans sélection d\'employé.');
        setIsSubmitting(false);
        return;
      } else {
        setMessage('Rôle utilisateur non reconnu.');
        setIsSubmitting(false);
        return;
      }


      const response = await axios.post(endpoint, recordData, config);
      setMessage('Relevé ajouté avec succès !');
      onRecordAdded(response.data); // Appelle la fonction de rappel pour mettre à jour la liste
      // Réinitialiser le formulaire
      setType('');
      setLocation('');
      setTemperature('');
      setNotes('');

    } catch (error) {
      console.error('Erreur lors de l\'ajout du relevé:', error.response?.data || error.message);
      setMessage(`Erreur lors de l'ajout du relevé: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="temperature-form-container">
      <h3>Ajouter un nouveau relevé de température</h3>
      <form onSubmit={handleSubmit} className="temperature-form">
        <div className="form-group">
          <label htmlFor="type">Type (ex: Frigo Positif):</label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Emplacement (ex: Réfrigérateur 1):</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="temperature">Température (°C):</label>
          <input
            type="number"
            id="temperature"
            step="0.01" // Permet les décimales
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes">Notes (optionnel):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ajout en cours...' : 'Ajouter le relevé'}
        </button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
};

export default TemperatureEntryForm;
