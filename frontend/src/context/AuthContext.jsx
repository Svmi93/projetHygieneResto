// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
// --- LIGNE À CHANGER ICI ---
// AVANT : import { verifyToken } from '../services/AuthService';
// APRÈS :
import AuthService from '../services/AuthService'; // Importe l'objet AuthService par défaut
// --- FIN DE LA LIGNE À CHANGER ---
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    const token = AuthService.getToken(); // Utilisez AuthService.getToken()
    if (token) {
      try {
        const userData = await AuthService.verifyToken(); // Utilisez AuthService.verifyToken()
        if (userData) {
          setUser(userData);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          AuthService.logout();
          setUser(null);
        }
      } catch (error) {
        console.error('Échec de la vérification du token lors du chargement:', error);
        AuthService.logout();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user: loggedInUser } = await AuthService.login(email, password);
      setUser(loggedInUser);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      console.error('Erreur de connexion dans le contexte:', error);
      setUser(null);
      delete axiosInstance.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { token, user: registeredUser } = await AuthService.register(userData);
      setUser(registeredUser);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      console.error('Erreur d\'inscription dans le contexte:', error);
      setUser(null);
      delete axiosInstance.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const authContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

