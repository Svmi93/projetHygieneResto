// frontend/src/components/Traceability/AddTraceabilityForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance'; // Assurez-vous que le chemin est correct
import { useAuth } from '../../context/AuthContext'; // Pour récupérer le SIRET de l'utilisateur
import './AddTraceabilityForm.css';

const AddTraceabilityForm = ({ onRecordAdded }) => {
  const { user } = useAuth(); // Accéder aux informations de l'utilisateur, y compris le SIRET
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  // États et références pour la PREMIÈRE photo (caméra ou upload)
  const videoRef1 = useRef(null);
  const canvasRef1 = useRef(null);
  const [mediaStream1, setMediaStream1] = useState(null);
  const [capturedPhotoDataUrl1, setCapturedPhotoDataUrl1] = useState(null); // Photo capturée 1 (base64)
  const [selectedFile1, setSelectedFile1] = useState(null); // Fichier uploadé 1 (objet File)
  const [previewUrl1, setPreviewUrl1] = useState(null); // Aperçu pour la photo 1 (URL d'objet ou base64)
  const [isCameraActive1, setIsCameraActive1] = useState(false);

  // États et références pour la DEUXIÈME photo (caméra ou upload)
  const videoRef2 = useRef(null);
  const canvasRef2 = useRef(null);
  const [mediaStream2, setMediaStream2] = useState(null);
  const [capturedPhotoDataUrl2, setCapturedPhotoDataUrl2] = useState(null); // Photo capturée 2 (base64)
  const [selectedFile2, setSelectedFile2] = useState(null); // Fichier uploadé 2 (objet File)
  const [previewUrl2, setPreviewUrl2] = useState(null); // Aperçu pour la photo 2 (URL d'objet ou base64)
  const [isCameraActive2, setIsCameraActive2] = useState(false);
  const [showSecondImageSection, setShowSecondImageSection] = useState(false); // Pour afficher/masquer la 2ème section

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fonction utilitaire pour convertir une Data URL (base64) en objet File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // --- NOUVEAUX useEffects pour l'affichage de la caméra ---
  // Gère l'affichage du flux pour la caméra 1
  useEffect(() => {
    if (isCameraActive1 && mediaStream1 && videoRef1.current) {
      console.log("Attaching stream to videoRef1 and playing...");
      videoRef1.current.srcObject = mediaStream1;
      videoRef1.current.play().catch(e => console.error("Erreur de lecture vidéo 1:", e));
    } else if (!isCameraActive1 && videoRef1.current) {
      // Nettoie le srcObject si la caméra est désactivée
      videoRef1.current.srcObject = null;
    }
    // Cleanup: arrête les pistes quand le composant est démonté ou le stream change
    return () => {
      if (mediaStream1) {
        mediaStream1.getTracks().forEach(track => track.stop());
        console.log("Stopped mediaStream1 tracks on cleanup.");
      }
    };
  }, [isCameraActive1, mediaStream1]); // Dépend de l'état d'activation et du stream

  // Gère l'affichage du flux pour la caméra 2
  useEffect(() => {
    if (isCameraActive2 && mediaStream2 && videoRef2.current) {
      console.log("Attaching stream to videoRef2 and playing...");
      videoRef2.current.srcObject = mediaStream2;
      videoRef2.current.play().catch(e => console.error("Erreur de lecture vidéo 2:", e));
    } else if (!isCameraActive2 && videoRef2.current) {
      // Nettoie le srcObject si la caméra est désactivée
      videoRef2.current.srcObject = null;
    }
    // Cleanup: arrête les pistes quand le composant est démonté ou le stream change
    return () => {
      if (mediaStream2) {
        mediaStream2.getTracks().forEach(track => track.stop());
        console.log("Stopped mediaStream2 tracks on cleanup.");
      }
    };
  }, [isCameraActive2, mediaStream2]); // Dépend de l'état d'activation et du stream
  // --- FIN NOUVEAUX useEffects ---


  // Fonctions génériques pour démarrer/arrêter la caméra et prendre une photo
  // Ces fonctions ne gèrent plus l'assignation à videoRef.current
  const startCamera = async (setStream, setIsActive, setCapturedPhotoDataUrl, setSelectedFile, setPreviewUrl) => {
    setError('');
    setCapturedPhotoDataUrl(null); // Efface toute photo capturée précédemment
    setSelectedFile(null); // Efface tout fichier sélectionné précédemment
    setPreviewUrl(null); // Efface toute URL d'aperçu précédente
    console.log(`Tentative de démarrage de la caméra...`);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Flux de caméra obtenu:', stream);
      setStream(stream); // Met à jour l'état du stream
      setIsActive(true); // Active la caméra, ce qui rendra l'élément <video> visible
      console.log('Caméra activée.');
    } catch (err) {
      console.error('Erreur d\'accès à la caméra:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions de votre navigateur et qu\'aucune autre application ne l\'utilise.');
      setIsActive(false);
    }
  };

  // Cette fonction arrête les pistes du stream, mais ne touche plus au srcObject du ref
  const stopCamera = (stream, setStream, setIsActive) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    console.log('Caméra arrêtée.');
  };

  const takePhoto = (videoRef, canvasRef, setCapturedPhotoDataUrl, setPreviewUrl) => {
    console.log(`Tentative de prendre une photo depuis le ref: ${videoRef === videoRef1 ? 'videoRef1' : 'videoRef2'}...`);
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('La vidéo n\'est pas prête ou n\'a pas de dimensions. Veuillez attendre ou réessayer.');
        console.log('La vidéo n\'a pas de dimensions. ReadyState:', video.readyState);
        return;
      }

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedPhotoDataUrl(dataUrl);
      setPreviewUrl(dataUrl); // Met à jour l'aperçu avec la photo capturée
      console.log('Photo capturée et aperçu mis à jour.');
    } else {
      console.log(`Les refs vidéo ou canvas ne sont pas disponibles pour la capture de photo depuis ${videoRef === videoRef1 ? 'videoRef1' : 'videoRef2'}.`);
      setError('Erreur interne: Références vidéo/canvas manquantes pour la capture.');
    }
  };

  // Gère le changement de fichier pour l'upload (générique)
  const handleFileChange = (e, setSelectedFile, setCapturedPhotoDataUrl, stopCamFn, setPreviewUrl) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setCapturedPhotoDataUrl(null); // Efface toute photo prise par la caméra pour ce slot
    stopCamFn(); // Arrête la caméra pour ce slot si un fichier est uploadé

    if (file) {
      setPreviewUrl(URL.createObjectURL(file)); // Crée une URL d'aperçu pour le fichier uploadé
      console.log('Fichier sélectionné et aperçu mis à jour:', file.name);
    } else {
      setPreviewUrl(null);
      console.log('Aucun fichier sélectionné.');
    }
  };

  // Gère la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!user || !user.siret) {
      setError('SIRET de l\'entreprise non disponible. Veuillez vous assurer que votre profil est complet.');
      setLoading(false);
      return;
    }

    let imageToUpload = null;

    // Priorise la photo capturée par la caméra 1, sinon le fichier uploadé 1
    if (capturedPhotoDataUrl1) {
      imageToUpload = dataURLtoFile(capturedPhotoDataUrl1, `traceability_photo_1_${Date.now()}.png`);
    } else if (selectedFile1) {
      imageToUpload = selectedFile1;
    }

    // Vérifie si une image principale est présente
    if (!imageToUpload) {
      setError('Veuillez prendre une photo ou sélectionner un fichier image pour la première image.');
      setLoading(false);
      return;
    }

    // Avertissement si une deuxième image est présente (backend ne supporte qu'une)
    if ((capturedPhotoDataUrl2 || selectedFile2) && showSecondImageSection) {
      alert("Attention : Votre système ne prend en charge qu'une seule image par enregistrement de traçabilité. Seule la première image sera envoyée. Si vous avez besoin de plusieurs images, veuillez mettre à jour votre backend.");
    }

    const formData = new FormData();
    formData.append('product_name', productName);
    formData.append('batch_number', batchNumber);
    formData.append('notes', notes);
    formData.append('siret_entreprise', user.siret);
    formData.append('image', imageToUpload); // 'image' doit correspondre au nom de champ attendu par votre backend

    try {
      const response = await axiosInstance.post('/traceability/records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Enregistrement de traçabilité ajouté avec succès!');
      // Réinitialise tous les champs du formulaire après succès
      setProductName('');
      setBatchNumber('');
      setNotes('');
      setSelectedFile1(null);
      setCapturedPhotoDataUrl1(null);
      setPreviewUrl1(null);
      stopCamera(mediaStream1, setMediaStream1, setIsCameraActive1); // Appel simplifié
      setSelectedFile2(null);
      setCapturedPhotoDataUrl2(null);
      setPreviewUrl2(null);
      stopCamera(mediaStream2, setMediaStream2, setIsCameraActive2); // Appel simplifié
      setShowSecondImageSection(false); // Masque la deuxième section

      onRecordAdded(response.data);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'enregistrement de traçabilité:', err);
      setError(`Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderImageInputSection = (
    sectionNumber,
    videoRef,
    canvasRef,
    mediaStream, // Garde le stream ici pour le passer à stopCamera dans le onClick
    setMediaStream,
    capturedPhotoDataUrl,
    setCapturedPhotoDataUrl,
    selectedFile,
    setSelectedFile,
    previewUrl,
    setPreviewUrl,
    isCameraActive,
    setIsCameraActive
  ) => {
    // Vérification de la compatibilité de l'API de la caméra
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return (
        <div className="border p-4 rounded-md bg-gray-50 mb-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Image {sectionNumber}</h4>
          <p className="text-red-600 text-sm">Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur plus récent ou vérifier ses paramètres.</p>
          <div className="mt-4">
            <h5 className="text-md font-medium text-gray-600 mb-2">Télécharger une photo existante pour l'image {sectionNumber}</h5>
            <input
              type="file"
              id={`imageUpload${sectionNumber}`}
              accept="image/*"
              onChange={(e) => handleFileChange(e, setSelectedFile, setCapturedPhotoDataUrl, () => {}, setPreviewUrl)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {previewUrl && (
              <div className="mt-3 mb-3 text-center">
                <img src={previewUrl} alt={`Aperçu ${sectionNumber}`} className="w-full max-w-xs rounded-md shadow-md inline-block" />
                <button
                  type="button"
                  onClick={() => {
                    console.log(`Suppression de l'image uploadée pour la section ${sectionNumber}`);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="mt-2 block mx-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Supprimer l'image {sectionNumber}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="border p-4 rounded-md bg-gray-50 mb-4">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Image {sectionNumber}</h4>

        {/* Case 1: Camera is active - show video stream and capture/stop buttons */}
        {isCameraActive && (
          <div className="mb-3 text-center">
            {/* L'élément video est toujours rendu ici quand isCameraActive est vrai */}
            <video
              ref={videoRef}
              className="w-full max-w-md rounded-md shadow-md inline-block"
              autoPlay
              playsInline
            ></video>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  takePhoto(videoRef, canvasRef, setCapturedPhotoDataUrl, setPreviewUrl);
                  stopCamera(mediaStream, setMediaStream, setIsCameraActive); // Appel simplifié
                }}
                className="mr-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Capturer la photo {sectionNumber}
              </button>
              <button
                type="button"
                onClick={() => stopCamera(mediaStream, setMediaStream, setIsCameraActive)} // Appel simplifié
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Arrêter la caméra {sectionNumber}
              </button>
            </div>
          </div>
        )}

        {/* Case 2: An image (captured or uploaded) exists AND camera is NOT active - show image preview and delete button */}
        {previewUrl && !isCameraActive && (
          <div className="mt-3 mb-3 text-center">
            <img src={previewUrl} alt={`Aperçu ${sectionNumber}`} className="w-full max-w-xs rounded-md shadow-md inline-block" />
            <button
              type="button"
              onClick={() => {
                console.log(`Suppression de l'image pour la section ${sectionNumber}`);
                setCapturedPhotoDataUrl(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="mt-2 block mx-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Supprimer l'image {sectionNumber}
            </button>
          </div>
        )}

        {/* Case 3: Neither camera active nor image preview exists (initial state or after deletion) - show activate/upload options */}
        {!isCameraActive && !previewUrl && (
          <div className="flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => startCamera(setMediaStream, setIsCameraActive, setCapturedPhotoDataUrl, setSelectedFile, setPreviewUrl)} // Appel simplifié
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Activer la caméra pour l'image {sectionNumber}
            </button>

            <div className="text-center text-gray-500">- OU -</div>

            <div>
              <h5 className="text-md font-medium text-gray-600 mb-2">Télécharger une photo existante pour l'image {sectionNumber}</h5>
              <input
                type="file"
                id={`imageUpload${sectionNumber}`}
                accept="image/*"
                onChange={(e) => handleFileChange(e, setSelectedFile, setCapturedPhotoDataUrl, () => stopCamera(mediaStream, setMediaStream, setIsCameraActive), setPreviewUrl)} // Appel simplifié
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Ajouter un Enregistrement de Traçabilité</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Nom du produit:</label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">Numéro de lot:</label>
          <input
            type="text"
            id="batchNumber"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            autoComplete="off"
          />
        </div>

        {/* Section pour la première image */}
        {renderImageInputSection(
          1,
          videoRef1,
          canvasRef1,
          mediaStream1,
          setMediaStream1,
          capturedPhotoDataUrl1,
          setCapturedPhotoDataUrl1,
          selectedFile1,
          setSelectedFile1,
          previewUrl1,
          setPreviewUrl1,
          isCameraActive1,
          setIsCameraActive1
        )}

        {/* Bouton pour ajouter une deuxième photo */}
        {!showSecondImageSection && (
          <button
            type="button"
            onClick={() => setShowSecondImageSection(true)}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mt-4"
          >
            Ajouter une deuxième photo (max 2)
          </button>
        )}

        {/* Section pour la deuxième image (conditionnelle) */}
        {showSecondImageSection && (
          <>
            {renderImageInputSection(
              2,
              videoRef2,
              canvasRef2,
              mediaStream2,
              setMediaStream2,
              capturedPhotoDataUrl2,
              setCapturedPhotoDataUrl2,
              selectedFile2,
              setSelectedFile2,
              previewUrl2,
              setPreviewUrl2,
              isCameraActive2,
              setIsCameraActive2
            )}
            <button
              type="button"
              onClick={() => {
                setShowSecondImageSection(false);
                setSelectedFile2(null);
                setCapturedPhotoDataUrl2(null);
                setPreviewUrl2(null);
                stopCamera(mediaStream2, setMediaStream2, setIsCameraActive2); // Appel simplifié
              }}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mt-2"
            >
              Retirer la deuxième photo
            </button>
          </>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optionnel):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autoComplete="off"
          ></textarea>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading || (!previewUrl1)} // Le bouton est désactivé si le chargement est en cours OU si la première image n'est pas disponible
        >
          {loading ? 'Ajout en cours...' : 'Ajouter l\'enregistrement'}
        </button>
      </form>
    </div>
  );
};

export default AddTraceabilityForm;




// // frontend/src/components/Traceability/AddTraceabilityForm.jsx
// import React, { useState, useRef, useEffect } from 'react';
// import axiosInstance from '../../api/axiosInstance'; // Assurez-vous que le chemin est correct
// import { useAuth } from '../../context/AuthContext'; // Pour récupérer le SIRET de l'utilisateur

// const AddTraceabilityForm = ({ onRecordAdded }) => {
//   const { user } = useAuth(); // Accéder aux informations de l'utilisateur, y compris le SIRET
//   const [productName, setProductName] = useState('');
//   const [batchNumber, setBatchNumber] = useState('');
//   const [notes, setNotes] = useState('');

//   // États et références pour la PREMIÈRE photo (caméra ou upload)
//   const videoRef1 = useRef(null);
//   const canvasRef1 = useRef(null);
//   const [mediaStream1, setMediaStream1] = useState(null);
//   const [capturedPhotoDataUrl1, setCapturedPhotoDataUrl1] = useState(null); // Photo capturée 1 (base64)
//   const [selectedFile1, setSelectedFile1] = useState(null); // Fichier uploadé 1 (objet File)
//   const [previewUrl1, setPreviewUrl1] = useState(null); // Aperçu pour la photo 1 (URL d'objet ou base64)
//   const [isCameraActive1, setIsCameraActive1] = useState(false);

//   // États et références pour la DEUXIÈME photo (caméra ou upload)
//   const videoRef2 = useRef(null);
//   const canvasRef2 = useRef(null);
//   const [mediaStream2, setMediaStream2] = useState(null);
//   const [capturedPhotoDataUrl2, setCapturedPhotoDataUrl2] = useState(null); // Photo capturée 2 (base64)
//   const [selectedFile2, setSelectedFile2] = useState(null); // Fichier uploadé 2 (objet File)
//   const [previewUrl2, setPreviewUrl2] = useState(null); // Aperçu pour la photo 2 (URL d'objet ou base64)
//   const [isCameraActive2, setIsCameraActive2] = useState(false);
//   const [showSecondImageSection, setShowSecondImageSection] = useState(false); // Pour afficher/masquer la 2ème section

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');

//   // Fonction utilitaire pour convertir une Data URL (base64) en objet File
//   const dataURLtoFile = (dataurl, filename) => {
//     const arr = dataurl.split(',');
//     const mime = arr[0].match(/:(.*?);/)[1];
//     const bstr = atob(arr[1]);
//     let n = bstr.length;
//     const u8arr = new Uint8Array(n);
//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new File([u8arr], filename, { type: mime });
//   };

//   // Effet pour nettoyer les streams de la caméra lorsque le composant est démonté
//   useEffect(() => {
//     return () => {
//       if (mediaStream1) mediaStream1.getTracks().forEach(track => track.stop());
//       if (mediaStream2) mediaStream2.getTracks().forEach(track => track.stop());
//     };
//   }, [mediaStream1, mediaStream2]);

//   // Fonctions génériques pour démarrer/arrêter la caméra et prendre une photo
//   const startCamera = async (ref, setStream, setIsActive, setCapturedPhotoDataUrl, setSelectedFile, setPreviewUrl) => {
//     setError('');
//     setCapturedPhotoDataUrl(null); // Efface toute photo capturée précédemment
//     setSelectedFile(null); // Efface tout fichier sélectionné précédemment
//     setPreviewUrl(null); // Efface toute URL d'aperçu précédente
//     console.log(`Attempting to start camera for ref: ${ref === videoRef1 ? 'videoRef1' : 'videoRef2'}...`);
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       console.log('Camera stream obtained:', stream);
//       if (ref.current) {
//         ref.current.srcObject = stream;
//         ref.current.play();
//         setStream(stream);
//         setIsActive(true);
//         console.log('Camera active and stream set.');
//       } else {
//         console.log(`Video ref ${ref === videoRef1 ? 'videoRef1' : 'videoRef2'} is null, cannot set stream. Stopping stream.`);
//         stream.getTracks().forEach(track => track.stop()); // Arrête le stream si la réf est nulle
//         setError('Erreur interne: Élément vidéo non trouvé. Veuillez actualiser la page.');
//       }
//     } catch (err) {
//       console.error('Erreur d\'accès à la caméra:', err);
//       setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions de votre navigateur et qu\'aucune autre application ne l\'utilise.');
//       setIsActive(false);
//     }
//   };

//   const stopCamera = (stream, setStream, setIsActive, videoRef) => {
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//       setStream(null);
//     }
//     setIsActive(false);
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//     console.log('Camera stopped.');
//   };

//   const takePhoto = (videoRef, canvasRef, setCapturedPhotoDataUrl, setPreviewUrl) => {
//     console.log(`Attempting to take photo from ref: ${videoRef === videoRef1 ? 'videoRef1' : 'videoRef2'}...`);
//     if (videoRef.current && canvasRef.current) {
//       const context = canvasRef.current.getContext('2d');
//       const video = videoRef.current;

//       if (video.videoWidth === 0 || video.videoHeight === 0) {
//         setError('La vidéo n\'est pas prête ou n\'a pas de dimensions. Veuillez attendre ou réessayer.');
//         console.log('Video has no dimensions. ReadyState:', video.readyState);
//         return;
//       }

//       canvasRef.current.width = video.videoWidth;
//       canvasRef.current.height = video.videoHeight;

//       context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
//       const dataUrl = canvasRef.current.toDataURL('image/png');
//       setCapturedPhotoDataUrl(dataUrl);
//       setPreviewUrl(dataUrl); // Met à jour l'aperçu avec la photo capturée
//       console.log('Photo captured and preview set.');
//     } else {
//       console.log(`Video or canvas refs are not available for photo capture from ${videoRef === videoRef1 ? 'videoRef1' : 'videoRef2'}.`);
//       setError('Erreur interne: Références vidéo/canvas manquantes pour la capture.');
//     }
//   };

//   // Gère le changement de fichier pour l'upload (générique)
//   const handleFileChange = (e, setSelectedFile, setCapturedPhotoDataUrl, stopCamFn, setPreviewUrl) => {
//     const file = e.target.files[0];
//     setSelectedFile(file);
//     setCapturedPhotoDataUrl(null); // Efface toute photo prise par la caméra pour ce slot
//     stopCamFn(); // Arrête la caméra pour ce slot si un fichier est uploadé

//     if (file) {
//       setPreviewUrl(URL.createObjectURL(file)); // Crée une URL d'aperçu pour le fichier uploadé
//       console.log('File selected and preview set:', file.name);
//     } else {
//       setPreviewUrl(null);
//       console.log('No file selected.');
//     }
//   };

//   // Gère la soumission du formulaire
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccessMessage('');

//     if (!user || !user.siret) {
//       setError('SIRET de l\'entreprise non disponible. Veuillez vous assurer que votre profil est complet.');
//       setLoading(false);
//       return;
//     }

//     let imageToUpload = null;

//     // Priorise la photo capturée par la caméra 1, sinon le fichier uploadé 1
//     if (capturedPhotoDataUrl1) {
//       imageToUpload = dataURLtoFile(capturedPhotoDataUrl1, `traceability_photo_1_${Date.now()}.png`);
//     } else if (selectedFile1) {
//       imageToUpload = selectedFile1;
//     }

//     // Vérifie si une image principale est présente
//     if (!imageToUpload) {
//       setError('Veuillez prendre une photo ou sélectionner un fichier image pour la première image.');
//       setLoading(false);
//       return;
//     }

//     // Avertissement si une deuxième image est présente (backend ne supporte qu'une)
//     if ((capturedPhotoDataUrl2 || selectedFile2) && showSecondImageSection) {
//       alert("Attention : Votre système ne prend en charge qu'une seule image par enregistrement de traçabilité. Seule la première image sera envoyée. Si vous avez besoin de plusieurs images, veuillez mettre à jour votre backend.");
//     }

//     const formData = new FormData();
//     formData.append('product_name', productName);
//     formData.append('batch_number', batchNumber);
//     formData.append('notes', notes);
//     formData.append('siret_entreprise', user.siret);
//     formData.append('image', imageToUpload); // 'image' doit correspondre au nom de champ attendu par votre backend

//     try {
//       const response = await axiosInstance.post('/traceability/records', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       setSuccessMessage('Enregistrement de traçabilité ajouté avec succès!');
//       // Réinitialise tous les champs du formulaire après succès
//       setProductName('');
//       setBatchNumber('');
//       setNotes('');
//       setSelectedFile1(null);
//       setCapturedPhotoDataUrl1(null);
//       setPreviewUrl1(null);
//       stopCamera(mediaStream1, setMediaStream1, setIsCameraActive1, videoRef1);

//       // Réinitialise la deuxième section aussi
//       setSelectedFile2(null);
//       setCapturedPhotoDataUrl2(null);
//       setPreviewUrl2(null);
//       stopCamera(mediaStream2, setMediaStream2, setIsCameraActive2, videoRef2);
//       setShowSecondImageSection(false); // Masque la deuxième section

//       onRecordAdded(response.data);
//     } catch (err) {
//       console.error('Erreur lors de l\'ajout de l\'enregistrement de traçabilité:', err);
//       setError(`Erreur: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderImageInputSection = (
//     sectionNumber,
//     videoRef,
//     canvasRef,
//     mediaStream,
//     setMediaStream,
//     capturedPhotoDataUrl,
//     setCapturedPhotoDataUrl,
//     selectedFile,
//     setSelectedFile,
//     previewUrl,
//     setPreviewUrl,
//     isCameraActive,
//     setIsCameraActive
//   ) => {
//     // Vérification de la compatibilité de l'API de la caméra
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       return (
//         <div className="border p-4 rounded-md bg-gray-50 mb-4">
//           <h4 className="text-lg font-medium text-gray-700 mb-3">Image {sectionNumber}</h4>
//           <p className="text-red-600 text-sm">Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur plus récent ou vérifier ses paramètres.</p>
//           <div className="mt-4">
//             <h5 className="text-md font-medium text-gray-600 mb-2">Télécharger une photo existante pour l'image {sectionNumber}</h5>
//             <input
//               type="file"
//               id={`imageUpload${sectionNumber}`}
//               accept="image/*"
//               onChange={(e) => handleFileChange(e, setSelectedFile, setCapturedPhotoDataUrl, () => {}, setPreviewUrl)} // Pas besoin de stopCam ici car pas de caméra
//               className="block w-full text-sm text-gray-500
//                 file:mr-4 file:py-2 file:px-4
//                 file:rounded-full file:border-0
//                 file:text-sm file:font-semibold
//                 file:bg-indigo-50 file:text-indigo-700
//                 hover:file:bg-indigo-100"
//             />
//             {previewUrl && (
//               <div className="mt-3 mb-3 text-center">
//                 <img src={previewUrl} alt={`Aperçu ${sectionNumber}`} className="w-full max-w-xs rounded-md shadow-md inline-block" />
//                 <button
//                   type="button"
//                   onClick={() => {
//                     console.log(`Deleting uploaded image for section ${sectionNumber}`);
//                     setSelectedFile(null);
//                     setPreviewUrl(null);
//                   }}
//                   className="mt-2 block mx-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                   Supprimer l'image {sectionNumber}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="border p-4 rounded-md bg-gray-50 mb-4">
//         <h4 className="text-lg font-medium text-gray-700 mb-3">Image {sectionNumber}</h4>

//         {/* Case 1: Camera is active - show video stream and capture/stop buttons */}
//         {isCameraActive && (
//           <div className="mb-3 text-center">
//             <video
//               ref={videoRef}
//               className="w-full max-w-md rounded-md shadow-md inline-block"
//               autoPlay
//               playsInline
//             ></video>
//             <div className="mt-2">
//               <button
//                 type="button"
//                 onClick={() => {
//                   // Correction ici: setCapturedPhotoDataUrl au lieu de setCapturedPhotoData
//                   takePhoto(videoRef, canvasRef, setCapturedPhotoDataUrl, setPreviewUrl);
//                   stopCamera(mediaStream, setMediaStream, setIsCameraActive, videoRef); // Stop camera after taking photo
//                 }}
//                 className="mr-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
//               >
//                 Capturer la photo {sectionNumber}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => stopCamera(mediaStream, setMediaStream, setIsCameraActive, videoRef)}
//                 className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//               >
//                 Arrêter la caméra {sectionNumber}
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Case 2: An image (captured or uploaded) exists AND camera is NOT active - show image preview and delete button */}
//         {previewUrl && !isCameraActive && (
//           <div className="mt-3 mb-3 text-center">
//             <img src={previewUrl} alt={`Aperçu ${sectionNumber}`} className="w-full max-w-xs rounded-md shadow-md inline-block" />
//             <button
//               type="button"
//               onClick={() => {
//                 console.log(`Deleting image for section ${sectionNumber}`);
//                 setCapturedPhotoDataUrl(null); // Correction ici: setCapturedPhotoDataUrl
//                 setSelectedFile(null);
//                 setPreviewUrl(null);
//               }}
//               className="mt-2 block mx-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//             >
//               Supprimer l'image {sectionNumber}
//             </button>
//           </div>
//         )}

//         {/* Case 3: Neither camera active nor image preview exists (initial state or after deletion) - show activate/upload options */}
//         {!isCameraActive && !previewUrl && (
//           <div className="flex flex-col space-y-4">
//             <button
//               type="button"
//               // Correction ici: setCapturedPhotoDataUrl au lieu de setCapturedPhotoData
//               onClick={() => startCamera(videoRef, setMediaStream, setIsCameraActive, setCapturedPhotoDataUrl, setSelectedFile, setPreviewUrl)}
//               className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//             >
//               Activer la caméra pour l'image {sectionNumber}
//             </button>

//             <div className="text-center text-gray-500">- OU -</div>

//             <div>
//               <h5 className="text-md font-medium text-gray-600 mb-2">Télécharger une photo existante pour l'image {sectionNumber}</h5>
//               <input
//                 type="file"
//                 id={`imageUpload${sectionNumber}`}
//                 accept="image/*"
//                 // Correction ici: setCapturedPhotoDataUrl au lieu de setCapturedPhotoData
//                 onChange={(e) => handleFileChange(e, setSelectedFile, setCapturedPhotoDataUrl, () => stopCamera(mediaStream, setMediaStream, setIsCameraActive, videoRef), setPreviewUrl)}
//                 className="block w-full text-sm text-gray-500
//                   file:mr-4 file:py-2 file:px-4
//                   file:rounded-full file:border-0
//                   file:text-sm file:font-semibold
//                   file:bg-indigo-50 file:text-indigo-700
//                   hover:file:bg-indigo-100"
//               />
//             </div>
//           </div>
//         )}
//         <canvas ref={canvasRef} className="hidden"></canvas>
//       </div>
//     );
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow-md mb-8">
//       <h3 className="text-xl font-semibold mb-4 text-gray-800">Ajouter un Enregistrement de Traçabilité</h3>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Nom du produit:</label>
//           <input
//             type="text"
//             id="productName"
//             value={productName}
//             onChange={(e) => setProductName(e.target.value)}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             required
//             autoComplete="off" // Ajout de l'attribut autocomplete
//           />
//         </div>
//         <div>
//           <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">Numéro de lot:</label>
//           <input
//             type="text"
//             id="batchNumber"
//             value={batchNumber}
//             onChange={(e) => setBatchNumber(e.target.value)}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             required
//             autoComplete="off" // Ajout de l'attribut autocomplete
//           />
//         </div>

//         {/* Section pour la première image */}
//         {renderImageInputSection(
//           1,
//           videoRef1,
//           canvasRef1,
//           mediaStream1,
//           setMediaStream1,
//           capturedPhotoDataUrl1,
//           setCapturedPhotoDataUrl1,
//           selectedFile1,
//           setSelectedFile1,
//           previewUrl1,
//           setPreviewUrl1,
//           isCameraActive1,
//           setIsCameraActive1
//         )}

//         {/* Bouton pour ajouter une deuxième photo */}
//         {!showSecondImageSection && (
//           <button
//             type="button"
//             onClick={() => setShowSecondImageSection(true)}
//             className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mt-4"
//           >
//             Ajouter une deuxième photo (max 2)
//           </button>
//         )}

//         {/* Section pour la deuxième image (conditionnelle) */}
//         {showSecondImageSection && (
//           <>
//             {renderImageInputSection(
//               2,
//               videoRef2,
//               canvasRef2,
//               mediaStream2,
//               setMediaStream2,
//               capturedPhotoDataUrl2,
//               setCapturedPhotoDataUrl2,
//               selectedFile2,
//               setSelectedFile2,
//               previewUrl2,
//               setPreviewUrl2,
//               isCameraActive2,
//               setIsCameraActive2
//             )}
//             <button
//               type="button"
//               onClick={() => {
//                 setShowSecondImageSection(false);
//                 setSelectedFile2(null);
//                 setCapturedPhotoDataUrl2(null);
//                 setPreviewUrl2(null);
//                 stopCamera(mediaStream2, setMediaStream2, setIsCameraActive2, videoRef2);
//               }}
//               className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mt-2"
//             >
//               Retirer la deuxième photo
//             </button>
//           </>
//         )}

//         <div>
//           <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optionnel):</label>
//           <textarea
//             id="notes"
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             rows="3"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             autoComplete="off" // Ajout de l'attribut autocomplete
//           ></textarea>
//         </div>

//         {error && <p className="text-red-600 text-sm">{error}</p>}
//         {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

//         <button
//           type="submit"
//           className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
//           disabled={loading || (!previewUrl1)} // Le bouton est désactivé si le chargement est en cours OU si la première image n'est pas disponible
//         >
//           {loading ? 'Ajout en cours...' : 'Ajouter l\'enregistrement'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddTraceabilityForm;

















// // frontend/src/components/Traceability/AddTraceabilityForm.jsx
// import React, { useState } from 'react';
// import axiosInstance from '../../api/axiosInstance'; // Utilise axiosInstance

// const AddTraceabilityForm = ({ onRecordAdded }) => {
//     // États pour les champs du formulaire
//     const [designation, setDesignation] = useState('');
//     const [quantityValue, setQuantityValue] = useState('');
//     const [quantityUnit, setQuantityUnit] = useState('kg'); // Valeur par défaut
//     const [dateTransformation, setDateTransformation] = useState('');
//     const [dateLimiteConsommation, setDateLimiteConsommation] = useState('');
//     const [imageFile, setImageFile] = useState(null); // Pour le fichier image
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState('');
//     const [error, setError] = useState('');

//     // Gère la soumission du formulaire
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setMessage('');
//         setError('');

//         // Validation simple
//         if (!designation || !quantityValue || !quantityUnit || !dateLimiteConsommation || !imageFile) {
//             setError('Veuillez remplir tous les champs obligatoires et sélectionner une image.');
//             setLoading(false);
//             return;
//         }

//         // Utilisation de FormData pour envoyer le fichier et les autres données
//         const formData = new FormData();
//         formData.append('designation', designation);
//         formData.append('quantityValue', quantityValue);
//         formData.append('quantityUnit', quantityUnit);
//         if (dateTransformation) {
//             formData.append('dateTransformation', dateTransformation);
//         }
//         formData.append('dateLimiteConsommation', dateLimiteConsommation);
//         formData.append('image', imageFile); // 'image' doit correspondre au nom du champ attendu par Multer sur le backend

//         try {
//             // CORRIGÉ : L'endpoint pour l'upload de traçabilité est maintenant /api/traceability/add
//             const response = await axiosInstance.post('/traceability/add', formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data', // Important pour l'upload de fichier
//                 },
//             });
//             setMessage(response.data.message || 'Enregistrement de traçabilité ajouté avec succès.');
//             // Réinitialiser le formulaire
//             setDesignation('');
//             setQuantityValue('');
//             setQuantityUnit('kg');
//             setDateTransformation('');
//             setDateLimiteConsommation('');
//             setImageFile(null);
//             // Appeler la fonction de rappel pour rafraîchir la liste si fournie
//             if (onRecordAdded) {
//                 onRecordAdded();
//             }
//         } catch (err) {
//             console.error('Erreur lors de l\'ajout de l\'enregistrement de traçabilité:', err);
//             setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'enregistrement de traçabilité.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
//             <h2 className="text-2xl font-semibold mb-6 text-gray-800">Ajouter un Enregistrement de Traçabilité</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                     <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Désignation :</label>
//                     <input
//                         type="text"
//                         id="designation"
//                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                         value={designation}
//                         onChange={(e) => setDesignation(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                     <div>
//                         <label htmlFor="quantityValue" className="block text-sm font-medium text-gray-700">Quantité :</label>
//                         <input
//                             type="number"
//                             id="quantityValue"
//                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                             value={quantityValue}
//                             onChange={(e) => setQuantityValue(e.target.value)}
//                             step="0.01"
//                             required
//                         />
//                     </div>
//                     <div>
//                         <label htmlFor="quantityUnit" className="block text-sm font-medium text-gray-700">Unité :</label>
//                         <select
//                             id="quantityUnit"
//                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                             value={quantityUnit}
//                             onChange={(e) => setQuantityUnit(e.target.value)}
//                             required
//                         >
//                             <option value="kg">Kg</option>
//                             <option value="g">g</option>
//                             <option value="L">L</option>
//                             <option value="ml">ml</option>
//                             <option value="unit">Unité(s)</option>
//                         </select>
//                     </div>
//                 </div>
//                 <div>
//                     <label htmlFor="dateTransformation" className="block text-sm font-medium text-gray-700">Date de Transformation (optionnel) :</label>
//                     <input
//                         type="date"
//                         id="dateTransformation"
//                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                         value={dateTransformation}
//                         onChange={(e) => setDateTransformation(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label htmlFor="dateLimiteConsommation" className="block text-sm font-medium text-gray-700">Date Limite de Consommation (DLC) :</label>
//                     <input
//                         type="date"
//                         id="dateLimiteConsommation"
//                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                         value={dateLimiteConsommation}
//                         onChange={(e) => setDateLimiteConsommation(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image du Produit :</label>
//                     <input
//                         type="file"
//                         id="image"
//                         className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
//                         accept="image/*"
//                         onChange={(e) => setImageFile(e.target.files[0])}
//                         required
//                     />
//                 </div>

//                 <button
//                     type="submit"
//                     className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                     disabled={loading}
//                 >
//                     {loading ? 'Ajout en cours...' : 'Ajouter l\'enregistrement'}
//                 </button>

//                 {message && <p className="mt-4 text-center text-green-600">{message}</p>}
//                 {error && <p className="mt-4 text-center text-red-600">{error}</p>}
//             </form>
//         </div>
//     );
// };

// export default AddTraceabilityForm;
