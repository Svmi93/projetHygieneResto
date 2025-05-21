// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'; // Add useNavigate
import TemperatureRecordsPage from './pages/TemperatureRecordsPage'; // This will become the client's default dashboard eventually
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // For super_admin
import AdminClientDashboardPage from './pages/AdminClientDashboardPage'; // NEW: For admin_client
import ClientDashboardPage from './pages/ClientDashboardPage'; // NEW: For client

import './App.css';
import './components/Header.css';

function App() {
  const navigate = useNavigate(); // Initialize navigate
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
      // Optional: Redirect immediately after refresh if already logged in
      if (role === 'super_admin') {
        navigate('/admin-dashboard');
      } else if (role === 'admin_client') {
        navigate('/admin-client-dashboard');
      } else if (role === 'client') {
        navigate('/client-dashboard');
      }
    }
  }, [navigate]); // navigate as dependency

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsLoginModalOpen(false);
    // Redirect based on role after successful login
    if (role === 'super_admin') {
      navigate('/admin-dashboard');
    } else if (role === 'admin_client') {
      navigate('/admin-client-dashboard');
    } else if (role === 'client') {
      navigate('/client-dashboard');
    } else {
      navigate('/'); // Default fallback
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/'); // Redirect to home/public page after logout
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <nav>
          <Link to="/" className="app-title">HygieneResto App</Link>
          <div className="nav-buttons">
            {isLoggedIn ? (
              <>
                <span>Bonjour {userRole}!</span>
                {userRole === 'super_admin' && (
                  <Link to="/admin-dashboard" className="admin-dashboard-link">Tableau de bord Super Admin</Link>
                )}
                {userRole === 'admin_client' && (
                  <Link to="/admin-client-dashboard" className="admin-client-dashboard-link">Tableau de bord Admin Client</Link>
                )}
                {userRole === 'client' && (
                  <Link to="/client-dashboard" className="client-dashboard-link">Mon Tableau de bord Client</Link>
                )}
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
          <Route path="/" element={<TemperatureRecordsPage />} /> {/* Default public or unauthenticated page */}
          <Route path="/admin-dashboard" element={isLoggedIn && userRole === 'super_admin' ? <AdminDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/admin-client-dashboard" element={isLoggedIn && userRole === 'admin_client' ? <AdminClientDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} /> {/* NEW */}
          <Route path="/client-dashboard" element={isLoggedIn && userRole === 'client' ? <ClientDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} /> {/* NEW */}
          {/* Fallback for any other path - can be a 404 page */}
          <Route path="*" element={<h1>404 - Page non trouvée</h1>} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper for Router to allow useNavigate in App
const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;