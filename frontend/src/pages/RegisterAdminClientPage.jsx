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
        confirmPassword: '', // Nouveau champ pour la confirmation du mot de passe
        role: 'admin_client',
        admin_client_siret: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        digit: false,
        specialChar: false,
        uppercase: false,
    });
    const [passwordMatch, setPasswordMatch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // État pour la soumission

    const { register } = useAuth();
    const navigate = useNavigate();

    // Fonction de validation du mot de passe
    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 14,
            digit: /[0-9]/.test(password),
            specialChar: /[!?.:\-,&@#$%^*()]/.test(password), // Ajout de quelques caractères spéciaux courants
            uppercase: /[A-Z]/.test(password),
        };
        setPasswordValidation(validations);
        return Object.values(validations).every(Boolean);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newFormData = { ...prev, [name]: value };

            if (name === 'password') {
                validatePassword(value);
                setPasswordMatch(value === newFormData.confirmPassword && value.length > 0);
            } else if (name === 'confirmPassword') {
                setPasswordMatch(value === newFormData.password && value.length > 0);
            }
            return newFormData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true); // Début de la soumission

        // Validation frontend avant envoi
        const isPasswordValid = validatePassword(formData.password);
        const passwordsMatch = formData.password === formData.confirmPassword;

        if (!isPasswordValid) {
            setError('Le mot de passe ne respecte pas toutes les contraintes.');
            setIsSubmitting(false);
            return;
        }
        if (!passwordsMatch) {
            setError('Les mots de passe ne correspondent pas.');
            setIsSubmitting(false);
            return;
        }
        if (formData.siret.length !== 14) {
            setError('Le SIRET doit contenir exactement 14 chiffres.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = { ...formData };
            delete dataToSend.confirmPassword; // Ne pas envoyer confirmPassword au backend

            const result = await register(dataToSend);
            if (result.success) {
                setSuccessMessage('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
                if (onAdminClientRegistered) {
                    onAdminClientRegistered(result.user);
                }
                navigate('/login', { replace: true });
            } else {
                // Utiliser le message d'erreur du backend s'il existe, sinon un message générique
                setError(result.message || 'Échec de l\'enregistrement. Vérifiez les informations.');
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement de l\'Admin Client:', err);
            // Afficher le message d'erreur du backend ou un message plus spécifique
            setError(err.response?.data?.message || 'Une erreur inattendue est survenue lors de l\'enregistrement. Le SIRET ou l\'email est peut-être déjà utilisé.');
        } finally {
            setIsSubmitting(false); // Fin de la soumission
        }
    };

    return (
        <div className="register-admin-client-page">
            <div className="register-form-container">
                <h2>Enregistrer un nouveau compte Admin Client</h2>
                <form onSubmit={handleSubmit} className="register-form">
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
                        {/* Indicateurs de validation du mot de passe */}
                        <div className="password-feedback">
                            <p className={passwordValidation.length ? 'valid' : 'invalid'}>Minimum 14 caractères</p>
                            <p className={passwordValidation.digit ? 'valid' : 'invalid'}>Minimum un chiffre</p>
                            <p className={passwordValidation.specialChar ? 'valid' : 'invalid'}>Minimum un caractère spécial (e.g. !?.:-,&@#$%^*())</p>
                            <p className={passwordValidation.uppercase ? 'valid' : 'invalid'}>Minimum une majuscule</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmer le mot de passe :</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirmer votre mot de passe" value={formData.confirmPassword} onChange={handleChange} required />
                        {/* Indicateur de correspondance des mots de passe */}
                        {formData.confirmPassword.length > 0 && (
                            <p className={passwordMatch ? 'valid' : 'invalid'}>
                                {passwordMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                            </p>
                        )}
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-actions">
                        <button type="submit" className="register-button" disabled={isSubmitting || !passwordMatch || !Object.values(passwordValidation).every(Boolean)}>
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        {onCancel && <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterAdminClientPage;