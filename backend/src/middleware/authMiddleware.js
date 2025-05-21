// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('Token verification error:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // { id: userId, role: userRole }
        next();
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