// backend/src/routes/employerRoutes.js
const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperatureController');
const equipmentController = require('../controllers/equipmentController'); // Keep this if needed
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes here will use authenticateToken and authorizeRoles('employer') automatically
// because of app.use('/api/employer', employerRoutes) in server.js,
// combined with the router.use() middleware here.
router.use(authenticateToken, authorizeRoles('employer'));

// --- Employer-specific Temperature Records ---
// POST /api/employer/temperatures - Employee can create their own temperature records
router.post('/temperatures', temperatureController.createTemperatureRecord);

// GET /api/employer/temperatures - Employee can view their own temperature records
// This is the route the frontend was trying to hit!
router.get('/temperatures', temperatureController.getTemperatureRecordsByClient); // Assuming this controller gets client's specific temperatures

// PUT /api/employer/temperatures/:id - Employee can update their own temperature records
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);

// --- Employer-specific Equipment/Locations (if this route exists) ---
// Assuming /api/employer/my-locations maps here
router.get('/my-locations', equipmentController.getEmployeeLocations);


// IMPORTANT: La suppression des relevés n'est PAS autorisée pour les employés.
// Donc, il n'y a PAS de route DELETE ici.

module.exports = router;



// // backend/src/routes/equipmentRoutes.js
// const express = require('express');
// const router = express.Router();
// const equipmentController = require('../controllers/equipmentController');
// // Import with the correct names from authMiddleware.js
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// // Route for admin_client to get their equipments
// // Use authenticateToken and authorizeRoles directly
// router.route('/')
//     .get(authenticateToken, authorizeRoles('admin_client'), equipmentController.getEquipmentsForAdminClient)
//     .post(authenticateToken, authorizeRoles('admin_client'), equipmentController.createEquipment);

// // Routes for specific equipment by ID
// router.route('/:id')
//     .put(authenticateToken, authorizeRoles('admin_client'), equipmentController.updateEquipment)
//     .delete(authenticateToken, authorizeRoles('admin_client'), equipmentController.deleteEquipment);

// // This route seems to be for employees to fetch locations, likely equipment locations
// // Ensure this also uses authenticateToken and authorizeRoles if needed, or adjust
// // If employee doesn't have a specific role for this, remove authorizeRoles
// router.get('/my-locations', authenticateToken, authorizeRoles('employer'), equipmentController.getEmployeeLocations);

// module.exports = router;