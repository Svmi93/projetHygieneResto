// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AuthService from '../services/AuthService'; // Assurez-vous que le chemin est correct

// Crée le contexte d'authentification
const AuthContext = createContext(null);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};

// Fournisseur d'authentification
export const AuthProvider = ({ children }) => {
  // Initialise l'état utilisateur et le token à partir de localStorage
  // Cela permet de persister la session entre les rechargements de page
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Erreur lors de la lecture de l'utilisateur depuis localStorage au démarrage:", error);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('userToken'));
  const [isLoading, setIsLoading] = useState(true); // État de chargement initial pour la vérification du token
  const [error, setError] = useState(null); // État d'erreur pour les opérations d'authentification

  // Fonction de déconnexion
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken'); // Supprime le token du localStorage
    localStorage.removeItem('user');     // Supprime les infos utilisateur du localStorage
    console.log('Utilisateur déconnecté et données supprimées du localStorage.');
    // Optionnel: Rediriger l'utilisateur vers la page de connexion
    // window.location.href = '/login'; // Ou utiliser useNavigate si disponible dans votre App.jsx
  }, []);

  // Fonction pour vérifier le token auprès du backend
  const verifyToken = useCallback(async () => {
    const currentToken = localStorage.getItem('userToken'); // Récupère le token le plus récent
    if (!currentToken) {
      setUser(null); // Pas de token, pas d'utilisateur
      setIsLoading(false); // Termine le chargement
      return false;
    }

    try {
      // Appelle AuthService pour la vérification. AuthService.verifyToken renvoie l'objet 'user'.
      const userData = await AuthService.verifyToken();
      
      // Si la vérification réussit, met à jour l'état et le localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(currentToken); // Assure que le token est toujours à jour
      setError(null);
      console.log('Token vérifié avec succès. Utilisateur connecté:', userData.email);
      return true;
    } catch (err) {
      console.error('Erreur lors de la vérification du token:', err);
      setError(err.response?.data?.message || 'Erreur lors de la vérification de la session.');
      logout(); // Déconnecte l'utilisateur en cas d'erreur de vérification
      return false;
    } finally {
      setIsLoading(false); // Termine le chargement après la vérification
    }
  }, [logout]);

  // Effet pour vérifier le token au montage du composant (après un rechargement de page)
  // S'exécute une seule fois au chargement initial
  useEffect(() => {
    verifyToken(); // Appelle la fonction de vérification
  }, [verifyToken]); // Dépendance à verifyToken pour s'assurer qu'elle est stable

  // Fonction de connexion (appelée depuis les formulaires de login)
  const login = useCallback(async (email, password) => {
    setIsLoading(true); // Commence le chargement
    setError(null);     // Réinitialise les erreurs précédentes
    try {
      // Appelle AuthService pour la connexion. AuthService.login renvoie { token, user }.
      const response = await AuthService.login(email, password);
      
      // Stocke le nouveau token et les informations utilisateur dans localStorage
      localStorage.setItem('userToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Met à jour l'état du contexte
      setToken(response.token);
      setUser(response.user);
      console.log('Connexion réussie. Utilisateur:', response.user.email);
      return true;
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.response?.data?.message || 'Échec de la connexion.');
      return false;
    } finally {
      setIsLoading(false); // Termine le chargement
    }
  }, []);

  // Détermine si l'utilisateur est authentifié
  const isAuthenticated = !!user && !!token;

  // Valeurs fournies par le contexte
  const authContextValue = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated, // Nouvelle propriété pour une vérification facile
    login,
    logout,
    verifyToken,
  };

  // Affiche un écran de chargement tant que l'authentification n'est pas vérifiée
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '24px', 
        color: '#333',
        backgroundColor: '#f0f2f5' // Ajout d'un fond léger pour le contraste
      }}>
        Chargement de l'authentification...
      </div>
    );
  }

  // Si l'authentification est terminée (chargement = false), rend les enfants
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};










// // frontend/src/context/AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import AuthService from '../services/AuthService';
// import { useNavigate } from 'react-router-dom'; // `useNavigate` est toujours nécessaire pour d'autres usages dans le contexte si besoin.

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate(); // Garder pour d'autres usages si nécessaire, mais pas pour logout direct.

