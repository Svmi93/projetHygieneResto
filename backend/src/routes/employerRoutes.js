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








// // backend/src/routes/employerRoutes.js
// const express = require('express');
// const router = express.Router();
// const temperatureController = require('../controllers/temperatureController');
// const photoController = require('../controllers/photoController');
// const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Chemin corrigé vers 'auth.js'
// const multer = require('multer'); // Pour la gestion des uploads de fichiers (photos)

// // Configuration de Multer pour le stockage en mémoire
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 5 * 1024 * 1024 }, // Limite la taille du fichier à 5MB
// });

// // Toutes les routes ici nécessitent le rôle 'employer'
// router.use(authenticateToken, authorizeRoles('employer'));

// // --- Temperature Record Management (Employer) ---
// // Récupérer les relevés de température de l'employé connecté
// router.get('/temperatures', temperatureController.getMyTemperatureRecords);
// // Ajouter un relevé de température pour l'employé connecté
// router.post('/temperatures', temperatureController.addMyTemperatureRecord);
// // Mettre à jour un relevé de température (si autorisé, ex: notes)
// // router.put('/temperatures/:id', temperatureController.updateMyTemperatureRecord); // À implémenter si besoin
// // Supprimer un relevé de température (si autorisé)
// // router.delete('/temperatures/:id', temperatureController.deleteMyTemperatureRecord); // À implémenter si besoin

// // --- Photo Management (Employer) ---
// // Uploader une photo (l'employé peut uploader pour son établissement)
// router.post('/photos/upload', upload.single('image'), photoController.uploadPhoto);
// // Récupérer les photos de l'établissement de l'employé
// router.get('/photos/client/:siret', photoController.getPhotosBySiret); // L'employé peut voir les photos de son SIRET

// module.exports = router;





 // backend/src/routes/employeeRoutes.js (pour le rôle 'employer')
// const express = require('express');
// const router = express.Router();
// const temperatureController = require('../controllers/temperatureController');
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// // Toutes les routes ici nécessitent le rôle 'employer'
// router.use(authenticateToken, authorizeRoles('employer')); // CHANGED: 'client' to 'employer'

// // --- Gestion des relevés de température par l'employé lui-même ---
// // L'employé peut créer ses propres relevés
// router.post('/temperatures', temperatureController.createTemperatureRecord);
// // L'employé peut voir ses propres relevés
// router.get('/temperatures', temperatureController.getTemperatureRecordsByClient);
// // L'employé peut modifier ses propres relevés
// router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);

// // IMPORTANT: La suppression des relevés n'est PAS autorisée pour les employés.
// // Donc, il n'y a PAS de route DELETE ici.

// module.exports = router;







// // backend/src/routes/clientRoutes.js (for client role)
// const express = require('express');
// const router = express.Router();
// const temperatureController = require('../controllers/temperatureController');
// const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// // All routes here require client role
// router.use(authenticateToken, authorizeRoles('client'));

// // --- Temperature Records Management (by client themselves) ---
// router.post('/temperatures', temperatureController.createTemperatureRecord);
// router.get('/temperatures', temperatureController.getTemperatureRecordsByClient);
// router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordByClient);

// module.exports = router;