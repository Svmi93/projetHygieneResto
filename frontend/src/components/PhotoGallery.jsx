// frontend/src/components/PhotoGallery.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PhotoGallery.css'; 

function PhotoGallery({ siret, currentUserRole, onPhotoDeleted }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPhotos = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(
        `http://localhost:5001/api/photos/client/${siret}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setPhotos(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des photos:', err);
      setError('Impossible de charger les photos. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siret) {
      fetchPhotos();
    }
  }, [siret, onPhotoDeleted]); // Recharge si le SIRET change ou si une photo est supprimée

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }
    setLoading(true); // Bloque le bouton pendant la suppression
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(
        `http://localhost:5001/api/photos/${photoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Rafraîchit la liste des photos après suppression
      if (onPhotoDeleted) {
        onPhotoDeleted(); // Notifie le parent ou déclenche un re-fetch
      } else {
        fetchPhotos(); 
      }
      
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer la photo. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Chargement des photos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (photos.length === 0) return <p>Aucune photo disponible pour ce client.</p>;

  return (
    <div className="photo-gallery-container">
      <h3>Photos des produits</h3>
      <div className="photos-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-item">
            {/* L'URL de l'image doit pointer vers ton serveur Express qui sert le dossier 'uploads' */}
            <img src={`http://localhost:5001/uploads/${photo.file_path.split('/').pop()}`} 
                 alt={photo.product_name} 
                 style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
            <p><strong>{photo.product_name}</strong> - {photo.quantity}</p>
            <p>Type: {photo.product_type}</p>
            <p>Date: {new Date(photo.capture_date).toLocaleDateString()}</p>
            {currentUserRole === 'admin' && ( // Seul l'admin peut supprimer
              <button onClick={() => handleDeletePhoto(photo.id)} disabled={loading}>
                Supprimer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotoGallery;