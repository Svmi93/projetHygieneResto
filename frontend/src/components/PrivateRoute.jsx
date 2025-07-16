// frontend/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role: requiredRole, roles: requiredRolesArray }) => {
    const { isAuthenticated, user, loading: authLoading } = useAuth();

    if (authLoading) {
        // Afficher un écran de chargement pendant la vérification de l'authentification initiale
        return <div className="loading-screen">Chargement de l'authentification...</div>;
    }

    if (!isAuthenticated) {
        // Non authentifié, redirige vers la page de connexion
        return <Navigate to="/login" replace />;
    }

    // Si un rôle unique est spécifié et que le rôle de l'utilisateur ne correspond pas
    if (requiredRole && user?.role !== requiredRole) {
        console.warn(`Accès refusé. Rôle utilisateur: ${user?.role}, Rôle requis: ${requiredRole}`);
        // Redirige vers une page d'accès refusé ou le tableau de bord par défaut
        return <Navigate to="/access-denied" replace />; // Ou vers '/' ou '/login' si tu préfères
    }

    // Si une liste de rôles est spécifiée et que le rôle de l'utilisateur n'est pas inclus
    if (requiredRolesArray && !requiredRolesArray.includes(user?.role)) {
        console.warn(`Accès refusé. Rôle utilisateur: ${user?.role}, Rôles requis: ${requiredRolesArray.join(', ')}`);
        return <Navigate to="/access-denied" replace />; // Ou vers '/' ou '/login' si tu préfères
    }

    // Authentifié et rôle autorisé, affiche le contenu enfant
    return children;
};

export default PrivateRoute;
