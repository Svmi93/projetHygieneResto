// frontend/src/components/PhotoGallery.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './PhotoGallery.css'; 

function PhotoGallery({ siret, currentUserRole, onPhotoDeleted }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // L'URL de base est maintenant gérée par axiosInstance, donc les chemins sont relatifs
  // const API_BASE_URL = 'http://localhost:5001/api/admin-client'; // Plus nécessaire

  // La fonction getToken() n'est plus nécessaire car axiosInstance gère l'ajout du token
  // const getToken = () => localStorage.getItem('userToken');

  /**
   * Récupère les photos pour un client spécifique via l'API.
   */
  const fetchPhotos = async () => {
    setLoading(true);
    setError('');
    try {
      // Utilise axiosInstance.get() sans ajouter manuellement le header Authorization
      const response = await axiosInstance.get(`/photos/client/${siret}`); // Chemin relatif
      setPhotos(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des photos:', err);
      setError('Impossible de charger les photos. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Charge les photos au montage du composant ou si le SIRET change/une photo est supprimée
  useEffect(() => {
    if (siret) {
      fetchPhotos();
    }
  }, [siret, onPhotoDeleted]); // Recharge si le SIRET change ou si une photo est supprimée

  /**
   * Gère la suppression d'une photo via l'API.
   * @param {number} photoId L'ID de la photo à supprimer.
   */
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }
    setLoading(true); // Bloque le bouton pendant la suppression
    try {
      // Utilise axiosInstance.delete() sans ajouter manuellement le header Authorization
      await axiosInstance.delete(`/photos/${photoId}`); // Chemin relatif
      
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

  // Affichage des messages de chargement, d'erreur ou d'absence de photos
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
