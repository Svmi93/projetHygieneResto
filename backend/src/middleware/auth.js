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










// // backend/src/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');

// // Middleware pour authentifier le token JWT
// exports.authenticateToken = (req, res, next) => {
//     // Récupère le token directement de l'en-tête 'x-auth-token'
//     const token = req.headers['x-auth-token']; // Le token est censé être directement la valeur

//     if (token == null) {
//         console.warn('Authentication token missing.');
//         return res.status(401).json({ message: 'Authentication token required.' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             console.error('JWT Verification Error: Token invalid or expired.', err.message);
//             // Si le token est invalide ou expiré, s'assure qu'il n'y a pas d'accès
//             return res.status(403).json({ message: 'Invalid or expired token.' });
//         }
//         console.log('JWT Payload (user object after verification):', user);
//         req.user = user; // Attache le payload décodé à l'objet req.user
//         next();
//     });
// };

// // Factory de middleware pour autoriser des rôles spécifiques
// exports.authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//         if (!req.user || !req.user.role) {
//             console.warn('Authorization Denied: User or role information missing in req.user. req.user:', req.user);
//             return res.status(403).json({ message: 'Access denied: Role information missing.' });
//         }

//         console.log('Role from token (req.user.role):', req.user.role);
//         console.log('Allowed roles for this route:', allowedRoles);

//         if (allowedRoles.includes(req.user.role)) {
//             console.log('Authorization successful for role:', req.user.role);
//             next();
//         } else {
//             console.warn('Authorization Denied: Insufficient privileges. User role:', req.user.role, 'Allowed:', allowedRoles);
//             res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
//         }
//     };
// };





// // backend/src/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken'); // Assuming you use JWT for authentication

// // Middleware to authenticate JWT token
// exports.authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['x-auth-token'];
//     const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

//     if (token == null) {
//         console.warn('Authentication token missing.'); // Log added
//         return res.status(401).json({ message: 'Authentication token required.' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             // If token is invalid or expired
//             console.error('JWT Verification Error: Token invalid or expired.', err.message); // Log added
//             return res.status(403).json({ message: 'Invalid or expired token.' });
//         }
//         // IMPORTANT: Ensure the user object contains a 'role' property
//         // This 'user' object comes from the JWT payload.
//         console.log('JWT Payload (user object after verification):', user); // Log added
//         req.user = user;
//         next(); // Pass control to the next middleware/route handler
//     });
// };

// // Middleware factory to authorize specific roles
// // This function takes roles as arguments and RETURNS a middleware function.
// exports.authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//         // Check if user information (especially role) is present from authenticateToken
//         if (!req.user || !req.user.role) {
//             console.warn('Authorization Denied: User or role information missing in req.user. req.user:', req.user); // Log added
//             return res.status(403).json({ message: 'Access denied: Role information missing.' });
//         }

//         console.log('Role from token (req.user.role):', req.user.role); // Log added
//         console.log('Allowed roles for this route:', allowedRoles); // Log added

//         // Check if the authenticated user's role is one of the allowed roles
//         if (allowedRoles.includes(req.user.role)) {
//             console.log('Authorization successful for role:', req.user.role); // Log added
//             next(); // User is authorized, proceed
//         } else {
//             console.warn('Authorization Denied: Insufficient privileges. User role:', req.user.role, 'Allowed:', allowedRoles); // Log added
//             res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
//         }
//     };
// };




// // backend/src/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken'); // Assuming you use JWT for authentication

// // Middleware to authenticate JWT token
// exports.authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

//     if (token == null) {
//         return res.status(401).json({ message: 'Authentication token required.' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             // If token is invalid or expired
//             return res.status(403).json({ message: 'Invalid or expired token.' });
//         }
//         // IMPORTANT: Ensure the user object contains a 'role' property
//         // This 'user' object comes from the JWT payload.
//         req.user = user;
//         next(); // Pass control to the next middleware/route handler
//     });
// };

// // Middleware factory to authorize specific roles
// // This function takes roles as arguments and RETURNS a middleware function.
// exports.authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//         // Check if user information (especially role) is present from authenticateToken
//         if (!req.user || !req.user.role) {
//             return res.status(403).json({ message: 'Access denied: Role information missing.' });
//         }

//         // Check if the authenticated user's role is one of the allowed roles
//         if (allowedRoles.includes(req.user.role)) {
//             next(); // User is authorized, proceed
//         } else {
//             res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
//         }
//     };
// };




// // backend/src/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken'); // Assuming you use JWT for authentication

// exports.authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

//     if (token == null) {
//         return res.status(401).json({ message: 'Authentication token required.' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             // If token is invalid or expired
//             return res.status(403).json({ message: 'Invalid or expired token.' });
//         }
//         req.user = user; // Attach user information to the request
//         next(); // Pass control to the next middleware/route handler
//     });
// };