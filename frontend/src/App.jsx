// frontend/src/App.jsx
import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // <-- NOUVEAU
import './App.css';
import './components/Header.css';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Vérifier le statut de connexion au chargement de l'application
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []); // S'exécute une seule fois au montage du composant

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    // Optionnel: rediriger vers la page d'accueil ou de login
    // navigate('/');
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <nav>
            <Link to="/" className="app-title">HygieneResto App</Link>
            <div className="nav-buttons">
              {isLoggedIn ? (
                <>
                  <span>Bonjour {userRole}!</span>
                  {userRole === 'super_admin' && (
                    <Link to="/admin-dashboard" className="admin-dashboard-link">Tableau de bord Admin</Link>
                  )}
                  {/* Ajouter d'autres liens spécifiques aux rôles si nécessaire */}
                  <button onClick={handleLogout} className="logout-button">Déconnexion</button>
                </>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="login-button">
                  Connexion
                </button>
              )}
            </div>
          </nav>
        </header>

        {isLoginModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-modal-button" onClick={() => setIsLoginModalOpen(false)}>X</button>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        )}

        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<TemperatureRecordsPage />} />
            {/* Protéger la route AdminDashboardPage */}
            {/* On la rend accessible uniquement si userRole est super_admin */}
            {isLoggedIn && userRole === 'super_admin' ? (
              <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            ) : (
              // Rediriger vers la page d'accueil si pas super_admin (ou afficher un message d'accès refusé)
              // Pour un cas simple, on peut juste ne pas définir la route s'il n'est pas admin
              // L'AdminDashboardPage elle-même redirigera aussi si le role ne correspond pas
              <Route path="/admin-dashboard" element={<TemperatureRecordsPage />} /> // Redirige par défaut
            )}
            {/* Si tu veux une page de login dédiée au lieu d'une modale, décommente: */}
            {/* <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;