// backend/src/routes/employerRoutes.js
const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperatureController');
const equipmentController = require('../controllers/equipmentController'); // Gardez ceci si nécessaire
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Chemin corrigé vers 'auth.js'

// Toutes les routes ici utiliseront authenticateToken et authorizeRoles('employer') automatiquement
// grâce à app.use('/api/employer', employerRoutes) dans server.js,
// combiné avec le router.use() middleware ici.
router.use(authenticateToken, authorizeRoles('employer'));

// --- Relevés de température spécifiques à l'employé ---
// POST /api/employer/temperatures - L'employé peut créer ses propres relevés de température
router.post('/temperatures', temperatureController.createTemperatureRecord); // Nom de fonction corrigé

// GET /api/employer/temperatures - L'employé peut consulter ses propres relevés de température
router.get('/temperatures', temperatureController.getTemperatureRecordsByClient); // Nom de fonction corrigé

// PUT /api/employer/temperatures/:id - L'employé peut mettre à jour ses propres relevés de température
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient); // Nom de fonction corrigé

// --- Équipement/Localisations spécifiques à l'employé (si cette route existe) ---
// En supposant que /api/employer/my-locations pointe ici
router.get('/my-locations', equipmentController.getEmployeeLocations);


// IMPORTANT: La suppression des relevés n'est PAS autorisée pour les employés par défaut.
// Si vous souhaitez autoriser la suppression par les employés, décommentez la ligne ci-dessous
// et assurez-vous que la fonction deleteTemperatureRecordByClient existe dans temperatureController.js
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordByClient);

module.exports = router;






