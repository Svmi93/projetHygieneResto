// frontend/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; // Importez BrowserRouter ici
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Le Router DOIT ENVELOPPER AuthProvider pour que useNavigate fonctionne dans AuthProvider et ses enfants */}
    <Router>
      {/* AuthProvider doit envelopper App pour que useAuth soit disponible dans App et ses enfants */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);
