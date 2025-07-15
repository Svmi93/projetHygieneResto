// frontend/src/components/Traceability/TraceabilityRecordsGallery.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
// CORRIGÉ : Le chemin d'accès et l'extension du fichier sont maintenant .jsx
import { useAuth } from '../../context/AuthContext'; // <--- CHANGEMENT ICI : AuthContext.js devient AuthContext.jsx

const TraceabilityRecordsGallery = ({ refreshTrigger }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const { user } = useAuth();

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const userSiret = user?.client_id || user?.siret;

            if (!user || !user.role || (!userSiret && user.role !== 'super_admin')) {
                setError('Informations utilisateur insuffisantes pour récupérer les enregistrements.');
                setLoading(false);
                return;
            }

            let endpoint = '';
            if (user.role === 'admin_client' || user.role === 'employer') {
                endpoint = `/traceability/client/${userSiret}`;
            } else if (user.role === 'super_admin') {
                endpoint = '/traceability/admin/records';
            } else {
                setError('Rôle non autorisé pour récupérer les enregistrements de traçabilité.');
                setLoading(false);
                return;
            }

            const response = await axiosInstance.get(endpoint);
            setRecords(response.data);
        } catch (err) {
            console.error('Erreur lors de la récupération des enregistrements de traçabilité:', err);
            setError(err.response?.data?.message || 'Erreur lors de la récupération des enregistrements de traçabilité.');
        } finally {
            setLoading(false);
        }
    }, [user, refreshTrigger]);

    useEffect(() => {
        if (user) {
            fetchRecords();
        }
    }, [user, fetchRecords, refreshTrigger]);

    const openModal = (record) => {
        setSelectedRecord(record);
    };

    const closeModal = () => {
        setSelectedRecord(null);
    };

    const handleDeleteRecord = async (recordId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de traçabilité ?')) {
            try {
                let endpoint = '';
                if (user?.role === 'admin_client' || user?.role === 'super_admin') {
                    endpoint = `/traceability/${recordId}`;
                } else {
                    setError('Vous n\'êtes pas autorisé à supprimer des enregistrements.');
                    return;
                }

                await axiosInstance.delete(endpoint);
                alert('Enregistrement supprimé avec succès.');
                fetchRecords();
                closeModal();
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'enregistrement:', err);
                setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'enregistrement.');
            }
        }
    };

    if (loading) {
        return <div className="text-center text-gray-600">Chargement des enregistrements de traçabilité...</div>;
    }

    if (error) {
        return <div className="text-center text-red-600">Erreur: {error}</div>;
    }

    if (records.length === 0) {
        return <div className="text-center text-gray-600">Aucun enregistrement de traçabilité trouvé.</div>;
    }

    return (
        <div className="traceability-gallery p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {records.map((record) => (
                    <div
                        key={record.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                        onClick={() => openModal(record)}
                    >
                        {record.image_url ? (
                            <img
                                src={record.image_url}
                                alt={record.designation}
                                className="w-full h-48 object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/cccccc/333333?text=Image+Non+Disponible'; }}
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                                Pas d'image
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 truncate">{record.designation}</h3>
                            <p className="text-sm text-gray-600">Quantité: {record.quantity_value} {record.quantity_unit}</p>
                            <p className="text-sm text-gray-600">DLC: {new Date(record.date_limite_consommation).toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs text-gray-500 mt-2">Enregistré le: {new Date(record.capture_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedRecord && (
                <TraceabilityModal
                    record={selectedRecord}
                    onClose={closeModal}
                    onDelete={user?.role === 'admin_client' || user?.role === 'super_admin' ? handleDeleteRecord : null}
                />
            )}
        </div>
    );
};

export default TraceabilityRecordsGallery;

















// // frontend/src/components/Traceability/TraceabilityRecordsGallery.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import axiosInstance from '../../api/axiosInstance'; // Utilise axiosInstance
// import TraceabilityModal from './TraceabilityModal'; // Assurez-vous du bon chemin
// import useAuth from '../../hooks/useAuth'; // Pour obtenir le rôle et le SIRET de l'utilisateur

// const TraceabilityRecordsGallery = ({ refreshTrigger }) => {
//     const [records, setRecords] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [selectedRecord, setSelectedRecord] = useState(null); // Pour la modale
//     const { user } = useAuth(); // Récupère les informations de l'utilisateur connecté

//     const fetchRecords = useCallback(async () => {
//         setLoading(true);
//         setError('');
//         try {
//             let endpoint = '';
//             // Le SIRET est maintenant récupéré directement du hook useAuth
//             const userSiret = user?.client_id || user?.siret; // Utilise client_id pour admin_client, siret pour employer si défini

//             if (user?.role === 'admin_client' && userSiret) {
//                 // CORRIGÉ : Utilise la route /client/:siret
//                 endpoint = `/traceability/client/${userSiret}`;
//             } else if (user?.role === 'employer' && userSiret) {
//                 // CORRIGÉ : Utilise la route /client/:siret pour les employés aussi
//                 endpoint = `/traceability/client/${userSiret}`;
//             } else if (user?.role === 'super_admin') {
//                 // Reste le même
//                 endpoint = '/traceability/admin/records';
//             } else {
//                 setError('Rôle non autorisé ou informations manquantes pour récupérer les enregistrements de traçabilité.');
//                 setLoading(false);
//                 return;
//             }

//             const response = await axiosInstance.get(endpoint);
//             setRecords(response.data);
//         } catch (err) {
//             console.error('Erreur lors de la récupération des enregistrements de traçabilité:', err);
//             setError(err.response?.data?.message || 'Erreur lors de la récupération des enregistrements de traçabilité.');
//         } finally {
//             setLoading(false);
//         }
//     }, [user, refreshTrigger]); // Dépend de l'objet user et refreshTrigger

//     useEffect(() => {
//         if (user) { // S'assure que les infos utilisateur sont chargées
//             fetchRecords();
//         }
//     }, [user, fetchRecords, refreshTrigger]); // Re-fetch quand l'utilisateur change ou refreshTrigger est activé

//     const openModal = (record) => {
//         setSelectedRecord(record);
//     };

//     const closeModal = () => {
//         setSelectedRecord(null);
//     };

//     const handleDeleteRecord = async (recordId) => {
//         if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de traçabilité ?')) {
//             try {
//                 let endpoint = '';
//                 if (user?.role === 'admin_client' || user?.role === 'super_admin') {
//                     // CORRIGÉ : Utilise la route /:id
//                     endpoint = `/traceability/${recordId}`;
//                 } else {
//                     setError('Vous n\'êtes pas autorisé à supprimer des enregistrements.');
//                     return;
//                 }

//                 await axiosInstance.delete(endpoint);
//                 alert('Enregistrement supprimé avec succès.');
//                 fetchRecords(); // Rafraîchir la liste après suppression
//                 closeModal(); // Fermer la modale
//             } catch (err) {
//                 console.error('Erreur lors de la suppression de l\'enregistrement:', err);
//                 setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'enregistrement.');
//             }
//         }
//     };

//     if (loading) {
//         return <div className="text-center text-gray-600">Chargement des enregistrements de traçabilité...</div>;
//     }

//     if (error) {
//         return <div className="text-center text-red-600">Erreur: {error}</div>;
//     }

//     if (records.length === 0) {
//         return <div className="text-center text-gray-600">Aucun enregistrement de traçabilité trouvé.</div>;
//     }

//     return (
//         <div className="traceability-gallery p-4">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {records.map((record) => (
//                     <div
//                         key={record.id}
//                         className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
//                         onClick={() => openModal(record)}
//                     >
//                         {record.image_url ? (
//                             <img
//                                 src={record.image_url}
//                                 alt={record.designation}
//                                 className="w-full h-48 object-cover"
//                                 onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/cccccc/333333?text=Image+Non+Disponible'; }}
//                             />
//                         ) : (
//                             <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
//                                 Pas d'image
//                             </div>
//                         )}
//                         <div className="p-4">
//                             <h3 className="text-lg font-semibold text-gray-800 truncate">{record.designation}</h3>
//                             <p className="text-sm text-gray-600">Quantité: {record.quantity_value} {record.quantity_unit}</p>
//                             <p className="text-sm text-gray-600">DLC: {new Date(record.date_limite_consommation).toLocaleDateString('fr-FR')}</p>
//                             <p className="text-xs text-gray-500 mt-2">Enregistré le: {new Date(record.capture_date).toLocaleDateString('fr-FR')}</p>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {selectedRecord && (
//                 <TraceabilityModal
//                     record={selectedRecord}
//                     onClose={closeModal}
//                     // Passer onDelete seulement si l'utilisateur a le rôle pour supprimer
//                     onDelete={user?.role === 'admin_client' || user?.role === 'super_admin' ? handleDeleteRecord : null}
//                 />
//             )}
//         </div>
//     );
// };

// export default TraceabilityRecordsGallery;
