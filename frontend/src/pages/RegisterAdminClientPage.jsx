// frontend/src/pages/RegisterAdminClientPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './RegisterAdminClientPage.css';

function RegisterAdminClientPage({ onAdminClientRegistered, onCancel }) {
    // Note: useAuth also provides 'isLoading' and 'error' from the context
    const { register, isLoading: authLoading, error: authError } = useAuth(); // Destructure register, and rename isLoading/error to avoid conflicts
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom_entreprise: '',
        nom_client: '',
        prenom_client: '',
        email: '',
        telephone: '',
        adresse: '',
        siret: '',
        password: '',
        confirmPassword: '',
        role: 'admin_client',
        // admin_client_siret n'est pas nécessaire pour l'enregistrement d'un admin_client
    });
    const [logoFile, setLogoFile] = useState(null);
    const [localError, setLocalError] = useState(''); // Use local state for form validation errors
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        digit: false,
        specialChar: false,
        uppercase: false,
    });
    const [passwordMatch, setPasswordMatch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Used for button disabled state

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 14,
            digit: /[0-9]/.test(password),
            specialChar: /[!?.:\-,&@#$%^*()]/.test(password),
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

    const handleFileChange = (e) => {
        setLogoFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(''); // Clear local errors
        setSuccessMessage('');
        setIsSubmitting(true);

        const isPasswordValid = validatePassword(formData.password);
        const passwordsMatchLocal = formData.password === formData.confirmPassword; // Use a local variable

        if (!isPasswordValid) {
            setLocalError('Le mot de passe ne respecte pas toutes les contraintes.');
            setIsSubmitting(false);
            return;
        }
        if (!passwordsMatchLocal) { // Use the local variable
            setLocalError('Les mots de passe ne correspondent pas.');
            setIsSubmitting(false);
            return;
        }
        if (formData.siret.length !== 14) {
            setLocalError('Le SIRET doit contenir exactement 14 chiffres.');
            setIsSubmitting(false);
            return;
        }
        if (!logoFile) {
            setLocalError('Veuillez télécharger le logo de votre entreprise.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = new FormData();
            for (const key in formData) {
                if (key !== 'confirmPassword' && key !== 'admin_client_siret') { // Don't send confirmPassword or admin_client_siret for admin_client
                    dataToSend.append(key, formData[key]);
                }
            }
            if (logoFile) { // Only append if a file is selected
              dataToSend.append('logo', logoFile); // Key should match backend (Multer field name)
            }


            // Call the register function from AuthContext and check its return value
            const result = await register(dataToSend); // Now returns { success, message, user }

            if (result.success) {
                setSuccessMessage('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
                // Optionally call onAdminClientRegistered if it's passed as a prop
                if (onAdminClientRegistered) {
                    onAdminClientRegistered(result.user);
                }
                navigate('/login', { replace: true });
            } else {
                // If not successful, the error message comes from the result object
                setLocalError(result.message || 'Échec de l\'enregistrement. Vérifiez les informations.');
            }
        } catch (err) {
            // This catch block is for unexpected errors, as AuthContext handles API errors
            console.error('Erreur inattendue lors de l\'enregistrement:', err);
            setLocalError('Une erreur inattendue est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determine if the form is generally valid to enable the submit button
    const isFormValid = passwordMatch && Object.values(passwordValidation).every(Boolean) && formData.siret.length === 14 && !!logoFile;

    return (
        <div className="register-admin-client-page">
            <div className="register-form-container">
                <h2>Enregistrer un nouveau compte Admin Client</h2>
                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label htmlFor="nom_entreprise">Nom de l'entreprise :</label>
                        <input type="text" id="nom_entreprise" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required autoComplete="organization" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nom_client">Nom :</label>
                        <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required autoComplete="family-name" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prenom_client">Prénom :</label>
                        <input type="text" id="prenom_client" name="prenom_client" value={formData.prenom_client} onChange={handleChange} required autoComplete="given-name" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email :</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="telephone">Téléphone :</label>
                        <input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} autoComplete="tel" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="adresse">Adresse :</label>
                        <input type="text" id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} autoComplete="street-address" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="siret">SIRET (14 chiffres) :</label>
                        <input type="text" id="siret" name="siret" value={formData.siret} onChange={handleChange} required minLength="14" maxLength="14" autoComplete="off" /> {/* SIRET n'a pas d'autocomplete standard, donc off */}
                    </div>
                    <div className="form-group">
                        <label htmlFor="logo">Logo de l'entreprise (PNG, JPG) :</label>
                        <input type="file" id="logo" name="logo" accept=".png, .jpg, .jpeg" onChange={handleFileChange} required />
                        {logoFile && <p className="text-sm text-gray-600 mt-1">Fichier sélectionné : {logoFile.name}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe :</label>
                        <input type="password" id="password" name="password" placeholder="Votre mot de passe secret" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                        <div className="password-feedback">
                            <p className={passwordValidation.length ? 'valid' : 'invalid'}>Minimum 14 caractères</p>
                            <p className={passwordValidation.digit ? 'valid' : 'invalid'}>Minimum un chiffre</p>
                            <p className={passwordValidation.specialChar ? 'valid' : 'invalid'}>Minimum un caractère spécial (e.g. !?.:-,&@#$%^*())</p>
                            <p className={passwordValidation.uppercase ? 'valid' : 'invalid'}>Minimum une majuscule</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmer le mot de passe :</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirmer votre mot de passe" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" />
                        {formData.confirmPassword.length > 0 && (
                            <p className={passwordMatch ? 'valid' : 'invalid'}>
                                {passwordMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                            </p>
                        )}
                    </div>

                    {/* Display errors from local validation first, then from AuthContext if present */}
                    {localError && <p className="error-message">{localError}</p>}
                    {!localError && authError && <p className="error-message">{authError}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-actions">
                        <button type="submit" className="register-button" disabled={isSubmitting || !isFormValid}>
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
