// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboardPage.css'; // Crée ce fichier CSS

// Importe les composants de gestion que nous allons créer
import UserManagement from '../components/UserManagement'; // Pour la gestion des utilisateurs
// import TemperatureManagement from '../components/TemperatureManagement'; // Pour la gestion des relevés (future)

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'temperatures', etc.

    // Effet pour vérifier le rôle de l'utilisateur au chargement
    // et rediriger s'il n'est pas super_admin
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'super_admin') {
            alert("Accès refusé. Seuls les super administrateurs peuvent accéder à ce tableau de bord.");
            navigate('/'); // Redirige vers la page d'accueil
        }
    }, [navigate]); // Déclenche l'effet si 'navigate' change (rare, mais bonne pratique)

    return (
        <div className="admin-dashboard-container">
            <h1>Tableau de Bord Super Admin</h1>

            <nav className="admin-nav">
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    Gérer les utilisateurs
                </button>
                {/* Plus tard, ajoute d'autres boutons pour d'autres tables */}
                {/*
                <button
                    className={activeTab === 'temperatures' ? 'active' : ''}
                    onClick={() => setActiveTab('temperatures')}
                >
                    Gérer les relevés de température
                </button>
                */}
            </nav>

            <div className="admin-content">
                {activeTab === 'users' && <UserManagement />}
                {/* {activeTab === 'temperatures' && <TemperatureManagement />} */}
            </div>
        </div>
    );
};

export default AdminDashboardPage;