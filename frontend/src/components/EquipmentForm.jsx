// frontend/src/components/EquipmentForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './EquipmentForm.css';

const EquipmentForm = ({ onEquipmentSaved, initialData = {}, onCancel, isUpdate = false }) => {

  // Initialize formData using a function. This runs ONLY ONCE when the component mounts.
  const [formData, setFormData] = useState(() => {
    if (isUpdate && initialData.id) {
      // For updates, initialize with existing data
      return {
        name: initialData.name || '',
        type: initialData.type || '',
        min_temp: initialData.min_temp === null ? '' : initialData.min_temp, // Handle null from DB
        max_temp: initialData.max_temp === null ? '' : initialData.max_temp, // Handle null from DB
        temperature_type: initialData.temperature_type || 'positive'
      };
    } else {
      // For new creation, initialize with empty values
      return {
        name: '',
        type: '',
        min_temp: '',
        max_temp: '',
        temperature_type: 'positive'
      };
    }
  });

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useEffect ONLY for when the component *switches* from create to update or vice-versa,
  // or if the initialData.id specifically changes for an update.
  // This effect will run when `isUpdate` or `initialData.id` changes,
  // allowing the form to re-populate if you're switching which equipment to edit.
  useEffect(() => {
    if (isUpdate && initialData.id) {
      // Only update if the initialData (e.g., the ID of the equipment to edit) actually changed
      // This prevents unnecessary re-renders if the same initialData object is passed repeatedly
      // while not actually representing a new equipment to edit.
      if (
          formData.name !== initialData.name ||
          formData.type !== initialData.type ||
          formData.min_temp !== (initialData.min_temp === null ? '' : initialData.min_temp) ||
          formData.max_temp !== (initialData.max_temp === null ? '' : initialData.max_temp) ||
          formData.temperature_type !== initialData.temperature_type
      ) {
          setFormData({
              name: initialData.name || '',
              type: initialData.type || '',
              min_temp: initialData.min_temp === null ? '' : initialData.min_temp,
              max_temp: initialData.max_temp === null ? '' : initialData.max_temp,
              temperature_type: initialData.temperature_type || 'positive'
          });
      }
    }
    // L'ancien bloc 'else if (!isUpdate && ...)' a été retiré.
    // L'initialisation en mode création est gérée par useState(() => ...).
    // La réinitialisation après soumission est gérée dans handleSubmit.
  }, [initialData, isUpdate]); // Les dépendances restent les mêmes


  const handleChange = (e) => {
    const { name, value } = e.target;
      console.log(`Touche tapée dans le champ ${name}, nouvelle valeur: ${value}`);
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    // Plus besoin de récupérer le token ni de créer l'objet config ici,
    // l'intercepteur axiosInstance s'en charge automatiquement.
    // const token = localStorage.getItem('userToken');
    // const config = {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   }
    // };

    try {
      let response;
      const dataToSend = {
        ...formData,
        // Convert to null if empty string before sending to backend for numeric fields
        min_temp: formData.min_temp === '' ? null : parseFloat(formData.min_temp),
        max_temp: formData.max_temp === '' ? null : parseFloat(formData.max_temp),
      };

      if (isUpdate) {
        // Utilise axiosInstance.put() sans l'objet config
        response = await axiosInstance.put(`/admin-client/equipments/${initialData.id}`, dataToSend);
      } else {
        // Utilise axiosInstance.post() sans l'objet config
        response = await axiosInstance.post('/admin-client/equipments', dataToSend);
      }

      setMessage(`Équipement ${isUpdate ? 'mis à jour' : 'enregistré'} avec succès !`);
      if (onEquipmentSaved) {
        onEquipmentSaved(response.data);
      }
      // Réinitialiser le formulaire après succès pour une nouvelle entrée
      if (!isUpdate) { // Only reset if it was a creation, not an update
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













// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './EquipmentForm.css';

// const EquipmentForm = ({ onEquipmentSaved, initialData = {}, onCancel, isUpdate = false }) => {

//   // Initialize formData using a function. This runs ONLY ONCE when the component mounts.
//   const [formData, setFormData] = useState(() => {
//     if (isUpdate && initialData.id) {
//       // For updates, initialize with existing data
//       return {
//         name: initialData.name || '',
//         type: initialData.type || '',
//         min_temp: initialData.min_temp === null ? '' : initialData.min_temp, // Handle null from DB
//         max_temp: initialData.max_temp === null ? '' : initialData.max_temp, // Handle null from DB
//         temperature_type: initialData.temperature_type || 'positive'
//       };
//     } else {
//       // For new creation, initialize with empty values
//       return {
//         name: '',
//         type: '',
//         min_temp: '',
//         max_temp: '',
//         temperature_type: 'positive'
//       };
//     }
//   });

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Use useEffect ONLY for when the component *switches* from create to update or vice-versa,
//   // or if the initialData.id specifically changes for an update.
//   // This effect will run when `isUpdate` or `initialData.id` changes,
//   // allowing the form to re-populate if you're switching which equipment to edit.
//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       // Only update if the initialData (e.g., the ID of the equipment to edit) actually changed
//       // This prevents unnecessary re-renders if the same initialData object is passed repeatedly
//       // while not actually representing a new equipment to edit.
//       if (
//           formData.name !== initialData.name ||
//           formData.type !== initialData.type ||
//           formData.min_temp !== (initialData.min_temp === null ? '' : initialData.min_temp) ||
//           formData.max_temp !== (initialData.max_temp === null ? '' : initialData.max_temp) ||
//           formData.temperature_type !== initialData.temperature_type
//       ) {
//           setFormData({
//               name: initialData.name || '',
//               type: initialData.type || '',
//               min_temp: initialData.min_temp === null ? '' : initialData.min_temp,
//               max_temp: initialData.max_temp === null ? '' : initialData.max_temp,
//               temperature_type: initialData.temperature_type || 'positive'
//           });
//       }
//     }
//     // L'ancien bloc 'else if (!isUpdate && ...)' a été retiré.
//     // L'initialisation en mode création est gérée par useState(() => ...).
//     // La réinitialisation après soumission est gérée dans handleSubmit.
//   }, [initialData, isUpdate]); // Les dépendances restent les mêmes


//   const handleChange = (e) => {
//     const { name, value } = e.target;
//       console.log(`Touche tapée dans le champ ${name}, nouvelle valeur: ${value}`);
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

//     try {
//       let response;
//       const dataToSend = {
//         ...formData,
//         // Convert to null if empty string before sending to backend for numeric fields
//         min_temp: formData.min_temp === '' ? null : parseFloat(formData.min_temp),
//         max_temp: formData.max_temp === '' ? null : parseFloat(formData.max_temp),
//       };

//       if (isUpdate) {
//         response = await axios.put(`http://localhost:5001/api/admin-client/equipments/${initialData.id}`, dataToSend, config);
//       } else {
//         response = await axios.post('http://localhost:5001/api/admin-client/equipments', dataToSend, config);
//       }

//       setMessage(`Équipement ${isUpdate ? 'mis à jour' : 'enregistré'} avec succès !`);
//       if (onEquipmentSaved) {
//         onEquipmentSaved(response.data);
//       }
//       // Réinitialiser le formulaire après succès pour une nouvelle entrée
//       if (!isUpdate) { // Only reset if it was a creation, not an update
//         setFormData({
//           name: '',
//           type: '',
//           min_temp: '',
//           max_temp: '',
//           temperature_type: 'positive'
//         });
//       }
//     } catch (error) {
//       console.error(`Erreur lors de l'enregistrement de l'équipement:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="equipment-form-container">
//       <h3>{isUpdate ? 'Modifier l\'équipement' : 'Ajouter un nouvel équipement'}</h3>
//       <form onSubmit={handleSubmit} className="equipment-form">
//         <div className="form-group">
//           <label htmlFor="name">Nom de l'équipement:</label>
//           <input
//             type="text"
//             id="name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Ex: Frigo Principal Cuisine"
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="type">Type d'appareil:</label>
//           <input
//             type="text"
//             id="type"
//             name="type"
//             value={formData.type}
//             onChange={handleChange}
//             placeholder="Ex: Réfrigérateur, Congélateur"
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="temperature_type">Type de Température:</label>
//           <select
//             id="temperature_type"
//             name="temperature_type"
//             value={formData.temperature_type}
//             onChange={handleChange}
//             required
//           >
//             <option value="positive">Positive (Ex: Réfrigérateur)</option>
//             <option value="negative">Négative (Ex: Congélateur)</option>
//           </select>
//         </div>
//         <div className="form-group">
//           <label htmlFor="min_temp">Température Min. Recommandée (°C):</label>
//           <input
//             type="number"
//             id="min_temp"
//             name="min_temp"
//             value={formData.min_temp}
//             onChange={handleChange}
//             step="0.1"
//             placeholder="Ex: 0"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="max_temp">Température Max. Recommandée (°C):</label>
//           <input
//             type="number"
//             id="max_temp"
//             name="max_temp"
//             value={formData.max_temp}
//             onChange={handleChange}
//             step="0.1"
//             placeholder="Ex: 4"
//           />
//         </div>

//         <button type="submit" disabled={isSubmitting}>
//           {isSubmitting ? 'Enregistrement...' : (isUpdate ? 'Modifier l\'équipement' : 'Ajouter l\'équipement')}
//         </button>
//         {onCancel && (
//           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
//         )}
//         {message && <p className="form-message">{message}</p>}
//       </form>
//     </div>
//   );
// };

// export default EquipmentForm;










// // frontend/src/components/EquipmentForm.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './EquipmentForm.css'; // Créez ce fichier CSS

// const EquipmentForm = ({ onEquipmentSaved, initialData = {}, onCancel, isUpdate = false }) => {
//   const [formData, setFormData] = useState({
//     name: initialData.name || '', // Nom de l'équipement (ex: "Frigo Cuisine", "Congélateur Réserve")
//     type: initialData.type || '', // Type d'équipement (ex: "Frigo", "Congélateur", "Chambre froide")
//     min_temp: initialData.min_temp || '', // Température minimale attendue
//     max_temp: initialData.max_temp || '', // Température maximale attendue
//     temperature_type: initialData.temperature_type || 'positive' // 'positive' ou 'negative'
//   });

//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (isUpdate && initialData.id) {
//       setFormData({
//         name: initialData.name || '',
//         type: initialData.type || '',
//         min_temp: initialData.min_temp || '',
//         max_temp: initialData.max_temp || '',
//         temperature_type: initialData.temperature_type || 'positive'
//       });
//     } else {
//         // Reset for new creation if not an update
//         setFormData({
//             name: '',
//             type: '',
//             min_temp: '',
//             max_temp: '',
//             temperature_type: 'positive'
//         });
//     }
//   }, [initialData, isUpdate]);

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

//     try {
//       let response;
//       const dataToSend = {
//         ...formData,
//         min_temp: formData.min_temp === '' ? null : parseFloat(formData.min_temp),
//         max_temp: formData.max_temp === '' ? null : parseFloat(formData.max_temp),
//       };

//       if (isUpdate) {
//         response = await axios.put(`http://localhost:5001/api/admin-client/equipments/${initialData.id}`, dataToSend, config);
//       } else {
//         response = await axios.post('http://localhost:5001/api/admin-client/equipments', dataToSend, config);
//       }

//       setMessage(`Équipement ${isUpdate ? 'mis à jour' : 'enregistré'} avec succès !`);
//       if (onEquipmentSaved) {
//         onEquipmentSaved(response.data);
//       }
//       // Réinitialiser le formulaire après succès pour une nouvelle entrée
//       if (!isUpdate) {
//         setFormData({
//           name: '',
//           type: '',
//           min_temp: '',
//           max_temp: '',
//           temperature_type: 'positive'
//         });
//       }
//     } catch (error) {
//       console.error(`Erreur lors de l'enregistrement de l'équipement:`, error.response?.data || error.message);
//       setMessage(`Erreur: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="equipment-form-container">
//       <h3>{isUpdate ? 'Modifier l\'équipement' : 'Ajouter un nouvel équipement'}</h3>
//       <form onSubmit={handleSubmit} className="equipment-form">
//         <div className="form-group">
//           <label htmlFor="name">Nom de l'équipement:</label>
//           <input
//             type="text"
//             id="name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Ex: Frigo Principal Cuisine"
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="type">Type d'appareil:</label>
//           <input
//             type="text"
//             id="type"
//             name="type"
//             value={formData.type}
//             onChange={handleChange}
//             placeholder="Ex: Réfrigérateur, Congélateur"
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="temperature_type">Type de Température:</label>
//           <select
//             id="temperature_type"
//             name="temperature_type"
//             value={formData.temperature_type}
//             onChange={handleChange}
//             required
//           >
//             <option value="positive">Positive (Ex: Réfrigérateur)</option>
//             <option value="negative">Négative (Ex: Congélateur)</option>
//           </select>
//         </div>
//         <div className="form-group">
//           <label htmlFor="min_temp">Température Min. Recommandée (°C):</label>
//           <input
//             type="number"
//             id="min_temp"
//             name="min_temp"
//             value={formData.min_temp}
//             onChange={handleChange}
//             step="0.1"
//             placeholder="Ex: 0"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="max_temp">Température Max. Recommandée (°C):</label>
//           <input
//             type="number"
//             id="max_temp"
//             name="max_temp"
//             value={formData.max_temp}
//             onChange={handleChange}
//             step="0.1"
//             placeholder="Ex: 4"
//           />
//         </div>

//         <button type="submit" disabled={isSubmitting}>
//           {isSubmitting ? 'Enregistrement...' : (isUpdate ? 'Modifier l\'équipement' : 'Ajouter l\'équipement')}
//         </button>
//         {onCancel && (
//           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
//         )}
//         {message && <p className="form-message">{message}</p>}
//       </form>
//     </div>
//   );
// };

// export default EquipmentForm;