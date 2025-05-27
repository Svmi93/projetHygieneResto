// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken'); // Assuming you use JWT for authentication

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (token == null) {
        console.warn('Authentication token missing.'); // Log added
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // If token is invalid or expired
            console.error('JWT Verification Error: Token invalid or expired.', err.message); // Log added
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        // IMPORTANT: Ensure the user object contains a 'role' property
        // This 'user' object comes from the JWT payload.
        console.log('JWT Payload (user object after verification):', user); // Log added
        req.user = user;
        next(); // Pass control to the next middleware/route handler
    });
};

// Middleware factory to authorize specific roles
// This function takes roles as arguments and RETURNS a middleware function.
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user information (especially role) is present from authenticateToken
        if (!req.user || !req.user.role) {
            console.warn('Authorization Denied: User or role information missing in req.user. req.user:', req.user); // Log added
            return res.status(403).json({ message: 'Access denied: Role information missing.' });
        }

        console.log('Role from token (req.user.role):', req.user.role); // Log added
        console.log('Allowed roles for this route:', allowedRoles); // Log added

        // Check if the authenticated user's role is one of the allowed roles
        if (allowedRoles.includes(req.user.role)) {
            console.log('Authorization successful for role:', req.user.role); // Log added
            next(); // User is authorized, proceed
        } else {
            console.warn('Authorization Denied: Insufficient privileges. User role:', req.user.role, 'Allowed:', allowedRoles); // Log added
            res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
        }
    };
};




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