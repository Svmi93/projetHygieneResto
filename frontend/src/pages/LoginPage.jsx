// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './LoginPage.css';

function LoginPage({ onCancel }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth(); // Utilise la fonction login du contexte d'authentification
    const navigate = useNavigate(); // Hook pour la navigation

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Réinitialise les erreurs

        console.log('Tentative de soumission du formulaire de connexion.');

        try {
            const result = await login(email, password); // Appelle la fonction login du contexte
            if (result.success) {
                // Redirection basée sur le rôle de l'utilisateur
                const userRole = result.user?.role; // Accède au rôle depuis le résultat
                switch (userRole) {
                    case 'admin_client':
                        navigate('/admin-client-dashboard', { replace: true });
                        break;
                    case 'employer':
                        navigate('/employee-dashboard', { replace: true });
                        break;
                    case 'super_admin':
                        navigate('/super-admin-dashboard', { replace: true });
                        break;
                    default:
                        navigate('/', { replace: true }); // Redirection par défaut si le rôle n'est pas reconnu
                }
            } else {
                setError(result.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
            }
        } catch (err) {
            console.error('Erreur lors de la connexion:', err);
            setError('Une erreur inattendue est survenue.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-form-container">
                <h2>Connexion</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email :</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Votre email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe :</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Votre mot de passe secret"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            name="password" // Ajouté pour autocomplete (suggestion du navigateur)
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="form-actions">
                        <button type="submit" className="login-button">Se connecter</button>
                        {onCancel && <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;






// // frontend/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Importez useNavigate
// import AuthService from '../services/AuthService'; // Importez AuthService
// import { useAuth } from '../context/AuthContext'; // Importez useAuth pour la fonction login du contexte
// import './LoginPage.css';

// function LoginPage({ onCancel }) { // onLoginSuccess n'est plus nécessaire ici, le contexte gère la connexion
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { login: contextLogin } = useAuth(); // Renomme la fonction login du contexte pour éviter les conflits
//   const navigate = useNavigate(); // Initialise useNavigate

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Tentative de soumission du formulaire de connexion.");

//     setError('');
//     setSuccess('');
//     setIsSubmitting(true);

//     try {
//       // Utilisez la fonction login du contexte d'authentification
//       // Elle se chargera de stocker le token et de mettre à jour l'état global
//       const loginSuccess = await contextLogin(email, password); // contextLogin renvoie true/false
      
//       if (loginSuccess) {
//         setSuccess('Connexion réussie ! Redirection...');
//         // Le AuthContext mettra à jour l'état global et déclenchera le rendu de App.jsx
//         // La redirection sera gérée par App.jsx via le PrivateRoute ou la logique de routage
//         // Pas besoin de navigate ici, car App.jsx va réagir à l'état d'authentification.
//       } else {
//         setError('Échec de la connexion. Veuillez vérifier vos identifiants.');
//       }
//     } catch (err) {
//       console.error('Erreur de connexion:', err);
//       // L'erreur est déjà loggée par AuthService, ici on affiche juste le message à l'utilisateur
//       setError(err.response?.data?.message || 'Erreur lors de la connexion.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="login-page-container">
//       <h2>Connexion</h2>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}
//       {/* Supprimé le 'message' state car non utilisé */}
//       <form onSubmit={handleSubmit} className="login-form">
//         <div className="form-group">
//           <label htmlFor="email">Email :</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="votre.email@exemple.com"
//             required
//             autoComplete="email"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe :</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Votre mot de passe secret"
//             required
//             autoComplete="current-password"
//           />
//         </div>
//       <div className="buttonCantainer">
//         <button type="submit" className="submit-button" disabled={isSubmitting}>
//           {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
//         </button>
//         {onCancel && (
//           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
//         )}
//       </div>
//       </form>
//       <p className="register-hint">
//         Pas encore de compte ? Contactez votre administrateur.
//       </p>
//     </div>
//   );
// }

// export default LoginPage;








// // frontend/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import axios from 'axios';
// import './LoginPage.css';

// // Ajout de la prop onCancel pour permettre à App.jsx de fermer le formulaire
// function LoginPage({ onLoginSuccess, onCancel }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Tentative de soumission du formulaire de connexion.");

//     setError('');
//     setSuccess('');
//     setMessage('');
//     setIsSubmitting(true);

//     try {
//       const response = await axios.post('http://localhost:5001/api/auth/login', {
//         email,
//         password,
//       });

//       console.log('Connexion réussie:', response.data);
//       const { token, role, id, siret } = response.data;

//       localStorage.setItem('userToken', token);
//       localStorage.setItem('userRole', role);
//       localStorage.setItem('userId', id);
//       if (siret) {
//         localStorage.setItem('clientId', siret);
//       } else {
//         localStorage.removeItem('clientId');
//       }

//       setSuccess('Connexion réussie ! Redirection...');
//       onLoginSuccess(role); // Appelle la fonction de rappel de App.jsx
//     } catch (err) {
//       console.error('Erreur de connexion:', err);
//       if (err.response) {
//         setError(err.response.data.message || 'Erreur lors de la connexion.');
//       } else if (err.request) {
//         setError('Impossible de se connecter au serveur. Le backend est-il démarré et accessible ?');
//       } else {
//         setError('Erreur inattendue lors de la connexion.');
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="login-page-container">
//       <h2>Connexion</h2>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}
//       {message && <p className="info-message">{message}</p>}
//       <form onSubmit={handleSubmit} className="login-form">
//         <div className="form-group">
//           <label htmlFor="email">Email :</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="votre.email@exemple.com"
//             required
//             autoComplete="email"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe :</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Votre mot de passe secret"
//             required
//             autoComplete="current-password"
//           />
//         </div>
//       <div className="buttonCantainer">
//         <button type="submit" className="submit-button" disabled={isSubmitting}>
//           {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
//         </button>
//         {onCancel && ( // Bouton Annuler pour fermer le formulaire
//           <button type="button" onClick={onCancel} className="cancel-button">Annuler</button>
        
//         )}
//       </div>
//       </form>
//       {/* Ce paragraphe est conservé si vous voulez une indication, mais le bouton "S'enregistrer" est dans la navbar */}
//       <p className="register-hint">
//         Pas encore de compte ? Contactez votre administrateur.
//       </p>
//     </div>
//   );
// }

// export default LoginPage;









// // frontend/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import axios from 'axios';
// import './LoginPage.css';
// import { Link } from 'react-router-dom'; // Importez Link pour la navigation

// function LoginPage({ onLoginSuccess }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Tentative de soumission du formulaire de connexion.");

//     setError('');
//     setSuccess('');
//     setMessage('');
//     setIsSubmitting(true);

//     try {
//       const response = await axios.post('http://localhost:5001/api/auth/login', {
//         email,
//         password,
//       });

//       console.log('Connexion réussie:', response.data);
//       // MODIFIÉ ICI : Ajoutez 'siret' à la déstructuration de response.data
//       const { token, role, id, siret } = response.data;

//       // Stocker le token, le rôle, l'ID et le SIRET (si présent) dans le localStorage
//       localStorage.setItem('userToken', token);
//       localStorage.setItem('userRole', role);
//       localStorage.setItem('userId', id);
//       // AJOUTÉ ICI : Stocke le siret si l'utilisateur est un admin_client
//       if (siret) {
//         localStorage.setItem('clientId', siret); // Utilisez 'clientId' pour la cohérence avec le backend
//       } else {
//         // S'assurer que clientId est supprimé si l'utilisateur n'est pas un admin_client (ex: un employé)
//         localStorage.removeItem('clientId');
//       }


//       setSuccess('Connexion réussie ! Redirection...');
//       onLoginSuccess(role);
//     } catch (err) {
//       console.error('Erreur de connexion:', err);
//       if (err.response) {
//         setError(err.response.data.message || 'Erreur lors de la connexion.');
//       } else if (err.request) {
//         setError('Impossible de se connecter au serveur. Le backend est-il démarré et accessible ?');
//       } else {
//         setError('Erreur inattendue lors de la connexion.');
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="login-page-container">
//       <h2>Connexion</h2>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}
//       {message && <p className="info-message">{message}</p>}
//       <form onSubmit={handleSubmit} className="login-form">
//         <div className="form-group">
//           <label htmlFor="email">Email :</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             autoComplete="email"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe :</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             autoComplete="current-password"
//           />
//         </div>
//         <button type="submit" className="submit-button" disabled={isSubmitting}>
//           {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
//         </button>
//       </form>
//       <p className="register-hint">
//         Pas encore de compte ? Contactez votre administrateur.
//       </p>
//       {/* NOUVEAU BOUTON POUR L'ENREGISTREMENT ADMIN CLIENT */}
//       <div className="register-admin-client-section">
//         <p>Vous êtes un nouvel administrateur client ?</p>
//         <Link to="/register-admin-client" className="register-admin-button">
//           S'enregistrer comme Admin Client
//         </Link>
//       </div>
//     </div>
//   );
// }

// export default LoginPage;




// // frontend/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import axios from 'axios';
// import './LoginPage.css';

// function LoginPage({ onLoginSuccess }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Tentative de soumission du formulaire de connexion.");

//     setError('');
//     setSuccess('');
//     setMessage('');
//     setIsSubmitting(true);

//     // --- DEBOGAGE : Point d'arrêt 1 ---
//     debugger; 

//     try {
//       const response = await axios.post('http://localhost:5001/api/auth/login', {
//         email,
//         password,
//       });

//       // --- DEBOGAGE : Point d'arrêt 2 (si succès) ---
//       debugger; 
//       console.log('Connexion réussie:', response.data);
//       const { token, role, id } = response.data;

//       localStorage.setItem('userToken', token);
//       localStorage.setItem('userRole', role);
//       localStorage.setItem('userId', id);

//       setSuccess('Connexion réussie ! Redirection...');
//       onLoginSuccess(role);
//     } catch (err) {
//       // --- DEBOGAGE : Point d'arrêt 3 (si erreur) ---
//       debugger; 
//       console.error('Erreur de connexion:', err);
//       if (err.response) {
//         setError(err.response.data.message || 'Erreur lors de la connexion.');
//       } else if (err.request) {
//         setError('Impossible de se connecter au serveur. Le backend est-il démarré et accessible ?');
//       } else {
//         setError('Erreur inattendue lors de la connexion.');
//       }
//     } finally {
//       // --- DEBOGAGE : Point d'arrêt 4 (toujours exécuté) ---
//       debugger; 
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="login-page-container">
//       <h2>Connexion</h2>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}
//       {message && <p className="info-message">{message}</p>}
//       <form onSubmit={handleSubmit} className="login-form">
//         <div className="form-group">
//           <label htmlFor="email">Email :</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             autoComplete="email"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe :</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             autoComplete="current-password"
//           />
//         </div>
//         <button type="submit" className="submit-button" disabled={isSubmitting}>
//           {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
//         </button>
//       </form>
//       <p className="register-hint">
//         Pas encore de compte ? Contactez votre administrateur.
//       </p>
//     </div>
//   );
// }

// export default LoginPage;










// // frontend/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import axios from 'axios'; // Assure-toi d'avoir axios installé: npm install axios
// import './LoginPage.css'; // Pour les styles spécifiques à la page de login

// function LoginPage({ onLoginSuccess }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Tentative de soumission du formulaire de connexion."); 
//     setMessage('');
//     setIsSubmitting(true);
//     setError(''); // Réinitialise les messages d'erreur
//     setSuccess(''); // Réinitialise les messages de succès

//     try {
//       const response = await axios.post('http://localhost:5001/api/auth/login', {
//         email,
//         password,
//       });

//       console.log('Connexion réussie:', response.data);
//       const { token, role, userId } = response.data;

//       // Stocker le token et le rôle dans le localStorage
//       localStorage.setItem('userToken', token);
//       localStorage.setItem('userRole', role);
//       localStorage.setItem('userId', userId); // Si tu en as besoin côté frontend

//       setSuccess('Connexion réussie ! Redirection...');
//       onLoginSuccess(role); // Appelle la fonction de rappel pour mettre à jour l'état de l'App
//     } catch (err) {
//       console.error('Erreur de connexion:', err);
//       if (err.response) {
//         // Le serveur a répondu avec un statut d'erreur (4xx ou 5xx)
//         setError(err.response.data.message || 'Erreur lors de la connexion.');
//       } else if (err.request) {
//         // La requête a été faite mais aucune réponse n'a été reçue (ex: API non démarrée)
//         setError('Impossible de se connecter au serveur. Le backend est-il démarré ?');
//       } else {
//         // Autre chose s'est produite lors de la configuration de la requête
//         setError('Erreur inattendue lors de la connexion.');
//       }
//     }
//   };

//   return (
//     <div className="login-page-container">
//       <h2>Connexion</h2>
//       {error && <p className="error-message">{error}</p>}
//       {success && <p className="success-message">{success}</p>}
//       <form onSubmit={handleSubmit} className="login-form">
//         <div className="form-group">
//           <label htmlFor="email">Email :</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe :</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//         </div>
//         <button type="submit" className="submit-button">Se connecter</button>
//       </form>
//       <p className="register-hint">
//         Pas encore de compte ? Contactez votre administrateur.
//         {/* Plus tard, on pourra ajouter un bouton "S'inscrire" ici si on a une route d'inscription publique */}
//       </p>
//     </div>
//   );
// }

// export default LoginPage;