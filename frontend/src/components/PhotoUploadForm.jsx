// frontend/src/components/PhotoUploadForm.jsx
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axiosInstance from '../api/axiosInstance'; // Importe l'instance Axios centralisée
import './PhotoUploadForm.css'; // CORRIGÉ: Le fichier CSS devrait être PhotoUploadForm.css

function PhotoUploadForm({ siret, onPhotoUploadSuccess }) {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null); // Pour afficher l'aperçu de la photo
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productType, setProductType] = useState('fresh'); // Valeur par défaut
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const capture = useCallback(() => {
    const capturedImage = webcamRef.current.getScreenshot();
    setImageSrc(capturedImage);
  }, [webcamRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!imageSrc) {
      setError("Veuillez prendre une photo d'abord.");
      setLoading(false);
      return;
    }

    try {
      // Convertir l'image en Blob pour l'envoi
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpeg'); // 'photo' doit correspondre au nom dans upload.single('photo')
      formData.append('product_name', productName);
      formData.append('quantity', quantity);
      formData.append('product_type', productType);
      formData.append('siret', siret); // Le SIRET doit être passé ici

      // Plus besoin de récupérer le token ici, l'intercepteur axiosInstance s'en charge
      // const token = localStorage.getItem('userToken');

      const response = await axiosInstance.post( // Utilise axiosInstance
        '/photos/upload', // Chemin relatif à la baseURL de axiosInstance
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Toujours bon à préciser pour FormData
            // L'en-tête Authorization est géré par l'intercepteur de axiosInstance
          },
        }
      );

      setMessage(response.data.message);
      // Réinitialiser le formulaire
      setImageSrc(null);
      setProductName('');
      setQuantity('');
      setProductType('fresh');
      if (onPhotoUploadSuccess) {
        onPhotoUploadSuccess(); // Notifie le parent qu'une photo a été uploadée
      }

    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      if (err.response) {
        setError(err.response.data.message || 'Erreur lors de l\'upload de la photo.');
      } else {
        setError('Erreur réseau ou serveur inaccessible.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="photo-upload-container">
      <h3>Prendre une photo de produit</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {!imageSrc ? (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={400}
          height={300}
          videoConstraints={{ facingMode: "environment" }} // Pour la caméra arrière sur mobile, "user" pour la caméra avant
        />
      ) : (
        <img src={imageSrc} alt="Aperçu de la photo" style={{ width: '400px', height: '300px' }} />
      )}
      <button onClick={capture} disabled={loading}>Prendre Photo</button>
      {imageSrc && <button onClick={() => setImageSrc(null)} disabled={loading}>Reprendre Photo</button>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="productName">Nom du Produit :</label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantité :</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="0.01"
            step="0.01"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="productType">Type de conservation :</label>
          <select
            id="productType"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            required
            disabled={loading}
          >
            <option value="fresh">Frais</option>
            <option value="frozen">Congelé</option>
            <option value="long_conservation">Longue Conservation</option>
          </select>
        </div>
        <button type="submit" disabled={!imageSrc || loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer la Photo'}
        </button>
      </form>
    </div>
  );
}

export default PhotoUploadForm;
