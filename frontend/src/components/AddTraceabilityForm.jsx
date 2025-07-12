// frontend/src/components/AddTraceabilityForm.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam'; // Required for webcam functionality, install with: npm install react-webcam
import axiosInstance from '../api/axiosInstance'; // Centralized Axios instance for API calls
import './AddTraceabilityForm.css'; // Associated CSS file for styling

function AddTraceabilityForm({ siret, employeeId, onAddSuccess }) {
  const webcamRef = useRef(null); // Reference for the webcam component
  const [imageSrc, setImageSrc] = useState(null); // Stores the base64 image from webcam
  const [designation, setDesignation] = useState(''); // Text input for product designation
  const [quantityValue, setQuantityValue] = useState(''); // Numeric value for quantity
  const [quantityUnit, setQuantityUnit] = useState('gramme'); // Unit for quantity (multi-choice)
  const [dateTransformation, setDateTransformation] = useState(''); // Datetime for transformation date
  const [dateLimiteConsommation, setDateLimiteConsommation] = useState(''); // Date for best before date
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission
  const [message, setMessage] = useState(''); // Success message
  const [error, setError] = useState(''); // Error message

  // State to hold the current date and time for the 'capture date' field (read-only)
  const [captureDate, setCaptureDate] = useState('');

  // Effect to set the current date and time when the component mounts
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    // Format for input type="datetime-local" (YYYY-MM-DDTHH:mm)
    setCaptureDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []); // Empty dependency array means this runs once on mount

  // Callback function to capture a screenshot from the webcam
  const capture = useCallback(() => {
    // Ensure webcamRef.current is not null before capturing
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      setImageSrc(capturedImage); // Set the captured image to state
    } else {
      setError("Webcam non disponible ou non chargée.");
    }
  }, [webcamRef]); // Dependency on webcamRef to ensure it's up-to-date

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setIsSubmitting(true); // Set submitting state to true
    setMessage(''); // Clear previous messages
    setError(''); // Clear previous errors

    // Basic validation: ensure an image has been captured
    if (!imageSrc) {
      setError("Veuillez prendre une photo d'abord.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert the base64 image data to a Blob object for FormData
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData(); // Create a new FormData object

      // Append all form data
      formData.append('image', blob, 'traceability_photo.jpeg'); // The image file
      formData.append('designation', designation);
      formData.append('quantityValue', quantityValue);
      formData.append('quantityUnit', quantityUnit);
      formData.append('dateTransformation', dateTransformation);
      formData.append('dateLimiteConsommation', dateLimiteConsommation);
      formData.append('siret', siret); // SIRET of the admin client (passed as prop)
      formData.append('employeeId', employeeId); // ID of the employee creating the record (passed as prop)

      // The 'capture_date' will be automatically set on the backend using serverTimestamp() for integrity

      // Send the data using axiosInstance (handles base URL and authorization token)
      const response = await axiosInstance.post('/traceability/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Essential for sending FormData
        },
      });

      setMessage(response.data.message || 'Enregistrement de traçabilité ajouté avec succès !');
      // Reset form fields after successful submission
      setImageSrc(null);
      setDesignation('');
      setQuantityValue('');
      setQuantityUnit('gramme');
      setDateTransformation('');
      setDateLimiteConsommation('');
      // The captureDate will automatically update to the current time via useEffect on next render

      onAddSuccess && onAddSuccess(response.data); // Notify parent component of success
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'enregistrement de traçabilité:', err);
      if (err.response) {
        // Error from the backend API
        setError(err.response.data.message || 'Erreur lors de l\'ajout.');
      } else if (err.request) {
        // No response received from the server
        setError('Erreur réseau ou serveur inaccessible.');
      } else {
        // Other unexpected errors
        setError(`Une erreur inattendue est survenue: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  return (
    <div className="traceability-form-container">
      <h3>Ajouter un Nouvel Enregistrement de Traçabilité</h3>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-section photo-section">
          <h4>Photo du Produit/Emballage</h4>
          {!imageSrc ? (
            // Display webcam if no image has been captured yet
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={350} // Adjusted size for form layout
              height={260}
              videoConstraints={{ facingMode: "environment" }} // Use rear camera on mobile, front on desktop
              className="webcam-preview"
            />
          ) : (
            // Display captured image preview
            <img src={imageSrc} alt="Aperçu de la photo" className="image-preview" />
          )}
          <div className="photo-buttons">
            <button type="button" onClick={capture} disabled={isSubmitting}>Prendre Photo</button>
            {imageSrc && <button type="button" onClick={() => setImageSrc(null)} disabled={isSubmitting}>Reprendre Photo</button>}
          </div>
        </div>

        <div className="form-section">
          <h4>Informations du Produit</h4>
          <div className="form-group">
            <label htmlFor="designation">Désignation :</label>
            <input
              type="text"
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Ex: Lot de tomates cerises"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantityValue">Quantité :</label>
            <div className="quantity-input-group">
              <input
                type="number"
                id="quantityValue"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                required
                min="0" // Quantity cannot be negative
                step="any" // Allows decimal values
                disabled={isSubmitting}
              />
              <select
                id="quantityUnit"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                required
                disabled={isSubmitting}
              >
                <option value="gramme">Gramme(s)</option>
                <option value="kilo">Kilo(s)</option>
                <option value="litre">Litre(s)</option>
                <option value="millilitre">Millilitre(s)</option>
                <option value="unite">Unité(s)</option> {/* Generic unit option */}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="captureDate">Date de Capture (Auto) :</label>
            <input
              type="datetime-local"
              id="captureDate"
              value={captureDate}
              readOnly // Read-only as it's automatically generated
              disabled // Visually indicate it's not editable
              className="read-only-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateTransformation">Date de Transformation :</label>
            <input
              type="datetime-local"
              id="dateTransformation"
              value={dateTransformation}
              onChange={(e) => setDateTransformation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateLimiteConsommation">Date Limite de Consommation (DLC) :</label>
            <input
              type="date"
              id="dateLimiteConsommation"
              value={dateLimiteConsommation}
              onChange={(e) => setDateLimiteConsommation(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button type="submit" className="submit-traceability-button" disabled={!imageSrc || isSubmitting}>
          {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer la Traçabilité'}
        </button>
      </form>
    </div>
  );
}

export default AddTraceabilityForm;
