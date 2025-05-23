// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware'); // Line 8 of userRoutes.js is here
router.get('/profile', authenticateToken, userController.getProfile);
module.exports = router;




// // backend/src/routes/userRoutes.js
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticateToken } = require('../middleware/authMiddleware'); // Line 8 of userRoutes.js is here
// router.get('/profile', authenticateToken, userController.getProfile);
// module.exports = router;
