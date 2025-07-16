// frontend/src/pages/RegisterAdminClientPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterAdminClientPage.css'; // Assurez-vous que ce chemin est correct

function RegisterAdminClientPage({ onAdminClientRegistered, onCancel }) {
    const [formData, setFormData] = useState({
        nom_entreprise: '',
        nom_client: '',
        prenom_client: '',
        email: '',
        telephone: '',
        adresse: '',
        siret: '',
        password: '',
        role: 'admin_client', // Rôle par défaut pour cette page
        admin_client_siret: '' // Non pertinent pour admin_client, mais peut être dans le modèle
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register } = useAuth(); // Utilise la fonction register du contexte
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            // Appelle la fonction register du contexte
            const result = await register(formData);
            if (result.success) {
                setSuccessMessage('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
                // Appelle la prop pour notifier le parent (App.jsx) et déclencher la redirection
                if (onAdminClientRegistered) {
                    onAdminClientRegistered(result.user); // Passe l'utilisateur créé
                }
                // Redirige explicitement vers la page de connexion après un succès
                navigate('/login', { replace: true });
            } else {
                setError(result.message || 'Échec de l\'enregistrement.');
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement de l\'Admin Client:', err);
            setError(err.response?.data?.message || 'Une erreur inattendue est survenue lors de l\'enregistrement.');
        }
    };

    return (
        <div className="register-admin-client-page">
            <div className="register-form-container">
                <h2>Enregistrer un nouveau compte Admin Client</h2>
                <form onSubmit={handleSubmit} className="register-form">
                    {/* Champs pour nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password */}
                    <div className="form-group">
                        <label htmlFor="nom_entreprise">Nom de l'entreprise :</label>
                        <input type="text" id="nom_entreprise" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nom_client">Nom :</label>
                        <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prenom_client">Prénom :</label>
                        <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email :</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="telephone">Téléphone :</label>
                        <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="adresse">Adresse :</label>
                        <input type="text" id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="siret">SIRET (14 chiffres) :</label>
                        <input type="text" id="siret" name="siret" value={formData.siret} onChange={handleChange} required minLength="14" maxLength="14" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe :</label>
                        <input type="password" id="password" name="password" placeholder="Votre mot de passe secret" value={formData.password} onChange={handleChange} required />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-actions">
                        <button type="submit" className="register-button">Enregistrer</button>
                        {onCancel && <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterAdminClientPage;
