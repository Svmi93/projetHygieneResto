// frontend/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
import EmployeeDashboardPage from './pages/EmployerDashboardPage';
import SuperAdminDashboardPage from './pages/AdminDashboardPage';
import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './components/HomePage';
import Confidentialite from './pages/Confidentialite';



import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);


    const handleAdminClientRegistered = (newAdminClient) => {
        console.log('Nouveau client administrateur enregistré :', newAdminClient);
        navigate('/login', { replace: true });
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const openLoginForm = () => {
        navigate('/login', { replace: true });
    };

    const closeLoginForm = () => {
        navigate('/', { replace: true });
    };

    const openRegisterForm = () => {
        navigate('/register-admin-client', { replace: true });
    };

    const closeRegisterForm = () => {
        navigate('/', { replace: true });
    };

    if (authLoading) {
        return <div className="loading-screen">Chargement de l'authentification...</div>;
    }

    const getDashboardPath = (role) => {
        switch (role) {
            case 'admin_client':
                return '/admin-client-dashboard';
            case 'employer':
                return '/employee-dashboard';
            case 'super_admin':
                return '/super-admin-dashboard';
            default:
                return '/';
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="logo">
                    <Link to="/" aria-label="Retour à la page d'accueil">
                        <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
                    </Link>
                </div>
                <nav className="main-nav">
                    {isAuthenticated ? (
                        <div className="auth-info-and-buttons">
                            {user && (
                                <span className="user-greeting">
                                    Bonjour, {user.prenom} {user.nom} !
                                </span>
                            )}
                            <Link to={getDashboardPath(user?.role)} className="nav-button dashboard-button">
                                Tableau de bord
                            </Link>
                            <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
                            <button onClick={handleLogout} className="logout-button">Déconnexion</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button onClick={openLoginForm} className="nav-button">
                                <span></span><span></span><span></span><span></span>Connexion
                            </button>
                            <button onClick={openRegisterForm} className="nav-button">
                                <span></span><span></span><span></span><span></span>Enregistrer un nouveau compte
                            </button>
                        </div>
                    )}
                </nav>
            <div className={`burger ${isOpen ? "open" : ""}`}onClick={() => setIsOpen(!isOpen)}>
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div className={`mobile-menu ${isOpen ? "active" : ""}`}>
  {isAuthenticated ? (
    <>
      <span className="user-greeting">Bonjour, {user?.prenom}</span>
      <Link to={getDashboardPath(user?.role)} onClick={() => setIsOpen(false)}>
        Tableau de bord
      </Link>
      <Link to="/temperature-records" onClick={() => setIsOpen(false)}>
        Relevés de Température
      </Link>
      <button onClick={() => { handleLogout(); setIsOpen(false); }}>
        Déconnexion
      </button>
    </>
  ) : (
    <>
      <button onClick={() => { openLoginForm(); setIsOpen(false); }}>
        Connexion
      </button>
      <button onClick={() => { openRegisterForm(); setIsOpen(false); }}>
        Enregistrer un nouveau compte
      </button>
    </>
  )}
</div>


            </header>
        

            <main>
                <Routes>
                    <Route
                        path="/"
                        element={<HomePage isAuthenticated={isAuthenticated} user={user} getDashboardPath={getDashboardPath} />}
                    />
                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                <Navigate to={getDashboardPath(user?.role)} replace />
                            ) : (
                                <LoginPage onCancel={closeLoginForm} />
                            )
                        }
                    />
                    <Route
                        path="/register-admin-client"
                        element={
                            isAuthenticated ? (
                                <Navigate to={getDashboardPath(user?.role)} replace />
                            ) : (
                                <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />
                            )
                        }
                    />
                    <Route path="/Confidentialite" element={<Confidentialite />} />
                    <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
                    <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
                    <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
                    <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />
                    <Route path="*" element={<div>404 - Page non trouvée</div>} />
                </Routes>
            </main>
            <section className="end-page">
                <footer className="App-footer bg-gray-800 text-white py-6 mt-8">
                    <div className="down container text-center text-sm">
                        <section className="bg-white shadow-sm py-4">
                            <div className="container-flex flex-col md:flex-row justify-between items-center">
                                <div className="menubar-nav-href flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 text-sm font-medium">
                                    <a href="/fonctionnalites.html" className="text-gray-700 hover:text-gray-900">Fonctionnalités</a>
                                    <a href="/secteur.html" className="text-gray-700 hover:text-gray-900">Secteur</a>
                                    <a href="/boutique.html" className="text-gray-700 hover:text-gray-900">Boutique</a>
                                    <a href="/formation-haccp.html" className="text-gray-700 hover:text-gray-900">Formation HACCP</a>
                                    <a href="/blog.html" className="text-gray-700 hover:text-white">Blog</a>
                                </div>
                            </div>
                        </section>
                        <div className="mt-2">
                            <Link to="/Confidentialite" className="text-gray-400 hover:text-white mx-2">Avis de confidentialité</Link> |
                            <a href="/conditions-generales-utilisation.html" className="text-gray-400 hover:text-white mx-2">Conditions générales d’utilisation</a> |
                            <a href="/faq.html" className="text-gray-400 hover:text-white mx-2">FAQ</a> |
                            <a href="/mentions-legales.html" className="text-gray-400 hover:text-white mx-2">Mentions légales</a> |
                            <a href="/contactez-nous.html" className="text-gray-400 hover:text-white mx-2">Contactez-nous</a> |
                            <a href="/politique-de-cookies.html" className="text-gray-400 hover:text-white mx-2">Politique de cookies</a>
                        </div>
                        <p>&copy; 2024 Votre Application d'Hygiène et Sécurité Alimentaire. Tous droits réservés.</p>
                    </div>
                </footer>
            </section>
        </div>
    );
}

export default App;

















  