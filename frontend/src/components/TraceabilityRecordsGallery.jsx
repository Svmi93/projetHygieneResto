// frontend/src/components/TraceabilityRecordsGallery.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import './TraceabilityRecordsGallery.css'; // Créez ce fichier CSS

function TraceabilityRecordsGallery({ siret, onDeleteSuccess }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      // Endpoint pour récupérer les enregistrements de traçabilité par SIRET
      const response = await axiosInstance.get(`/traceability/client/${siret}`);
      setRecords(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des enregistrements de traçabilité:', err);
      setError('Impossible de charger les enregistrements. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siret) {
      fetchRecords();
    }
  }, [siret, onDeleteSuccess]); // Rechargement si le SIRET change ou après une suppression

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de traçabilité ?')) {
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.delete(`/traceability/${recordId}`);
      alert('Enregistrement supprimé avec succès !');
      onDeleteSuccess && onDeleteSuccess(); // Notifie le parent pour rafraîchir
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer l\'enregistrement. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading-message">Chargement des enregistrements de traçabilité...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (records.length === 0) return <p className="no-records-message">Aucun enregistrement de traçabilité disponible pour ce client.</p>;

  return (
    <div className="traceability-gallery-container">
      <h3>Historique des Enregistrements de Traçabilité</h3>
      <div className="records-grid">
        {records.map((record) => (
          <div key={record.id} className="record-item">
            {record.image_url && ( // Affiche l'image si elle existe
              <img src={record.image_url} alt={record.designation} className="record-image" />
            )}
            <div className="record-details">
              <p><strong>Désignation:</strong> {record.designation}</p>
              <p><strong>Quantité:</strong> {record.quantity_value} {record.quantity_unit}</p>
              <p><strong>Date Capture:</strong> {new Date(record.capture_date).toLocaleString()}</p>
              {record.date_transformation && <p><strong>Date Transfo:</strong> {new Date(record.date_transformation).toLocaleDateString()}</p>}
              <p><strong>DLC:</strong> {new Date(record.date_limite_consommation).toLocaleDateString()}</p>
              <p><strong>Employé:</strong> {record.employee_name || record.uploaded_by_employee_id}</p> {/* Afficher le nom si disponible */}
            </div>
            <button onClick={() => handleDeleteRecord(record.id)} disabled={loading} className="delete-record-button">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TraceabilityRecordsGallery;
