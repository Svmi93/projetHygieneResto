// frontend/src/components/AlertPopup.jsx
import React from 'react';
import './AlertPopup.css'; // Créez ce fichier CSS pour le style

const AlertPopup = ({ message, onDismiss }) => {
    return (
        <div className="alert-popup-overlay">
            <div className="alert-popup-content">
                <h2>🚨 Alerte !</h2>
                <p>{message}</p>
                <button onClick={onDismiss} className="alert-popup-dismiss-button">
                    OK, compris
                </button>
            </div>
        </div>
    );
};

export default AlertPopup;

