// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware pour authentifier le token JWT
exports.authenticateToken = (req, res, next) => {
    // Tente d'abord de récupérer le token depuis l'en-tête 'Authorization' (standard Bearer)
    const authHeader = req.headers['authorization'];
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Si l'en-tête est au format "Bearer <token>", extrait le token.
        token = authHeader.split(' ')[1];
    } else {
        // Sinon, tente de récupérer le token directement depuis 'x-auth-token'
        // (pour compatibilité avec d'anciennes requêtes ou des cas spécifiques)
        token = req.headers['x-auth-token'];
    }

    if (!token) { // Utilise !token au lieu de token == null pour couvrir undefined, null, vide
        console.warn('Authentication token missing from Authorization header or x-auth-token.');
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Le token est invalide (expiré, malformé, etc.)
            console.error('JWT Verification Error: Token invalid or expired.', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        console.log('JWT Payload (user object after verification):', user);
        req.user = user; // Attache les informations de l'utilisateur au req (y compris id, role, client_id/siret)
        next(); // Passe au prochain middleware ou à la fonction de route
    });
};

// Factory de middleware pour autoriser des rôles spécifiques
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            console.warn('Authorization Denied: User or role information missing in req.user. req.user:', req.user);
            return res.status(403).json({ message: 'Access denied: Role information missing.' });
        }

        console.log('Role from token (req.user.role):', req.user.role);
        console.log('Allowed roles for this route:', allowedRoles);

        if (allowedRoles.includes(req.user.role)) {
            console.log('Authorization successful for role:', req.user.role);
            next();
        } else {
            console.warn('Authorization Denied: Insufficient privileges. User role:', req.user.role, 'Allowed:', allowedRoles);
            res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
        }
    };
};









