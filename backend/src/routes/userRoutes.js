// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/users/profile - Get the profile for the authenticated user
// The frontend requested /api/users/profile, so the path here should be '/profile'.
// We'll apply authorizeRoles if you want to ensure only specific roles can get *their own* profile.
// If it's open to all authenticated users, you can remove authorizeRoles here.
// Example: If only 'employer' and 'admin' roles can access their profile:
router.get('/profile', authenticateToken, authorizeRoles('employer', 'admin'), userController.getProfile);

module.exports = router;



// // backend/src/routes/userRoutes.js
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticateToken } = require('../middleware/auth'); // Line 8 of userRoutes.js is here
// router.get('/profile', authenticateToken, userController.getProfile);
// module.exports = router;
