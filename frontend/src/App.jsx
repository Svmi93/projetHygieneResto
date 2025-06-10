// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Retiré useNavigate car non utilisé directement pour les redirections immédiates
import LoginPage from './pages/LoginPage'; // Importé comme composant de formulaire
import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
import EmployeeDashboardPage from './pages/EmployerDashboardPage';
import SuperAdminDashboardPage from './pages/AdminDashboardPage';
import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
import RegisterAdminClientPage from './pages/RegisterAdminClientPage'; // Importé comme composant de formulaire
import PrivateRoute from './components/PrivateRoute';
import HomePage from './components/HomePage'; // Importez votre composant HomePage
import './App.css'; // Styles globaux pour l'application

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false); // Nouvel état pour contrôler l'affichage du formulaire de connexion
  const [showRegisterForm, setShowRegisterForm] = useState(false); // Nouvel état pour contrôler l'affichage du formulaire d'enregistrement

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setShowLoginForm(false); // Ferme le formulaire de connexion après succès
    // Redirection basée sur le rôle après connexion
    switch (role) {
      case 'admin_client':
        window.location.href = '/admin-client-dashboard';
        break;
      case 'employer':
        window.location.href = '/employee-dashboard';
        break;
      case 'super_admin':
        window.location.href = '/super-admin-dashboard';
        break;
      default:
        window.location.href = '/';
    }
  };

  const handleAdminClientRegistered = (newAdminClient) => {
    // Message de succès (vous pouvez utiliser une modale ici)
    alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
    console.log('Nouvel Admin Client enregistré:', newAdminClient);
    setShowRegisterForm(false); // Ferme le formulaire d'enregistrement
    setShowLoginForm(true); // Ouvre le formulaire de connexion pour qu'il puisse se connecter
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('clientId');
    setIsAuthenticated(false);
    setUserRole(null);
    window.location.href = '/'; // Redirige vers la page de connexion (qui affichera le bouton de connexion)
  };

  // Fonctions pour ouvrir/fermer les formulaires
  const openLoginForm = () => {
    setShowLoginForm(true);
    setShowRegisterForm(false); // S'assurer que l'autre formulaire est fermé
  };

  const closeLoginForm = () => {
    setShowLoginForm(false);
  };

  const openRegisterForm = () => {
    setShowRegisterForm(true);
    setShowLoginForm(false); // S'assurer que l'autre formulaire est fermé
  };

  const closeRegisterForm = () => {
    setShowRegisterForm(false);
  };

  return (
    <Router>
      <div className="App">
        
        <header className="App-header">
          <div className="logo"><img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" /></div>
          <nav className="main-nav">
             
            {/* Boutons visibles si l'utilisateur n'est PAS authentifié */}
            
            {!isAuthenticated ? (
              <div className="auth-buttons"> {/* Conteneur pour les boutons à droite */}
                <button onClick={openLoginForm} className="nav-button">Connexion</button>
                <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
              </div>
            ) : (
              // Boutons/Liens visibles si l'utilisateur EST authentifié
              <div className="dashboard-nav"> {/* Conteneur pour les liens de dashboard */}
                {userRole === 'admin_client' && (
                  <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
                )}
                {userRole === 'employer' && (
                  <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
                )}
                {userRole === 'super_admin' && (
                  <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
                )}
                <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
                <button onClick={handleLogout} className="logout-button">Déconnexion</button>
              </div>
            )}
            
          </nav>
        </header>
        
        <main>
          <Routes>
            {/* La route par défaut affichera les formulaires si non authentifié, ou le dashboard */}
            <Route path="/" element={
              isAuthenticated ? (
                userRole === 'admin_client' ? <AdminClientDashboardPage /> :
                userRole === 'employer' ? <EmployeeDashboardPage /> :
                userRole === 'super_admin' ? <SuperAdminDashboardPage /> :
                <div className="landing-page-content">Bienvenue! Veuillez vous connecter ou vous enregistrer.</div>
              ) : (
                // Affichage conditionnel des formulaires de connexion/enregistrement
                <div className="auth-forms-container">
                  {showLoginForm && <LoginPage onLoginSuccess={handleLoginSuccess} onCancel={closeLoginForm} />}
                  {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />}
                  {/* Message par défaut si aucun formulaire n'est ouvert */}
                  {!showLoginForm && !showRegisterForm && (
                    <div className="welcome-message">
                      <h2>Bienvenue sur l'Application de Gestion d'Hygiène!</h2>
                      <p>Veuillez vous connecter ou enregistrer un nouveau compte pour commencer.</p>
                      <p>Utilisez les boutons en haut à droite pour accéder aux formulaires.</p>
                    </div>
                  )}
                  
                </div>
                
              )
            } />
            

            {/* Routes protégées qui nécessitent une authentification et un rôle spécifique */}
            <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
            <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
            <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
            <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

            {/* Redirection pour les anciennes routes de connexion/enregistrement, si l'utilisateur les tape manuellement */}
            <Route path="/login" element={<div className="redirect-message">Redirection vers la page d'accueil pour connexion...</div>} />
            <Route path="/register-admin-client" element={<div className="redirect-message">Redirection vers la page d'accueil pour enregistrement...</div>} />

          </Routes>
          <HomePage /> {/* Ceci rendra votre page d'accueil */}
        </main>
      </div>
    </Router>
  );
}

export default App;









// // frontend/src/App.jsx
    // import React, { useState, useEffect } from 'react';
    // import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
    // import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
    // import LoginPage from './pages/LoginPage';
    // import AdminDashboardPage from './pages/AdminDashboardPage'; // Importez AdminDashboardPage
    // import AdminClientDashboardPage from './pages/AdminClientDashboardPage'; // Importez AdminClientDashboardPage
    // import EmployerDashboardPage from './pages/EmployerDashboardPage'; // Importez EmployeeDashboardPage

    // import './App.css';
    // import './components/Header.css';

    // function App() {
    //   const navigate = useNavigate();
    //   const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    //   const [isLoggedIn, setIsLoggedIn] = useState(false);
    //   const [userRole, setUserRole] = useState(null);

    //   useEffect(() => {
    //     const token = localStorage.getItem('userToken');
    //     const role = localStorage.getItem('userRole');
    //     if (token && role) {
    //       setIsLoggedIn(true);
    //       setUserRole(role);
    //       // Redirection basée sur le rôle après le rafraîchissement
    //       if (role === 'super_admin') {
    //         navigate('/admin-dashboard');
    //       } else if (role === 'admin_client') {
    //         navigate('/admin-client-dashboard');
    //       } else if (role === 'employer') {
    //         navigate('/employer-dashboard');
    //       }
    //     }
    //   }, [navigate]);

    //   const handleLoginSuccess = (role) => {
    //     setIsLoggedIn(true);
    //     setUserRole(role);
    //     setIsLoginModalOpen(false);
    //     // Redirection basée sur le rôle après la connexion réussie
    //     if (role === 'super_admin') {
    //       navigate('/admin-dashboard');
    //     } else if (role === 'admin_client') {
    //       navigate('/admin-client-dashboard');
    //     } else if (role === 'employer') {
    //       navigate('/employer-dashboard');
    //     } else {
    //       navigate('/'); // Fallback par défaut
    //     }
    //   };

    //   const handleLogout = () => {
    //     setIsLoggedIn(false);
    //     setUserRole(null);
    //     localStorage.removeItem('userToken');
    //     localStorage.removeItem('userRole');
    //     localStorage.removeItem('userId');
    //     navigate('/'); // Rediriger vers la page d'accueil/publique après la déconnexion
    //   };

    //   return (
    //     <div className="app-container">
    //       <header className="app-header">
    //         <nav>
    //           <Link to="/" className="app-title">HygieneResto App</Link>
    //           <div className="nav-buttons">
    //             {isLoggedIn ? (
    //               <>
    //                 <span>Bonjour {userRole}!</span>
    //                 {userRole === 'super_admin' && (
    //                   <Link to="/admin-dashboard" className="admin-dashboard-link">Tableau de bord Super Admin</Link>
    //                 )}
    //                 {userRole === 'admin_client' && (
    //                   <Link to="/admin-client-dashboard" className="admin-client-dashboard-link">Tableau de bord Admin Client</Link>
    //                 )}
    //                 {userRole === 'employer' && (
    //                   <Link to="/employer-dashboard" className="employer-dashboard-link">Mon Tableau de bord Employé</Link>
    //                 )}
    //                 <button onClick={handleLogout} className="logout-button">Déconnexion</button>
    //               </>
    //             ) : (
    //               <button onClick={() => setIsLoginModalOpen(true)} className="login-button">
    //                 Connexion
    //               </button>
    //             )}
    //           </div>
    //         </nav>
    //       </header>

    //       {isLoginModalOpen && (
    //         <div className="modal-overlay">
    //           <div className="modal-content">
    //             <button className="close-modal-button" onClick={() => setIsLoginModalOpen(false)}>X</button>
    //             <LoginPage onLoginSuccess={handleLoginSuccess} />
    //           </div>
    //         </div>
    //       )}

    //       <main className="app-main-content">
    //         <Routes>
    //           <Route path="/" element={<TemperatureRecordsPage />} /> {/* Page publique ou non authentifiée */}
    //           <Route path="/admin-dashboard" element={isLoggedIn && userRole === 'super_admin' ? <AdminDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
    //           <Route path="/admin-client-dashboard" element={isLoggedIn && userRole === 'admin_client' ? <AdminClientDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
    //           <Route path="/employer-dashboard" element={isLoggedIn && userRole === 'employer' ? <EmployerDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
    //           {/* Fallback pour toute autre page - peut être une page 404 */}
    //           <Route path="*" element={<h1>404 - Page non trouvée</h1>} />
    //         </Routes>
    //       </main>
    //     </div>
    //   );
    // }

    // // Wrapper pour Router pour permettre l'utilisation de useNavigate dans App
    // const AppWrapper = () => (
    //     <Router>
    //         <App />
    //     </Router>
    // );

    // export default AppWrapper;
    





// // frontend/src/App.jsx
//     import React, { useState, useEffect } from 'react';
//     import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
//     import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
//     import LoginPage from './pages/LoginPage';
//     import AdminDashboardPage from './pages/AdminDashboardPage'; // For super_admin
//     import AdminClientDashboardPage from './pages/AdminClientDashboardPage'; // For admin_client
//     import EmployeeDashboardPage from './pages/EmployeeDashboardPage'; // CHANGED: Renommé de ClientDashboardPage

//     import './App.css';
//     import './components/Header.css';

//     function App() {
//       const navigate = useNavigate();
//       const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
//       const [isLoggedIn, setIsLoggedIn] = useState(false);
//       const [userRole, setUserRole] = useState(null);

//       useEffect(() => {
//         const token = localStorage.getItem('userToken');
//         const role = localStorage.getItem('userRole');
//         if (token && role) {
//           setIsLoggedIn(true);
//           setUserRole(role);
//           if (role === 'super_admin') {
//             navigate('/admin-dashboard');
//           } else if (role === 'admin_client') {
//             navigate('/admin-client-dashboard');
//           } else if (role === 'employer') { // CHANGED: 'client' en 'employer'
//             navigate('/employee-dashboard'); // CHANGED: /client-dashboard en /employee-dashboard
//           }
//         }
//       }, [navigate]);

//       const handleLoginSuccess = (role) => {
//         setIsLoggedIn(true);
//         setUserRole(role);
//         setIsLoginModalOpen(false);
//         if (role === 'super_admin') {
//           navigate('/admin-dashboard');
//         } else if (role === 'admin_client') {
//           navigate('/admin-client-dashboard');
//         } else if (role === 'employer') { // CHANGED: 'client' en 'employer'
//           navigate('/employee-dashboard'); // CHANGED: /client-dashboard en /employee-dashboard
//         } else {
//           navigate('/');
//         }
//       };

//       const handleLogout = () => {
//         setIsLoggedIn(false);
//         setUserRole(null);
//         localStorage.removeItem('userToken');
//         localStorage.removeItem('userRole');
//         localStorage.removeItem('userId');
//         navigate('/');
//       };

//       return (
//         <div className="app-container">
//           <header className="app-header">
//             <nav>
//               <Link to="/" className="app-title">HygieneResto App</Link>
//               <div className="nav-buttons">
//                 {isLoggedIn ? (
//                   <>
//                     <span>Bonjour {userRole}!</span>
//                     {userRole === 'super_admin' && (
//                       <Link to="/admin-dashboard" className="admin-dashboard-link">Tableau de bord Super Admin</Link>
//                     )}
//                     {userRole === 'admin_client' && (
//                       <Link to="/admin-client-dashboard" className="admin-client-dashboard-link">Tableau de bord Admin Client</Link>
//                     )}
//                     {userRole === 'employer' && ( // CHANGED: 'client' en 'employer'
//                       <Link to="/employee-dashboard" className="employee-dashboard-link">Mon Tableau de bord Employé</Link> // CHANGED: 'Client' en 'Employé'
//                     )}
//                     <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//                   </>
//                 ) : (
//                   <button onClick={() => setIsLoginModalOpen(true)} className="login-button">
//                     Connexion
//                   </button>
//                 )}
//               </div>
//             </nav>
//           </header>

//           {isLoginModalOpen && (
//             <div className="modal-overlay">
//               <div className="modal-content">
//                 <button className="close-modal-button" onClick={() => setIsLoginModalOpen(false)}>X</button>
//                 <LoginPage onLoginSuccess={handleLoginSuccess} />
//               </div>
//             </div>
//           )}

//           <main className="app-main-content">
//             <Routes>
//               <Route path="/" element={<TemperatureRecordsPage />} />
//               <Route path="/admin-dashboard" element={isLoggedIn && userRole === 'super_admin' ? <AdminDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
//               <Route path="/admin-client-dashboard" element={isLoggedIn && userRole === 'admin_client' ? <AdminClientDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
//               <Route path="/employee-dashboard" element={isLoggedIn && userRole === 'employer' ? <EmployeeDashboardPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} /> {/* CHANGED */}
//               <Route path="*" element={<h1>404 - Page non trouvée</h1>} />
//             </Routes>
//           </main>
//         </div>
//       );
//     }

//     const AppWrapper = () => (
//         <Router>
//             <App />
//         </Router>
//     );

//     export default AppWrapper;
    