// frontend/src/components/TraceabilityModal.jsx
import React, { useState } from 'react';
import './TraceabilityModal.css'; // Créez ce fichier CSS
import AddTraceabilityForm from './AddTraceabilityForm'; // Le formulaire d'ajout
import TraceabilityRecordsGallery from './TraceabilityRecordsGallery'; // La galerie de visualisation

function TraceabilityModal({ siret, employeeId, onClose, onRecordActionSuccess }) {
  // 'add' pour le formulaire d'ajout, 'view' pour la galerie
  const [mode, setMode] = useState('add'); 

  // Fonction appelée quand un enregistrement est ajouté ou supprimé, pour rafraîchir la galerie
  const handleActionSuccess = () => {
    onRecordActionSuccess && onRecordActionSuccess(); // Notifie le parent (Dashboard)
    // Si on est en mode 'add' et qu'on vient d'ajouter, on peut passer en mode 'view'
    if (mode === 'add') {
      setMode('view'); 
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Gestion de la Traçabilité</h2>

        <div className="modal-navigation">
          <button
            className={`nav-button ${mode === 'add' ? 'active' : ''}`}
            onClick={() => setMode('add')}
          >
            Ajouter un Enregistrement
          </button>
          <button
            className={`nav-button ${mode === 'view' ? 'active' : ''}`}
            onClick={() => setMode('view')}
          >
            Voir les Enregistrements
          </button>
        </div>

        <div className="modal-body">
          {mode === 'add' ? (
            <AddTraceabilityForm 
              siret={siret} 
              employeeId={employeeId} // Passé à l'employé qui crée l'enregistrement
              onAddSuccess={handleActionSuccess} 
            />
          ) : (
            <TraceabilityRecordsGallery 
              siret={siret} 
              onDeleteSuccess={handleActionSuccess} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TraceabilityModal;
