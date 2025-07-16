// frontend/src/context/AuthContext.jsx (Ne change rien, déjà correct)
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await AuthService.verifyToken();
                if (userData) {
                    setIsAuthenticated(true);
                    setUser(userData);
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                    AuthService.logout();
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du token:', error);
                setIsAuthenticated(false);
                setUser(null);
                AuthService.logout();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { user } = await AuthService.login(email, password);
            setIsAuthenticated(true);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            setIsAuthenticated(false);
            setUser(null);
            return { success: false, message: error.response?.data?.message || "Échec de la connexion" };
        }
    };

    const register = async (userData) => {
        try {
            const { user } = await AuthService.register(userData);
            setIsAuthenticated(true);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            setIsAuthenticated(false);
            setUser(null);
            return { success: false, message: error.response?.data?.message || "Échec de l'inscription" };
        }
    };

    const logout = () => {
        AuthService.logout();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login');
    };

    if (loading) {
        return <div>Chargement de l'authentification...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};








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