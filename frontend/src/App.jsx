// frontend/src/App.jsx
import React, { useState, useEffect } from 'react'; // useState peut être retiré si showLoginForm/showRegisterForm sont supprimés
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Imports de vos pages et composants
import LoginPage from './pages/LoginPage';
import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
import EmployeeDashboardPage from './pages/EmployerDashboardPage';
import SuperAdminDashboardPage from './pages/AdminDashboardPage';
import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './components/HomePage'; // HomePage n'affichera plus les formulaires directement

import './App.css'; // Assurez-vous que cette ligne est présente

import { useAuth } from './context/AuthContext';

function App() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // CES ÉTATS SONT À RETIRER, car les routes géreront l'affichage des formulaires
    // const [showLoginForm, setShowLoginForm] = useState(false);
    // const [showRegisterForm, setShowRegisterForm] = useState(false);

    // CE useEffect EST À RETIRER COMPLETEMENT
    /*
    useEffect(() => {
        if (!authLoading && isAuthenticated && location.pathname === '/') {
            let targetPath = '/';
            switch (user?.role) {
                case 'admin_client':
                    targetPath = '/admin-client-dashboard';
                    break;
                case 'employer':
                    targetPath = '/employee-dashboard';
                    break;
                case 'super_admin':
                    targetPath = '/super-admin-dashboard';
                    break;
                default:
                    console.warn("Authenticated user with unrecognized role on home page.");
                    return;
            }
            if (targetPath !== '/' && location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
        }
    }, [isAuthenticated, user, authLoading, navigate, location.pathname]);
    */

    const handleAdminClientRegistered = (newAdminClient) => {
        // alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.'); // Utilisez une modale personnalisée au lieu d'alert
        console.log('Nouvel Admin Client enregistré:', newAdminClient);
        // Redirige directement vers la page de connexion après l'inscription réussie
        navigate('/login', { replace: true });
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true }); // Redirige vers la page d'accueil après la déconnexion
    };

    // CES FONCTIONS SONT À SIMPLIFIER
    const openLoginForm = () => {
        navigate('/login', { replace: true });
    };

    const closeLoginForm = () => {
        navigate('/', { replace: true }); // Redirige vers la page d'accueil si on ferme le formulaire de connexion
    };

    const openRegisterForm = () => {
        navigate('/register-admin-client', { replace: true });
    };

    const closeRegisterForm = () => {
        navigate('/', { replace: true }); // Redirige vers la page d'accueil si on ferme le formulaire d'inscription
    };

    if (authLoading) {
        return <div className="loading-screen">Chargement de l'authentification...</div>;
    }

    // Fonction utilitaire pour déterminer le chemin du tableau de bord par rôle
    const getDashboardPath = (role) => {
        switch (role) {
            case 'admin_client':
                return '/admin-client-dashboard';
            case 'employer':
                return '/employee-dashboard';
            case 'super_admin':
                return '/super-admin-dashboard';
            default:
                return '/'; // Fallback pour les rôles inconnus ou non définis
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="logo">
                    <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
                </div>
                <nav className="main-nav">
                    {!isAuthenticated ? (
                        <div className="auth-buttons">
                            <button onClick={openLoginForm} className="nav-button">Connexion</button>
                            <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
                        </div>
                    ) : (
                        <div className="dashboard-nav">
                            {user?.role === 'admin_client' && (
                                <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
                            )}
                            {user?.role === 'employer' && (
                                <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
                            )}
                            {user?.role === 'super_admin' && (
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
                    {/* Route pour la page d'accueil */}
                    <Route path="/" element={
                        isAuthenticated ? (
                            // Si authentifié, redirige vers le dashboard approprié
                            <Navigate to={getDashboardPath(user?.role)} replace />
                        ) : (
                            // Si non authentifié, affiche la HomePage statique
                            <HomePage /> // Ne passe plus de props de formulaire ici
                        )
                    } />

                    {/* Route pour la page de connexion */}
                    <Route path="/login" element={
                        isAuthenticated ? (
                            // Si authentifié, redirige vers le dashboard
                            <Navigate to={getDashboardPath(user?.role)} replace />
                        ) : (
                            // Si non authentifié, affiche le LoginPage
                            <LoginPage onCancel={closeLoginForm} />
                        )
                    } />

                    {/* Route pour la page d'enregistrement */}
                    <Route path="/register-admin-client" element={
                        isAuthenticated ? (
                            // Si authentifié, redirige vers le dashboard
                            <Navigate to={getDashboardPath(user?.role)} replace />
                        ) : (
                            // Si non authentifié, affiche le RegisterAdminClientPage
                            <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />
                        )
                    } />

                    {/* Routes protégées par rôle */}
                    <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
                    <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
                    <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
                    <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

                    {/* Route pour les chemins non trouvés - Optionnel */}
                    <Route path="*" element={<div>404 - Page non trouvée</div>} />
                </Routes>
            </main>
        </div>
    );
}

export default App;












// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

// // ... (vos imports de pages et composants)
// import LoginPage from './pages/LoginPage';
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage';
// import SuperAdminDashboardPage from './pages/AdminDashboardPage';
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage';

// import './App.css'; // Assurez-vous que cette ligne est présente

// import { useAuth } from './context/AuthContext';

// function App() {
//     const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [showLoginForm, setShowLoginForm] = useState(false);
//     const [showRegisterForm, setShowRegisterForm] = useState(false);

//     // Simplification du useEffect pour gérer la redirection depuis la page d'accueil principale
//     useEffect(() => {
//         if (!authLoading && isAuthenticated && location.pathname === '/') {
//             let targetPath = '/';
//             switch (user?.role) {
//                 case 'admin_client':
//                     targetPath = '/admin-client-dashboard';
//                     break;
//                 case 'employer':
//                     targetPath = '/employee-dashboard';
//                     break;
//                 case 'super_admin':
//                     targetPath = '/super-admin-dashboard';
//                     break;
//                 default:
//                     // Si le rôle n'est pas reconnu, on peut le laisser sur la page d'accueil ou gérer une page d'erreur
//                     console.warn("Authenticated user with unrecognized role on home page.");
//                     return; // Ne pas rediriger si le rôle est inconnu et déjà sur '/'
//             }
//             // Redirige uniquement si l'utilisateur est sur la page d'accueil et le chemin cible est différent
//             if (targetPath !== '/' && location.pathname !== targetPath) {
//                 navigate(targetPath, { replace: true });
//             }
//         }
//     }, [isAuthenticated, user, authLoading, navigate, location.pathname]);


//     const handleAdminClientRegistered = (newAdminClient) => {
//         alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//         console.log('Nouvel Admin Client enregistré:', newAdminClient);
//         setShowRegisterForm(false);
//         setShowLoginForm(true);
//         // Note: La navigation est gérée par les Routes ou par LoginPage/RegisterAdminClientPage
//         // Pas besoin de navigate ici directement pour la redirection vers le dashboard après inscription.
//         // On redirige vers /login pour afficher le formulaire de connexion.
//         navigate('/login', { replace: true });
//     };

//     const handleLogout = () => {
//         logout();
//         navigate('/', { replace: true }); // Redirige vers la page d'accueil après la déconnexion
//     };

//     const openLoginForm = () => {
//         setShowLoginForm(true);
//         setShowRegisterForm(false);
//         navigate('/login', { replace: true }); // Navigue vers /login pour que la route gère l'affichage
//     };

//     const closeLoginForm = () => {
//         setShowLoginForm(false);
//         // Ne navigue que si l'URL est actuellement /login
//         if (location.pathname === '/login') navigate('/', { replace: true });
//     };

//     const openRegisterForm = () => {
//         setShowRegisterForm(true);
//         setShowLoginForm(false);
//         navigate('/register-admin-client', { replace: true }); // Navigue vers /register-admin-client
//     };

//     const closeRegisterForm = () => {
//         setShowRegisterForm(false);
//         // Ne navigue que si l'URL est actuellement /register-admin-client
//         if (location.pathname === '/register-admin-client') navigate('/', { replace: true });
//     };

//     if (authLoading) {
//         return <div className="loading-screen">Chargement de l'authentification...</div>;
//     }

//     return (
//         <div className="App">
//             <header className="App-header">
//                 <div className="logo">
//                     <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//                 </div>
//                 <nav className="main-nav">
//                     {!isAuthenticated ? (
//                         <div className="auth-buttons">
//                             <button onClick={openLoginForm} className="nav-button">Connexion</button>
//                             <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//                         </div>
//                     ) : (
//                         <div className="dashboard-nav">
//                             {user?.role === 'admin_client' && (
//                                 <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//                             )}
//                             {user?.role === 'employer' && (
//                                 <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//                             )}
//                             {user?.role === 'super_admin' && (
//                                 <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//                             )}
//                             {/* Assurez-vous que cette route est accessible par les rôles appropriés */}
//                             <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//                             <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//                         </div>
//                     )}
//                 </nav>
//             </header>

//             <main>
//                 <Routes>
//                     {/* Route pour la page d'accueil */}
//                     <Route path="/" element={
//                         // Si authentifié, redirige vers le dashboard approprié
//                         isAuthenticated ? (
//                             <Navigate to={
//                                 user?.role === 'admin_client' ? '/admin-client-dashboard' :
//                                 user?.role === 'employer' ? '/employee-dashboard' :
//                                 user?.role === 'super_admin' ? '/super-admin-dashboard' :
//                                 '/' // Fallback si le rôle est inconnu
//                             } replace />
//                         ) : (
//                             // Si non authentifié, affiche la HomePage (qui peut contenir les formulaires)
//                             <HomePage showLoginForm={showLoginForm} showRegisterForm={showRegisterForm} onAdminClientRegistered={handleAdminClientRegistered} onCancelLogin={closeLoginForm} onCancelRegister={closeRegisterForm} />
//                         )
//                     } />

//                     {/* Routes pour les formulaires de connexion et d'inscription */}
//                     <Route path="/login" element={
//                         // Si authentifié, redirige vers le dashboard
//                         isAuthenticated ? (
//                             <Navigate to={
//                                 user?.role === 'admin_client' ? '/admin-client-dashboard' :
//                                 user?.role === 'employer' ? '/employee-dashboard' :
//                                 user?.role === 'super_admin' ? '/super-admin-dashboard' :
//                                 '/'
//                             } replace />
//                         ) : (
//                             // Si non authentifié, affiche le LoginPage
//                             <LoginPage onCancel={closeLoginForm} />
//                         )
//                     } />
//                     <Route path="/register-admin-client" element={
//                         isAuthenticated ? (
//                             <Navigate to={
//                                 user?.role === 'admin_client' ? '/admin-client-dashboard' :
//                                 user?.role === 'employer' ? '/employee-dashboard' :
//                                 user?.role === 'super_admin' ? '/super-admin-dashboard' :
//                                 '/'
//                             } replace />
//                         ) : (
//                             <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />
//                         )
//                     } />

//                     {/* Routes protégées par rôle */}
//                     <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//                     <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//                     <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//                     <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

//                     {/* Route pour les chemins non trouvés - Optionnel */}
//                     <Route path="*" element={<div>404 - Page non trouvée</div>} />
//                 </Routes>
//             </main>
//         </div>
//     );
// }

// export default App;







// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

// // ... (vos imports de pages et composants)
// import LoginPage from './pages/LoginPage'; // Assurez-vous d'importer toutes les pages nécessaires
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage';
// import SuperAdminDashboardPage from './pages/AdminDashboardPage';
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage'; // Supposons que HomePage est votre composant de page d'accueil
// // ...

// import { useAuth } from './context/AuthContext';
// import './App.css'; 

// function App() {
//     const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [showLoginForm, setShowLoginForm] = useState(false);
//     const [showRegisterForm, setShowRegisterForm] = useState(false);

//     // Ce useEffect gère la redirection si l'utilisateur arrive sur une page publique
//     // alors qu'il est déjà authentifié.
//     useEffect(() => {
//         if (!authLoading && isAuthenticated) {
//             // Liste des chemins publics ou de pré-connexion
//             const publicPaths = ['/', '/login', '/register-admin-client'];

//             // Vérifie si l'utilisateur est actuellement sur un chemin public
//             const isCurrentlyOnPublicPath = publicPaths.includes(location.pathname);

//             // Redirige si l'utilisateur est sur un chemin public ET qu'il n'est pas déjà sur un tableau de bord.
//             // La dernière partie de la condition est importante pour éviter de rediriger depuis un tableau de bord vers lui-même.
//             if (isCurrentlyOnPublicPath) {
//                 switch (user?.role) {
//                     case 'admin_client':
//                         if (location.pathname !== '/admin-client-dashboard') navigate('/admin-client-dashboard', { replace: true });
//                         break;
//                     case 'employer':
//                         if (location.pathname !== '/employee-dashboard') navigate('/employee-dashboard', { replace: true });
//                         break;
//                     case 'super_admin':
//                         if (location.pathname !== '/super-admin-dashboard') navigate('/super-admin-dashboard', { replace: true });
//                         break;
//                     default:
//                         // Si le rôle n'est pas reconnu, on peut le laisser sur la page actuelle ou rediriger vers une page générique.
//                         // Pour éviter une boucle, ne naviguez pas vers '/' ici si c'est déjà la page.
//                         if (location.pathname !== '/') navigate('/', { replace: true });
//                         console.warn("Authenticated user with unrecognized role tried to access a public path.");
//                         break;
//                 }
//             }
//         }
//     }, [isAuthenticated, user, authLoading, navigate, location.pathname]); // location.pathname est nécessaire pour redéclencher quand l'URL change

//     const handleAdminClientRegistered = (newAdminClient) => {
//         alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//         console.log('Nouvel Admin Client enregistré:', newAdminClient);
//         setShowRegisterForm(false);
//         setShowLoginForm(true);
//         // Pas de navigate ici, la logique de LoginPage ou RegisterAdminClientPage s'en chargera
//     };

//     const handleLogout = () => {
//         logout();
//         navigate('/', { replace: true }); // Redirige vers la page d'accueil après la déconnexion
//     };

//     const openLoginForm = () => {
//         setShowLoginForm(true);
//         setShowRegisterForm(false);
//         navigate('/login', { replace: true });
//     };

//     const closeLoginForm = () => {
//         setShowLoginForm(false);
//         if (location.pathname === '/login') navigate('/', { replace: true });
//     };

//     const openRegisterForm = () => {
//         setShowRegisterForm(true);
//         setShowLoginForm(false);
//         navigate('/register-admin-client', { replace: true });
//     };

//     const closeRegisterForm = () => {
//         setShowRegisterForm(false);
//         if (location.pathname === '/register-admin-client') navigate('/', { replace: true });
//     };

//     if (authLoading) {
//         return <div className="loading-screen">Chargement de l'authentification...</div>;
//     }

//     return (
//         <div className="App">
//             <header className="App-header">
//                 <div className="logo">
//                     <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//                 </div>
//                 <nav className="main-nav">
//                     {!isAuthenticated ? (
//                         <div className="auth-buttons">
//                             <button onClick={openLoginForm} className="nav-button">Connexion</button>
//                             <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//                         </div>
//                     ) : (
//                         <div className="dashboard-nav">
//                             {user?.role === 'admin_client' && (
//                                 <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//                             )}
//                             {user?.role === 'employer' && (
//                                 <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//                             )}
//                             {user?.role === 'super_admin' && (
//                                 <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//                             )}
//                             <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//                             <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//                         </div>
//                     )}
//                 </nav>
//             </header>

//             <main>
//                 <Routes>
//                     <Route path="/" element={
//                         !isAuthenticated ? (
//                             <HomePage showLoginForm={showLoginForm} showRegisterForm={showRegisterForm} onAdminClientRegistered={handleAdminClientRegistered} onCancelLogin={closeLoginForm} onCancelRegister={closeRegisterForm} />
//                         ) : (
//                             // Si déjà authentifié et sur la page d'accueil, on peut rediriger vers le dashboard
//                             // ou simplement afficher un message de bienvenue.
//                             // La redirection principale est gérée dans le useEffect ou après login.
//                             <HomePage /> // Peut afficher un message "Vous êtes connecté"
//                         )
//                     } />
//                     <Route path="/login" element={
//                         !isAuthenticated ? <LoginPage onCancel={closeLoginForm} /> : <Navigate to={
//                             user?.role === 'admin_client' ? '/admin-client-dashboard' :
//                             user?.role === 'employer' ? '/employee-dashboard' :
//                             user?.role === 'super_admin' ? '/super-admin-dashboard' :
//                             '/'
//                         } replace />
//                     } />
//                     <Route path="/register-admin-client" element={
//                         !isAuthenticated ? <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} /> : <Navigate to={
//                             user?.role === 'admin_client' ? '/admin-client-dashboard' :
//                             user?.role === 'employer' ? '/employee-dashboard' :
//                             user?.role === 'super_admin' ? '/super-admin-dashboard' :
//                             '/'
//                         } replace />
//                     } />

//                     <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//                     <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//                     <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//                     <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />
//                 </Routes>
//             </main>
//         </div>
//     );
// }

// export default App;








// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'; // Add useLocation

// import LoginPage from './pages/LoginPage';
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage';
// import SuperAdminDashboardPage from './pages/AdminDashboardPage';
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage';
// import './App.css';

// import { useAuth } from './context/AuthContext';

// function App() {
//   const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation(); // Get current location

//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [showRegisterForm, setShowRegisterForm] = useState(false);

//   useEffect(() => {
//     if (!authLoading) { // Ensure authentication state is determined
//       if (isAuthenticated) {
//         // Define paths that are considered "public" or pre-login
//         const publicPaths = ['/', '/login', '/register-admin-client'];

//         // Only redirect if the user is authenticated AND currently on a public/pre-login path
//         // AND not already on a dashboard path (to prevent navigating away from a dashboard)
//         const isCurrentlyOnPublicPath = publicPaths.includes(location.pathname);
//         const isAlreadyOnDashboard = location.pathname.includes('dashboard') || location.pathname.includes('records'); // Adjust as per your dashboard paths

//         if (isCurrentlyOnPublicPath && !isAlreadyOnDashboard) {
//           switch (user?.role) {
//             case 'admin_client':
//               navigate('/admin-client-dashboard', { replace: true });
//               break;
//             case 'employer':
//               navigate('/employee-dashboard', { replace: true });
//               break;
//             case 'super_admin':
//               navigate('/super-admin-dashboard', { replace: true });
//               break;
//             default:
//               // If role is unknown but authenticated, maybe redirect to a generic page or do nothing
//               // To prevent infinite loop, avoid navigate('/') here unless absolutely necessary
//               // If the user lands on '/' and is authenticated but has no recognized role,
//               // they might just stay on '/' and see the public content, which is okay.
//               console.warn("Authenticated user with unrecognized role tried to access a public path.");
//               break;
//           }
//         }
//       } else {
//         // If not authenticated and on a protected route, PrivateRoute will handle it.
//         // App.jsx does not need to navigate here to prevent loops.
//       }
//     }
//   }, [isAuthenticated, user, authLoading, navigate, location.pathname]); // Add location.pathname to dependencies

//   const handleAdminClientRegistered = (newAdminClient) => {
//     alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//     console.log('Nouvel Admin Client enregistré:', newAdminClient);
//     setShowRegisterForm(false);
//     setShowLoginForm(true);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   const openLoginForm = () => {
//     setShowLoginForm(true);
//     setShowRegisterForm(false);
//     navigate('/login', { replace: true }); // Explicitly navigate to /login for URL clarity
//   };

//   const closeLoginForm = () => {
//     setShowLoginForm(false);
//     if (location.pathname === '/login') navigate('/', { replace: true }); // Navigate back to home if closing from /login
//   };

//   const openRegisterForm = () => {
//     setShowRegisterForm(true);
//     setShowLoginForm(false);
//     navigate('/register-admin-client', { replace: true }); // Explicitly navigate to /register-admin-client
//   };

//   const closeRegisterForm = () => {
//     setShowRegisterForm(false);
//     if (location.pathname === '/register-admin-client') navigate('/', { replace: true }); // Navigate back to home
//   };

//   if (authLoading) {
//     return <div className="loading-screen">Chargement de l'authentification...</div>;
//   }

//   return (
//     <div className="App">
//       <header className="App-header">
//         <div className="logo">
//           <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//         </div>
//         <nav className="main-nav">
//           {!isAuthenticated ? (
//             <div className="auth-buttons">
//               <button onClick={openLoginForm} className="nav-button">Connexion</button>
//               <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//             </div>
//           ) : (
//             <div className="dashboard-nav">
//               {user?.role === 'admin_client' && (
//                 <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//               )}
//               {user?.role === 'employer' && (
//                 <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//               )}
//               {user?.role === 'super_admin' && (
//                 <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//               )}
//               <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//               <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//             </div>
//           )}
//         </nav>
//       </header>

//       <main>
//         <Routes>
//           <Route path="/" element={
//             !isAuthenticated ? (
//               <HomePage showLoginForm={showLoginForm} showRegisterForm={showRegisterForm} onAdminClientRegistered={handleAdminClientRegistered} onCancelLogin={closeLoginForm} onCancelRegister={closeRegisterForm} />
//             ) : (
//               <HomePage /> // If authenticated, HomePage might just be a placeholder
//             )
//           } />
//           {/* Add explicit routes for login and register for cleaner URLs */}
//           <Route path="/login" element={
//             !isAuthenticated ? <LoginPage onCancel={closeLoginForm} /> : <Navigate to={user?.role === 'admin_client' ? '/admin-client-dashboard' : user?.role === 'employer' ? '/employee-dashboard' : user?.role === 'super_admin' ? '/super-admin-dashboard' : '/'} replace />
//           } />
//           <Route path="/register-admin-client" element={
//             !isAuthenticated ? <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} /> : <Navigate to={user?.role === 'admin_client' ? '/admin-client-dashboard' : user?.role === 'employer' ? '/employee-dashboard' : user?.role === 'super_admin' ? '/super-admin-dashboard' : '/'} replace />
//           } />

//           <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//           <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//           <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//           <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />
//         </Routes>
//       </main>
//     </div>
//   );
// }

// export default App;

// You might need to adjust HomePage.jsx to accept these props
// Example: HomePage.jsx
/*
import React from 'react';
import LoginPage from './LoginPage'; // Assuming LoginPage is now a standalone component
import RegisterAdminClientPage from './RegisterAdminClientPage'; // Assuming RegisterAdminClientPage is standalone

function HomePage({ showLoginForm, showRegisterForm, onAdminClientRegistered, onCancelLogin, onCancelRegister }) {
  return (
    <div>
      <h1>Bienvenue sur notre application d'hygiène !</h1>
      <p>Gérez vos enregistrements de température et votre traçabilité.</p>

      {showLoginForm && <LoginPage onCancel={onCancelLogin} />}
      {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={onAdminClientRegistered} onCancel={onCancelRegister} />}

      {!showLoginForm && !showRegisterForm && (
        <>
          <p>Connectez-vous ou enregistrez un nouveau compte pour commencer.</p>
          // Potentially add image or other static content
        </>
      )}
    </div>
  );
}

export default HomePage;
*/








// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// // BrowserRouter n'est PLUS importé ici, car il est géré dans main.jsx
// import { Routes, Route, Link, useNavigate } from 'react-router-dom';
// import LoginPage from './pages/LoginPage';
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage'; // Correction du nom du fichier si nécessaire, mais le composant est EmployerDashboardPage
// import SuperAdminDashboardPage from './pages/AdminDashboardPage'; // Correction du nom du fichier si nécessaire, mais le composant est AdminDashboardPage
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage';
// import './App.css';

// import { useAuth } from './context/AuthContext'; // Importez useAuth pour accéder à l'état d'authentification

// function App() {
//   // Utilisez le hook useAuth pour obtenir l'état d'authentification global
//   const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
//   // Initialisez useNavigate pour les redirections programmatiques
//   const navigate = useNavigate();

//   // États locaux pour contrôler l'affichage des formulaires de connexion/inscription
//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [showRegisterForm, setShowRegisterForm] = useState(false);

//   // useEffect pour gérer les redirections après l'authentification ou le chargement
//   useEffect(() => {
//     // S'assurer que le chargement de l'authentification est terminé
//     if (!authLoading) {
//       if (isAuthenticated) {
//         // Rediriger l'utilisateur vers le tableau de bord approprié en fonction de son rôle
//         switch (user?.role) {
//           case 'admin_client':
//             navigate('/admin-client-dashboard');
//             break;
//           case 'employer':
//             navigate('/employee-dashboard');
//             break;
//           case 'super_admin':
//             navigate('/super-admin-dashboard');
//             break;
//           default:
//             // Si le rôle n'est pas reconnu ou non défini, rediriger vers la page d'accueil
//             navigate('/');
//         }
//       } else {
//         // Si l'utilisateur n'est pas authentifié et n'est pas sur une page publique (accueil, connexion, inscription)
//         // Rediriger vers la page d'accueil pour éviter les boucles de redirection sur les routes privées
//         if (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register-admin-client') {
//             navigate('/');
//         }
//       }
//     }
//   }, [isAuthenticated, user, authLoading, navigate]); // Dépendances du useEffect

//   // Gestionnaire pour l'enregistrement réussi d'un admin client
//   const handleAdminClientRegistered = (newAdminClient) => {
//     alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//     console.log('Nouvel Admin Client enregistré:', newAdminClient);
//     setShowRegisterForm(false); // Fermer le formulaire d'inscription
//     setShowLoginForm(true);    // Ouvrir le formulaire de connexion
//   };

//   // Gestionnaire pour la déconnexion
//   const handleLogout = () => {
//     logout(); // Appelle la fonction de déconnexion du contexte d'authentification
//     navigate('/'); // Redirige vers la page d'accueil après la déconnexion
//   };

//   // Fonctions pour contrôler l'affichage des modales de formulaire
//   const openLoginForm = () => {
//     setShowLoginForm(true);
//     setShowRegisterForm(false); // S'assurer que l'autre formulaire est fermé
//   };

//   const closeLoginForm = () => {
//     setShowLoginForm(false);
//   };

//   const openRegisterForm = () => {
//     setShowRegisterForm(true);
//     setShowLoginForm(false); // S'assurer que l'autre formulaire est fermé
//   };

//   const closeRegisterForm = () => {
//     setShowRegisterForm(false);
//   };

//   // Afficher un écran de chargement pendant que l'état d'authentification est en cours de détermination
//   if (authLoading) {
//     return <div className="loading-screen">Chargement de l'authentification...</div>;
//   }

//   return (
//     <div className="App">
//       <header className="App-header">
//         <div className="logo">
//           {/* Assurez-vous que le chemin de l'image est correct */}
//           <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//         </div>
//         <nav className="main-nav">
//           {!isAuthenticated ? (
//             // Boutons de connexion/inscription si l'utilisateur n'est pas authentifié
//             <div className="auth-buttons">
//               <button onClick={openLoginForm} className="nav-button">Connexion</button>
//               <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//             </div>
//           ) : (
//             // Liens de navigation vers les tableaux de bord si l'utilisateur est authentifié
//             <div className="dashboard-nav">
//               {user?.role === 'admin_client' && (
//                 <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//               )}
//               {user?.role === 'employer' && (
//                 <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//               )}
//               {user?.role === 'super_admin' && (
//                 <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//               )}
//               <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//               <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//             </div>
//           )}
//         </nav>
//       </header>

//       <main>
//         {/* Définition des routes de l'application */}
//         <Routes>
//           <Route path="/" element={
//             // Si l'utilisateur est authentifié, afficher directement la HomePage
//             isAuthenticated ? (
//               <HomePage />
//             ) : (
//               // Sinon, afficher les formulaires de connexion/inscription ou la HomePage par défaut
//               <div className="auth-forms-and-homepage-container">
//                 {showLoginForm && <LoginPage onCancel={closeLoginForm} />}
//                 {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />}
//                 {/* Afficher HomePage si aucun formulaire n'est ouvert */}
//                 {!showLoginForm && !showRegisterForm && <HomePage />}
//               </div>
//             )
//           } />

//           {/* Routes privées protégées par le composant PrivateRoute */}
//           <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//           <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//           <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//           <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />
//         </Routes>
//       </main>
//     </div>
//   );
// }

// export default App;







// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'; // Importez useNavigate
// import LoginPage from './pages/LoginPage';
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage'; // Renommé de EmployerDashboardPage pour la clarté
// import SuperAdminDashboardPage from './pages/AdminDashboardPage'; // Renommé de AdminDashboardPage pour la clarté
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage';
// import './App.css';

// import { AuthProvider, useAuth } from './context/AuthContext'; // Importez AuthProvider et useAuth

// function App() {
//   // Utilisez le hook useAuth pour gérer l'état d'authentification global
//   const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
//   const navigate = useNavigate(); // Initialise useNavigate

//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [showRegisterForm, setShowRegisterForm] = useState(false);

//   // Supprimé l'ancien useEffect qui gérait isAuthenticated/userRole via localStorage
//   // C'est maintenant géré par AuthContext

//   // Gérez la redirection après la connexion via l'état du contexte
//   useEffect(() => {
//     if (!authLoading) { // Attendez que l'authentification soit terminée
//       if (isAuthenticated) {
//         // Redirigez en fonction du rôle après une connexion réussie ou un rechargement
//         switch (user?.role) { // Utilisez user?.role car user peut être null au début
//           case 'admin_client':
//             navigate('/admin-client-dashboard');
//             break;
//           case 'employer':
//             navigate('/employee-dashboard');
//             break;
//           case 'super_admin':
//             navigate('/super-admin-dashboard');
//             break;
//           default:
//             navigate('/'); // Redirige vers la page d'accueil si le rôle est inconnu
//         }
//       } else {
//         // Si non authentifié et pas sur une page d'auth, rediriger vers la page d'accueil
//         // pour afficher les formulaires de connexion/inscription
//         if (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register-admin-client') {
//             navigate('/');
//         }
//       }
//     }
//   }, [isAuthenticated, user, authLoading, navigate]); // Dépendances mises à jour

//   const handleAdminClientRegistered = (newAdminClient) => {
//     alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//     console.log('Nouvel Admin Client enregistré:', newAdminClient);
//     setShowRegisterForm(false);
//     setShowLoginForm(true);
//   };

//   const handleLogout = () => {
//     logout(); // Appelle la fonction logout du contexte
//     navigate('/'); // Redirige vers la page d'accueil après la déconnexion
//   };

//   const openLoginForm = () => {
//     setShowLoginForm(true);
//     setShowRegisterForm(false);
//   };

//   const closeLoginForm = () => {
//     setShowLoginForm(false);
//   };

//   const openRegisterForm = () => {
//     setShowRegisterForm(true);
//     setShowLoginForm(false);
//   };

//   const closeRegisterForm = () => {
//     setShowRegisterForm(false);
//   };

//   // Afficher un écran de chargement pendant que l'authentification est en cours
//   if (authLoading) {
//     return <div className="loading-screen">Chargement de l'authentification...</div>;
//   }

//   return (
//     // AuthProvider doit envelopper le Router pour que useAuth soit disponible partout
//     <div className="App"> {/* Le AuthProvider est déjà au niveau supérieur dans index.jsx */}
//       <header className="App-header">
//         <div className="logo">
//           <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//         </div>
//         <nav className="main-nav">
//           {!isAuthenticated ? (
//             <div className="auth-buttons">
//               <button onClick={openLoginForm} className="nav-button">Connexion</button>
//               <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//             </div>
//           ) : (
//             <div className="dashboard-nav">
//               {user?.role === 'admin_client' && ( // Utilisez user?.role
//                 <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//               )}
//               {user?.role === 'employer' && ( // Utilisez user?.role
//                 <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//               )}
//               {user?.role === 'super_admin' && ( // Utilisez user?.role
//                 <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//               )}
//               <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//               <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//             </div>
//           )}
//         </nav>
//       </header>

//       <main>
//         <Routes>
//           {/* Route pour la page d'accueil (/) */}
//           <Route path="/" element={
//             isAuthenticated ? (
//               // Si authentifié, le useEffect ci-dessus redirigera vers le bon dashboard
//               // Ici, on peut laisser un message ou un composant par défaut
//               <HomePage /> // Ou un message "Vous êtes connecté"
//             ) : (
//               <div className="auth-forms-and-homepage-container">
//                 {showLoginForm && <LoginPage onCancel={closeLoginForm} />}
//                 {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />}
//                 {!showLoginForm && !showRegisterForm && <HomePage />}
//               </div>
//             )
//           } />

//           {/* Routes protégées */}
//           <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//           <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//           <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//           <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

//           {/* Les routes /login et /register-admin-client ne sont plus nécessaires car les formulaires sont affichés sur la page d'accueil */}
//           {/* <Route path="/login" element={<div className="redirect-message">Redirection vers la page d'accueil pour connexion...</div>} /> */}
//           {/* <Route path="/register-admin-client" element={<div className="redirect-message">Redirection vers la page d'accueil pour enregistrement...</div>} /> */}

//         </Routes>
//       </main>
//     </div>
//   );
// }

// // Le composant App doit être enveloppé par AuthProvider dans index.jsx
// // Si vous avez <AuthProvider><App /></AuthProvider> dans index.jsx, retirez AuthProvider d'ici.
// // Sinon, laissez-le ici. Pour l'instant, je vais supposer qu'il est dans index.jsx comme c'est la bonne pratique.
// // J'ai retiré le <AuthProvider> autour de <Router> ici, car il est dans index.jsx.

// export default App;









// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import LoginPage from './pages/LoginPage';
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage';
// import SuperAdminDashboardPage from './pages/AdminDashboardPage';
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage';
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage';
// import './App.css';

// // CORRIGÉ : Importez AuthProvider depuis le chemin CORRECT et avec le nom CORRECT
// // Le fichier AuthContext.jsx doit être dans frontend/src/context/
// import { AuthProvider } from './context/AuthContext'; // <--- CHEMIN ET NOM CORRIGÉS ICI

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [showRegisterForm, setShowRegisterForm] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem('userToken');
//     const role = localStorage.getItem('userRole');
//     if (token && role) {
//       setIsAuthenticated(true);
//       setUserRole(role);
//     }
//   }, []);

//   const handleLoginSuccess = (role) => {
//     setIsAuthenticated(true);
//     setUserRole(role);
//     setShowLoginForm(false);
//     switch (role) {
//       case 'admin_client':
//         window.location.href = '/admin-client-dashboard';
//         break;
//       case 'employer':
//         window.location.href = '/employee-dashboard';
//         break;
//       case 'super_admin':
//         window.location.href = '/super-admin-dashboard';
//         break;
//       default:
//         window.location.href = '/';
//     }
//   };

//   const handleAdminClientRegistered = (newAdminClient) => {
//     alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//     console.log('Nouvel Admin Client enregistré:', newAdminClient);
//     setShowRegisterForm(false);
//     setShowLoginForm(true);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('userToken');
//     localStorage.removeItem('userRole');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('clientId');
//     setIsAuthenticated(false);
//     setUserRole(null);
//     window.location.href = '/';
//   };

//   const openLoginForm = () => {
//     setShowLoginForm(true);
//     setShowRegisterForm(false);
//   };

//   const closeLoginForm = () => {
//     setShowLoginForm(false);
//   };

//   const openRegisterForm = () => {
//     setShowRegisterForm(true);
//     setShowLoginForm(false);
//   };

//   const closeRegisterForm = () => {
//     setShowRegisterForm(false);
//   };

//   return (
//     // ENVELOPPEZ VOTRE APPLICATION AVEC AuthProvider
//     <AuthProvider>
//       <Router>
//         <div className="App">
//           <header className="App-header">
//             <div className="logo">
//               <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//             </div>
//             <nav className="main-nav">
//               {!isAuthenticated ? (
//                 <div className="auth-buttons">
//                   <button onClick={openLoginForm} className="nav-button">Connexion</button>
//                   <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//                 </div>
//               ) : (
//                 <div className="dashboard-nav">
//                   {userRole === 'admin_client' && (
//                     <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//                   )}
//                   {userRole === 'employer' && (
//                     <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//                   )}
//                   {userRole === 'super_admin' && (
//                     <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//                   )}
//                   <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//                   <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//                 </div>
//               )}
//             </nav>
//           </header>

//           <main>
//             <Routes>
//               <Route path="/" element={
//                 isAuthenticated ? (
//                   userRole === 'admin_client' ? <AdminClientDashboardPage /> :
//                   userRole === 'employer' ? <EmployeeDashboardPage /> :
//                   userRole === 'super_admin' ? <SuperAdminDashboardPage /> :
//                   <div className="landing-page-content">Bienvenue! Veuillez sélectionner une option de tableau de bord.</div>
//                 ) : (
//                   <div className="auth-forms-and-homepage-container">
//                     {showLoginForm && <LoginPage onLoginSuccess={handleLoginSuccess} onCancel={closeLoginForm} />}
//                     {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />}
//                     {!showLoginForm && !showRegisterForm && <HomePage />}
//                   </div>
//                 )
//               } />

//               <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//               <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//               <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//               <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

//               <Route path="/login" element={<div className="redirect-message">Redirection vers la page d'accueil pour connexion...</div>} />
//               <Route path="/register-admin-client" element={<div className="redirect-message">Redirection vers la page d'accueil pour enregistrement...</div>} />

//             </Routes>
//           </main>
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;




















// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Retiré useNavigate car non utilisé directement pour les redirections immédiates
// import LoginPage from './pages/LoginPage'; // Importé comme composant de formulaire
// import AdminClientDashboardPage from './pages/AdminClientDashboardPage';
// import EmployeeDashboardPage from './pages/EmployerDashboardPage';
// import SuperAdminDashboardPage from './pages/AdminDashboardPage';
// import TemperatureRecordsPage from './pages/TemperatureRecordsPage';
// import RegisterAdminClientPage from './pages/RegisterAdminClientPage'; // Importé comme composant de formulaire
// import PrivateRoute from './components/PrivateRoute';
// import HomePage from './components/HomePage'; // Importez votre composant HomePage
// import './App.css'; // Styles globaux pour l'application

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [showLoginForm, setShowLoginForm] = useState(false); // Nouvel état pour contrôler l'affichage du formulaire de connexion
//   const [showRegisterForm, setShowRegisterForm] = useState(false); // Nouvel état pour contrôler l'affichage du formulaire d'enregistrement

//   useEffect(() => {
//     const token = localStorage.getItem('userToken');
//     const role = localStorage.getItem('userRole');
//     if (token && role) {
//       setIsAuthenticated(true);
//       setUserRole(role);
//     }
//   }, []);

//   const handleLoginSuccess = (role) => {
//     setIsAuthenticated(true);
//     setUserRole(role);
//     setShowLoginForm(false); // Ferme le formulaire de connexion après succès
//     // Redirection basée sur le rôle après connexion
//     switch (role) {
//       case 'admin_client':
//         window.location.href = '/admin-client-dashboard';
//         break;
//       case 'employer':
//         window.location.href = '/employee-dashboard';
//         break;
//       case 'super_admin':
//         window.location.href = '/super-admin-dashboard';
//         break;
//       default:
//         window.location.href = '/';
//     }
//   };

//   const handleAdminClientRegistered = (newAdminClient) => {
//     // Message de succès (vous pouvez utiliser une modale ici)
//     alert('Admin Client enregistré avec succès ! Vous pouvez maintenant vous connecter.');
//     console.log('Nouvel Admin Client enregistré:', newAdminClient);
//     setShowRegisterForm(false); // Ferme le formulaire d'enregistrement
//     setShowLoginForm(true); // Ouvre le formulaire de connexion pour qu'il puisse se connecter
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('userToken');
//     localStorage.removeItem('userRole');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('clientId');
//     setIsAuthenticated(false);
//     setUserRole(null);
//     window.location.href = '/'; // Redirige vers la page de connexion (qui affichera le bouton de connexion)
//   };

//   // Fonctions pour ouvrir/fermer les formulaires
//   const openLoginForm = () => {
//     setShowLoginForm(true);
//     setShowRegisterForm(false); // S'assurer que l'autre formulaire est fermé
//   };

//   const closeLoginForm = () => {
//     setShowLoginForm(false);
//   };

//   const openRegisterForm = () => {
//     setShowRegisterForm(true);
//     setShowLoginForm(false); // S'assurer que l'autre formulaire est fermé
//   };

//   const closeRegisterForm = () => {
//     setShowRegisterForm(false);
//   };

//   return (
//     <Router>
//       <div className="App">
        
//         <header className="App-header">
//           <div className="logo"><img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" /></div>
//           <nav className="main-nav">
             
//             {/* Boutons visibles si l'utilisateur n'est PAS authentifié */}
            
//             {!isAuthenticated ? (
//               <div className="auth-buttons"> {/* Conteneur pour les boutons à droite */}
//                 <button onClick={openLoginForm} className="nav-button">Connexion</button>
//                 <button onClick={openRegisterForm} className="nav-button">Enregistrer un nouveau compte</button>
//               </div>
//             ) : (
//               // Boutons/Liens visibles si l'utilisateur EST authentifié
//               <div className="dashboard-nav"> {/* Conteneur pour les liens de dashboard */}
//                 {userRole === 'admin_client' && (
//                   <Link to="/admin-client-dashboard" className="nav-link">Tableau de bord Admin Client</Link>
//                 )}
//                 {userRole === 'employer' && (
//                   <Link to="/employee-dashboard" className="nav-link">Tableau de bord Employé</Link>
//                 )}
//                 {userRole === 'super_admin' && (
//                   <Link to="/super-admin-dashboard" className="nav-link">Tableau de bord Super Admin</Link>
//                 )}
//                 <Link to="/temperature-records" className="nav-link">Relevés de Température</Link>
//                 <button onClick={handleLogout} className="logout-button">Déconnexion</button>
//               </div>
//             )}
            
//           </nav>
//         </header>
        
//         <main>
//           <Routes>
//             {/* La route par défaut affichera les formulaires si non authentifié, ou le dashboard */}
//             <Route path="/" element={
//               isAuthenticated ? (
//                 userRole === 'admin_client' ? <AdminClientDashboardPage /> :
//                 userRole === 'employer' ? <EmployeeDashboardPage /> :
//                 userRole === 'super_admin' ? <SuperAdminDashboardPage /> :
//                 <div className="landing-page-content">Bienvenue! Veuillez vous connecter ou vous enregistrer.</div>
//               ) : (
//                 // Affichage conditionnel des formulaires de connexion/enregistrement
//                 <div className="auth-forms-container">
//                   {showLoginForm && <LoginPage onLoginSuccess={handleLoginSuccess} onCancel={closeLoginForm} />}
//                   {showRegisterForm && <RegisterAdminClientPage onAdminClientRegistered={handleAdminClientRegistered} onCancel={closeRegisterForm} />}
//                   {/* Message par défaut si aucun formulaire n'est ouvert */}
//                   {!showLoginForm && !showRegisterForm && (
//                     <div className="welcome-message">
//                       <h2>Bienvenue sur l'Application de Gestion d'Hygiène!</h2>
//                       <p>Veuillez vous connecter ou enregistrer un nouveau compte pour commencer.</p>
//                       <p>Utilisez les boutons en haut à droite pour accéder aux formulaires.</p>
//                     </div>
//                   )}
                  
//                 </div>
                
//               )
//             } />
            

//             {/* Routes protégées qui nécessitent une authentification et un rôle spécifique */}
//             <Route path="/admin-client-dashboard" element={<PrivateRoute role="admin_client"><AdminClientDashboardPage /></PrivateRoute>} />
//             <Route path="/employee-dashboard" element={<PrivateRoute role="employer"><EmployeeDashboardPage /></PrivateRoute>} />
//             <Route path="/super-admin-dashboard" element={<PrivateRoute role="super_admin"><SuperAdminDashboardPage /></PrivateRoute>} />
//             <Route path="/temperature-records" element={<PrivateRoute roles={['employer', 'admin_client', 'super_admin']}><TemperatureRecordsPage /></PrivateRoute>} />

//             {/* Redirection pour les anciennes routes de connexion/enregistrement, si l'utilisateur les tape manuellement */}
//             <Route path="/login" element={<div className="redirect-message">Redirection vers la page d'accueil pour connexion...</div>} />
//             <Route path="/register-admin-client" element={<div className="redirect-message">Redirection vers la page d'accueil pour enregistrement...</div>} />

//           </Routes>
//           <HomePage /> {/* Ceci rendra votre page d'accueil */}
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;









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
    