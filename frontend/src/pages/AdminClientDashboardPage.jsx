// frontend/src/pages/AdminClientDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminClientDashboardPage.css'; // Create this CSS file

// Import components for admin_client management
import UserClientManagement from '../components/UserClientManagement'; // To manage clients
import TemperatureClientManagement from '../components/TemperatureClientManagement'; // To manage temperatures of their clients

const AdminClientDashboardPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'temperatures'

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'admin_client') {
            alert("Accès refusé. Seuls les administrateurs clients peuvent accéder à ce tableau de bord.");
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="admin-client-dashboard-container">
            <h1>Tableau de Bord Admin Client</h1>

            <nav className="admin-client-nav">
                <button
                    className={activeTab === 'clients' ? 'active' : ''}
                    onClick={() => setActiveTab('clients')}
                >
                    Gérer Mes Clients
                </button>
                <button
                    className={activeTab === 'temperatures' ? 'active' : ''}
                    onClick={() => setActiveTab('temperatures')}
                >
                    Gérer les Relevés de Mes Clients
                </button>
            </nav>

            <div className="admin-client-content">
                {activeTab === 'clients' && <UserClientManagement />}
                {activeTab === 'temperatures' && <TemperatureClientManagement />}
            </div>
        </div>
    );
};

export default AdminClientDashboardPage;