// // backend/src/config/multerConfig.js
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs'); // Pour créer le dossier si besoin

// // Chemin où les fichiers seront stockés
// // Pour le moment, nous allons stocker les photos dans un dossier 'uploads' à la racine du projet backend.
// // En production, il est FORTEMENT recommandé d'utiliser un service de stockage cloud (AWS S3, Google Cloud Storage, etc.)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, '../../uploads'); // Remonte de config/ vers backend/, puis va dans uploads/
    
//     // Crée le dossier 'uploads' s'il n'existe pas
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Génère un nom de fichier unique pour éviter les collisions
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limite la taille des fichiers à 5 Mo
//   fileFilter: (req, file, cb) => {
//     // Valide les types de fichiers (images uniquement)
//     const filetypes = /jpeg|jpg|png|gif/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Seules les images (jpeg, jpg, png, gif) sont autorisées !'));
//   }
// });

// module.exports = upload;