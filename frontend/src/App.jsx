// frontend/src/App.jsx
    import React, { useState, useEffect } from 'react';
    import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
    import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
    import LoginPage from './pages/LoginPage';
    import AdminDashboardPage from './pages/AdminDashboardPage'; // For super_admin
    import AdminClientDashboardPage from './pages/AdminClientDashboardPage'; // For admin_client
    import EmployeeDashboardPage from './pages/EmployeeDashboardPage'; // CHANGED: Renommé de ClientDashboardPage

    import './App.css';
    import './components/Header.css';

    function App() {
      const navigate = useNavigate();
      const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [userRole, setUserRole] = useState(null);

      useEffect(() => {
        const token = localStorage.getItem('userToken');
        const role = localStorage.getItem('userRole');
        if (token && role) {
          setIsLoggedIn(true);
          setUserRole(role);
          if (role === 'super_admin') {
            navigate('/admin-dashboard');
          } else if (role === 'admin_client') {
            navigate('/admin-client-dashboard');
          } else if (role === 'employer') { // CHANGED: 'client' en 'employer'
            navigate('/employee-dashboard'); // CHANGED: /client-dashboard en /employee-dashboard
          }
        }
      }, [navigate]);

      const handleLoginSuccess = (role) => {
        setIsLoggedIn(true);
        setUserRole(role);
        setIsLoginModalOpen(false);
        if (role === 'super_admin') {
          navigate('/admin-dashboard');
        } else if (role === 'admin_client') {
          navigate('/admin-client-dashboard');
        } else if (role === 'employer') { // CHANGED: 'client' en 'employer'
          navigate('/employee-dashboard'); // CHANGED: /client-dashboard en /employee-dashboard
        } else {
          navigate('/');
        }
      };

      const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        navigate('/');
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
                    {userRole === 'employer' && ( // CHANGED: 'client' en 'employer'
                      <Link to="/employee-dashboard" className="employee-dashboard-link">Mon Tableau de bord Employé</Link> // CHANGED: 'Client' en 'Employé'
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
              <Route path="/" element={<TemperatureRecordsPage />} />
              <Route path="/admin-dashboard" element={isLoggedIn && userRole === 'super_admin' ? <AdminDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/admin-client-dashboard" element={isLoggedIn && userRole === 'admin_client' ? <AdminClientDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/employee-dashboard" element={isLoggedIn && userRole === 'employer' ? <EmployeeDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} /> {/* CHANGED */}
              <Route path="*" element={<h1>404 - Page non trouvée</h1>} />
            </Routes>
          </main>
        </div>
      );
    }

    const AppWrapper = () => (
        <Router>
            <App />
        </Router>
    );

    export default AppWrapper;
    