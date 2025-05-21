// frontend/src/pages/ClientDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientDashboardPage.css'; // Create this CSS file

import TemperatureEntryForm from '../components/TemperatureEntryForm'; // For adding records
import MyTemperatureRecords from '../components/MyTemperatureRecords'; // For viewing own records

const ClientDashboardPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('entry'); // 'entry', 'my-records'

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'client') {
            alert("Accès refusé. Seuls les clients peuvent accéder à ce tableau de bord.");
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="client-dashboard-container">
            <h1>Tableau de Bord Client</h1>

            <nav className="client-nav">
                <button
                    className={activeTab === 'entry' ? 'active' : ''}
                    onClick={() => setActiveTab('entry')}
                >
                    Saisir un relevé
                </button>
                <button
                    className={activeTab === 'my-records' ? 'active' : ''}
                    onClick={() => setActiveTab('my-records')}
                >
                    Mes Relevés
                </button>
            </nav>

            <div className="client-content">
                {activeTab === 'entry' && <TemperatureEntryForm />}
                {activeTab === 'my-records' && <MyTemperatureRecords />}
            </div>
        </div>
    );
};

export default ClientDashboardPage;