// frontend/src/components/EquipmentForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EquipmentForm.css'; // Créez ce fichier CSS

const EquipmentForm = ({ onEquipmentSaved, initialData = {}, onCancel, isUpdate = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '', // Nom de l'équipement (ex: "Frigo Cuisine", "Congélateur Réserve")
    type: initialData.type || '', // Type d'équipement (ex: "Frigo", "Congélateur", "Chambre froide")
    min_temp: initialData.min_temp || '', // Température minimale attendue
    max_temp: initialData.max_temp || '', // Température maximale attendue
    temperature_type: initialData.temperature_type || 'positive' // 'positive' ou 'negative'
  });

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isUpdate && initialData.id) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || '',
        min_temp: initialData.min_temp || '',
        max_temp: initialData.max_temp || '',
        temperature_type: initialData.temperature_type || 'positive'
      });
    } else {
        // Reset for new creation if not an update
        setFormData({
            name: '',
            type: '',
            min_temp: '',
            max_temp: '',
            temperature_type: 'positive'
        });
    }
  }, [initialData, isUpdate]);

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

    try {
      let response;
      const dataToSend = {
        ...formData,
        min_temp: formData.min_temp === '' ? null : parseFloat(formData.min_temp),
        max_temp: formData.max_temp === '' ? null : parseFloat(formData.max_temp),
      };

      if (isUpdate) {
        response = await axios.put(`http://localhost:5001/api/admin-client/equipments/${initialData.id}`, dataToSend, config);
      } else {
        response = await axios.post('http://localhost:5001/api/admin-client/equipments', dataToSend, config);
      }

      setMessage(`Équipement ${isUpdate ? 'mis à jour' : 'enregistré'} avec succès !`);
      if (onEquipmentSaved) {
        onEquipmentSaved(response.data);
      }
      // Réinitialiser le formulaire après succès pour une nouvelle entrée
      if (!isUpdate) {
        setFormData({
          name: '',
          type: '',
          min_temp: '',
          max_temp: '',
          temperature_type: 'positive'
        });
      }
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de l'équipement:`, error.response?.data || error.message);
      setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="equipment-form-container">
      <h3>{isUpdate ? 'Modifier l\'équipement' : 'Ajouter un nouvel équipement'}</h3>
      <form onSubmit={handleSubmit} className="equipment-form">
        <div className="form-group">
          <label htmlFor="name">Nom de l'équipement:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Frigo Principal Cuisine"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="type">Type d'appareil:</label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Ex: Réfrigérateur, Congélateur"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="temperature_type">Type de Température:</label>
          <select
            id="temperature_type"
            name="temperature_type"
            value={formData.temperature_type}
            onChange={handleChange}
            required
          >
            <option value="positive">Positive (Ex: Réfrigérateur)</option>
            <option value="negative">Négative (Ex: Congélateur)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="min_temp">Température Min. Recommandée (°C):</label>
          <input
            type="number"
            id="min_temp"
            name="min_temp"
            value={formData.min_temp}
            onChange={handleChange}
            step="0.1"
            placeholder="Ex: 0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="max_temp">Température Max. Recommandée (°C):</label>
          <input
            type="number"
            id="max_temp"
            name="max_temp"
            value={formData.max_temp}
            onChange={handleChange}
            step="0.1"
            placeholder="Ex: 4"
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : (isUpdate ? 'Modifier l\'équipement' : 'Ajouter l\'équipement')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
        )}
        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
};

export default EquipmentForm;