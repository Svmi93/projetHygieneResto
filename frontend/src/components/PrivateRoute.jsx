import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, role, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // 1) Pendant la vérification du token
  if (isLoading) {
    return <div className="loading-screen">Chargement de l'authentification...</div>;
  }

  // 2) Pas connecté -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3) Contrôle des rôles (role = string | roles = array)
  const allowedRoles = roles || (role ? [role] : null);
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />; // adapte si tu as une page /access-denied
  }

  // 4) OK
  return children;
};

export default PrivateRoute;