//     useEffect(() => {
//         const checkAuth = async () => {
//             try {
//                 const userData = await AuthService.verifyToken();
//                 if (userData) {
//                     setIsAuthenticated(true);
//                     setUser(userData);
//                 } else {
//                     // Si verifyToken ne renvoie pas de données (token invalide/absent),
//                     // on s'assure que l'état est "non authentifié" et on nettoie le localStorage.
//                     setIsAuthenticated(false);
//                     setUser(null);
//                     AuthService.logout(); // Ceci nettoie le localStorage, mais ne navigue PAS.
//                 }
//             } catch (error) {
//                 console.error('Erreur lors de la vérification du token:', error);
//                 // En cas d'erreur (réseau, token expiré/invalide), on s'assure de l'état "non authentifié" et on nettoie.
//                 setIsAuthenticated(false);
//                 setUser(null);
//                 AuthService.logout(); // Ceci nettoie le localStorage, mais ne navigue PAS.
//             } finally {
//                 setLoading(false); // Indique que la vérification initiale est terminée.
//             }
//         };

//         checkAuth();
//     }, []); // Le tableau de dépendances vide assure que cela ne s'exécute qu'une fois au montage.

//     const login = async (email, password) => {
//         try {
//             const { user } = await AuthService.login(email, password);
//             setIsAuthenticated(true);
//             setUser(user);
//             return { success: true, user };
//         } catch (error) {
//             console.error('Erreur de connexion:', error);
//             setIsAuthenticated(false);
//             setUser(null);
//             return { success: false, message: error.response?.data?.message || "Échec de la connexion" };
//         }
//     };

//     const register = async (userData) => {
//         try {
//             const response = await AuthService.register(userData); // Appelle le service d'enregistrement
//             // Après l'inscription, on ne connecte pas automatiquement l'utilisateur ici.
//             // La redirection vers la page de connexion est gérée par `App.jsx` ou `RegisterAdminClientPage`.
//             return { success: true, user: response.user }; // S'assurer de retourner l'objet user si l'API le renvoie
//         } catch (error) {
//             console.error('Erreur d\'inscription:', error);
//             return { success: false, message: error.response?.data?.message || "Échec de l'inscription" };
//         }
//     };

//     const logout = () => {
//         AuthService.logout(); // Nettoie le localStorage
//         setIsAuthenticated(false); // Met à jour l'état du contexte
//         setUser(null); // Réinitialise l'utilisateur
//         // >>>>> LIGNE SUPPRIMÉE : navigate('/login'); <<<<<
//         // La navigation après logout doit être gérée par le composant qui appelle logout (ex: App.jsx)
//     };

//     if (loading) {
//         return <div>Chargement de l'authentification...</div>;
//     }

//     return (
//         <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     return useContext(AuthContext);
// };








// // frontend/src/context/AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import AuthService from '../services/AuthService';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true); // Initialisez à true

//     // Fonction pour vérifier l'authentification au chargement de l'application
//     const checkAuth = async () => {
//         try {
//             setLoading(true); // Commence le chargement
//             const userData = await AuthService.verifyToken();
//             if (userData) {
//                 setIsAuthenticated(true);
//                 setUser(userData.user); // Assurez-vous que userData.user contient les infos de l'utilisateur
//                 AuthService.setAuthHeader(userData.token); // Assurez-vous de configurer l'en-tête pour les requêtes futures
//             } else {
//                 setIsAuthenticated(false);
//                 setUser(null);
//                 AuthService.removeToken();
//             }
//         } catch (error) {
//             console.error('Erreur lors de la vérification du token:', error);
//             setIsAuthenticated(false);
//             setUser(null);
//             AuthService.removeToken();
//         } finally {
//             setLoading(false); // Termine le chargement
//         }
//     };

//     // Effectue la vérification au premier rendu du composant
//     useEffect(() => {
//         checkAuth();
//     }, []); // Dépendance vide pour ne s'exécuter qu'une seule fois au montage

//     const login = async (email, password) => {
//         try {
//             const data = await AuthService.login(email, password);
//             if (data.token) {
//                 localStorage.setItem('token', data.token);
//                 setIsAuthenticated(true);
//                 setUser(data.user);
//                 AuthService.setAuthHeader(data.token);
//                 return { success: true, user: data.user }; // Retourne l'utilisateur en cas de succès
//             }
//             return { success: false, message: data.message || "Login failed" };
//         } catch (error) {
//             console.error('Erreur de connexion:', error);
//             return { success: false, message: error.response?.data?.message || 'Erreur de connexion' };
//         }
//     };

//     const logout = () => {
//         setIsAuthenticated(false);
//         setUser(null);
//         AuthService.removeToken();
//     };

//     const register = async (userData) => {
//         try {
//             const data = await AuthService.register(userData);
//             return { success: true, message: data.message };
//         } catch (error) {
//             console.error('Erreur d\'inscription:', error);
//             return { success: false, message: error.response?.data?.message || 'Erreur d\'inscription' };
//         }
//     };

//     return (
//         <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, register, checkAuth }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);