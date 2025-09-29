// frontend/src/context/AuthContext_updated.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AuthService from '../services/AuthService';
import { setLogoutCallback } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    console.log("AuthContext: Initialisation de l'état user depuis localStorage.");
    try {
      const storedUser = localStorage.getItem('user');
      console.log("AuthContext: Initial user from localStorage:", storedUser);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("AuthContext: Erreur lors de la lecture de l'utilisateur depuis localStorage au démarrage:", error);
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('userToken');
    console.log("AuthContext: Initial token from localStorage:", storedToken);
    return storedToken;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {

    console.log("AuthContext: logout called");
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    console.log('Utilisateur déconnecté et données supprimées du localStorage.');

    console.log("AuthContext: Déclenchement de la déconnexion.");
    setUser(null);
    setToken(null);
    AuthService.logout(); // Appelle AuthService.logout pour nettoyer le localStorage
    console.log('AuthContext: Utilisateur déconnecté et données supprimées du localStorage.');
    // Optionnel: Rediriger l'utilisateur vers la page de connexion
    // window.location.href = '/login'; // Si tu utilises React Router, utilise useNavigate ici

  }, []);

  // Set logout callback for axios interceptor
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  const verifyToken = useCallback(async () => {
    const currentToken = localStorage.getItem('userToken');
    console.log("AuthContext: Token actuel dans localStorage:", currentToken);
    if (!currentToken) {
      console.log("AuthContext: No token found, setting user to null and loading false");
      setUser(null);
      setIsLoading(false); // FIN DU CHARGEMENT
      return false;
    }

    console.log("AuthContext: Token trouvé, tentative de vérification auprès du backend.");
    try {
      console.log("AuthContext: Envoi de la requête verifyToken avec token:", currentToken);
      const userData = await AuthService.verifyToken();

      console.log('AuthContext: Données utilisateur reçues après vérification du token:', userData);
      console.log("AuthContext: Réponse de verifyToken reçue:", userData);

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(currentToken);
      setError(null);
      console.log('AuthContext: Token vérifié avec succès. Utilisateur connecté:', userData.email);
      return true;
    } catch (err) {
      console.error('Erreur lors de la vérification du token:', err);
      if (err.response) {
        console.error('Détails de la réponse d\'erreur:', err.response.data);
      }
      setError(err.response?.data?.message || 'Erreur lors de la vérification de la session.');
      setUser(null);
      setToken(null);
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      setIsLoading(false);
      return false;
    } finally {
      console.log("AuthContext: Bloc finally de verifyToken atteint. Définition de isLoading à false.");
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    console.log("AuthContext: useEffect triggered, calling verifyToken.");
    verifyToken();
  }, []);


  const login = useCallback(async (email, password) => {

    setIsLoading(true);
    setError(null);

    console.log("AuthContext: login appelé.");
    setIsLoading(true); // Commence le chargement
    setError(null);     // Réinitialise les erreurs précédentes

    try {
      const response = await AuthService.login(email, password);

      console.log("AuthContext: Réponse de login reçue:", response);
      
      // Stocke le nouveau token et les informations utilisateur dans localStorage

      localStorage.setItem('userToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);
      console.log('AuthContext: Connexion réussie. Utilisateur:', response.user.email);
      return { success: true, user: response.user };
    } catch (err) {
      console.error('AuthContext: Erreur lors de la connexion:', err);
      setError(err.response?.data?.message || 'Échec de la connexion.');
      return { success: false, message: err.response?.data?.message || 'Échec de la connexion.' };
    } finally {

      console.log("AuthContext: Bloc finally de login atteint. Définition de isLoading à false.");
      setIsLoading(false); // FIN DU CHARGEMENT
    }
  }, []);

  // Fonction d'enregistrement
  const register = useCallback(async (userData) => { // userData sera un objet FormData
    console.log("AuthContext: register appelé.");
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.register(userData);
      console.log('AuthContext: Enregistrement réussi:', response);
      setError(null); // Clear any previous errors
      return { success: true, message: 'Enregistrement réussi', user: response.user };
    } catch (err) {
      console.error('AuthContext: Erreur lors de l\'enregistrement:', err);
      const errorMessage = err.response?.data?.message || 'Échec de l\'enregistrement.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      console.log("AuthContext: Bloc finally de register atteint. Définition de isLoading à false.");
      setIsLoading(false);
    }
  }, []);

  const isAuthenticated = !!user && !!token;

  const authContextValue = {
    user,
    token,
    isLoading,

    error,
    isAuthenticated,
    login,
    logout,
    verifyToken,
    register,

  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#333',
        backgroundColor: '#f0f2f5'
      }}>
        Chargement de l'authentification...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};










