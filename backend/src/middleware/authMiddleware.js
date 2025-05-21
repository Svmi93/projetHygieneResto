// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt'); // Assure-toi que cela correspond à ton fichier secret

exports.authenticateToken = (req, res, next) => {
    // Récupère le token du header d'autorisation
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('Token verification error:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Stocke les informations de l'utilisateur (id, role) dans la requête
        next(); // Passe au prochain middleware/gestionnaire de route
    });
};

exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'User role not found. Access denied.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have the required role to access this resource. Access denied.' });
        }
        next();
    };
};