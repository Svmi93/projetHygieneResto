const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // S'assurer que le chemin est correct

// GET /api/users/profile - Get the profile for the authenticated user
// Cette ligne doit inclure 'admin_client' et 'super_admin' si ces rôles doivent aussi accéder à leur profil.
router.get('/profile', authenticateToken, authorizeRoles('employer', 'admin_client', 'super_admin'), userController.getProfile);

module.exports = router;



// // backend/src/routes/userRoutes.js
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticateToken } = require('../middleware/auth'); // Line 8 of userRoutes.js is here
// router.get('/profile', authenticateToken, userController.getProfile);
// module.exports = router;
