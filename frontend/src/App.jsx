// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
import LoginPage from './pages/LoginPage'; // On va créer ce composant
import './App.css'; // Pour les styles globaux
import './components/Header.css'; // Pour les styles du header

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // État pour savoir si l'utilisateur est connecté
  const [userRole, setUserRole] = useState(null); // Pour stocker le rôle de l'utilisateur

  // Fonction pour gérer la connexion réussie
  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsLoginModalOpen(false); // Ferme la modale après connexion
    // Optionnel: stocker le token et le rôle dans le localStorage pour persistance
    // localStorage.setItem('userToken', token);
    // localStorage.setItem('userRole', role);
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    // localStorage.removeItem('userToken');
    // localStorage.removeItem('userRole');
    // Redirection vers la page d'accueil ou de connexion si nécessaire
  };

  return (
    <Router>
      <div className="app-container">
        {/* Header de l'application */}
        <header className="app-header">
          <nav>
            <Link to="/" className="app-title">HygieneResto App</Link>
            <div className="nav-buttons">
              {isLoggedIn ? (
                <>
                  <span>Bonjour {userRole}!</span>
                  <button onClick={handleLogout} className="logout-button">Déconnexion</button>
                  {userRole === 'super_admin' && (
                    <Link to="/admin-dashboard" className="admin-dashboard-link">Tableau de bord Admin</Link>
                  )}
                  {/* Ajouter d'autres liens spécifiques aux rôles si nécessaire */}
                </>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="login-button">
                  Connexion
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* Formulaire de connexion en tant que modale */}
        {isLoginModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-modal-button" onClick={() => setIsLoginModalOpen(false)}>X</button>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        )}

        {/* Routes de l'application */}
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<TemperatureRecordsPage />} />
            {/* Plus tard, on ajoutera une route pour le tableau de bord admin */}
            {userRole === 'super_admin' && (
                <Route path="/admin-dashboard" element={<div>Tableau de bord Super Admin (à construire)</div>} />
            )}
            {/* Si tu veux une page de login dédiée au lieu d'une modale */}
            {/* <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;