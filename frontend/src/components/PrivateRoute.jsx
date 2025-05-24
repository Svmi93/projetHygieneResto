// frontend/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles, isLoggedIn, userRole, children }) => {
  if (!isLoggedIn) {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    return <Navigate to="/" replace />; // Ou vers une page de connexion spécifique
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Si l'utilisateur est connecté mais n'a pas le bon rôle, rediriger vers une page d'accès refusé ou le dashboard
    return <Navigate to="/" replace />; // Ou vers un dashboard par défaut ou une page 403
  }

  // Si l'utilisateur est connecté et a le bon rôle, rendre les enfants (la page demandée)
  return children ? children : <Outlet />;
};

export default PrivateRoute;