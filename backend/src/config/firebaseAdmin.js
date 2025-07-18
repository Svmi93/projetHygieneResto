// backend/src/config/firebaseAdmin.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// NOTE: Le chemin vers le fichier de clés DOIT être correct pour l'initialisation du SDK.
// Il sera utilisé si Firebase est activé, même si le bucket n'est pas spécifié ici.
const serviceAccountPath = path.resolve(__dirname, '../../firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json');

let serviceAccount;
try {
  const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountContent);
} catch (error) {
  console.error('ERREUR CRITIQUE: Impossible de charger le fichier de compte de service Firebase. Vérifiez le chemin et les permissions du fichier. Cela peut être normal en mode developpement si vous ne l\'utilisez pas.');
  // Ne pas quitter le processus, pour permettre le mode developpement local sans Firebase
  // if (process.env.NODE_ENV !== 'development') {
  //   process.exit(1);
  // }
  // On peut même ne pas afficher d'erreur si la variable d'env indique qu'on ne s'attend pas à Firebase ici
  console.log('Firebase Admin SDK non initialisé car le fichier de clés est manquant ou non configuré.');
  module.exports = null; // Exporte null si Firebase n'est pas initialisé
  return; // Sortir de la fonction
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // IMPORTANT: Ne PAS spécifier storageBucket ici. Le contrôleur le fera conditionnellement.
  });
  console.log('Firebase Admin SDK initialisé avec succès depuis le fichier de clés.');
} else {
  admin.app();
  console.log('Firebase Admin SDK déjà initialisé, utilisation de l\'instance existante.');
}

module.exports = admin;










// // backend/src/config/firebaseAdmin.js
// const admin = require('firebase-admin');
// const fs = require('fs'); // Nécessaire pour lire les fichiers
// const path = require('path'); // Nécessaire pour gérer les chemins de fichiers

// // Définissez le chemin vers votre fichier de clé de service JSON.
// // Assurez-vous que ce chemin est correct par rapport à l'emplacement de firebaseAdmin.js
// // et que le dossier 'firebase-admin-keys' est bien monté dans votre Docker (dans docker-compose.yml).
// const serviceAccountPath = path.resolve(__dirname, '../../firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json');

// let serviceAccount;
// try {
//   // Lit le fichier JSON et le parse
//   const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
//   serviceAccount = JSON.parse(serviceAccountContent);
// } catch (error) {
//   console.error('Erreur lors du chargement du fichier de compte de service Firebase:', error);
//   // C'est critique, l'application ne pourra pas fonctionner sans cette clé.
//   // Vous pourriez vouloir quitter le processus ici ou gérer l'erreur de manière plus robuste.
//   process.exit(1);
// }

// // Vérifie si une application Firebase n'a pas déjà été initialisée
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     // Assurez-vous que ce 'storageBucket' correspond à votre projet Firebase
//     storageBucket: 'hygiene1-664ad.appspot.com'
//   });
//   console.log('Firebase Admin SDK initialisé avec succès.');
// }

// // Exporte l'instance 'admin' pour qu'elle puisse être utilisée dans d'autres fichiers
// module.exports = admin;







// // backend/src/config/firebaseAdmin.js
// const admin = require('firebase-admin');

// // IMPORTANT : Collez ici l'intégralité de l'objet JSON de votre compte de service.
// // C'est cet objet qui contient la propriété "project_id".
// const serviceAccount = {
//   "type": "service_account",
//   "project_id": "hygiene1-664ad",
//   "private_key_id": "7ad97b394b964e131714896f085bf89d66f2097c",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDYmNa/FcPQz/P8\nceyUktiaM+Z5iw7/9L5fNlF/jriCr2umBc+Hp3tz2CNtbCp5bLl8DO953LXypks1\nqzshuIIlSOupM4lB38s8NlqtEnrVsYbqj1A+XHdXGxCH4bia4cFr7xfN+kAWlITO\nN+knCrHAjV+PdttUooIA8SRQmSj4NRhQahpDmWAmIxXvuAT3rccSaw2LFsZeOeTE\nmfbiI443W4uPc+YJ7wddbwbXmIgMcraNFQZXZL+AqVKf4h9HbQLzAL5Vxkn0qHbB\nx4jw0Ulkvt/vt6VC+ELJrkfE+W9ts6v5YSb3VUjFxCFNnB9wdbL+m5mT89S9dhmi\n+h4B230hAgMBAAECggEACLkKhHRon/og+wKeRss9aYPjsTNFR8/0Iv7btD+z3PD6\nPIvdPEsFmvAqWJW3pe9XzrfxZMKrie2yJ5OZWHm/FYfw1C4K9f4AmACfIRtWW8L4\nEk4SWumTxYx1q2g+7E9hUBLHXlRoxHQHn2uzYj7xMsZKwfsFGRzokAfGGPAbHRhI\n1obE2r0fYG+i6EcuzJKPU6l7uqVwqKCUraTRFWRKLmyjuhy3HJVYzCnxIR5k50rh\nvlhXkqd6qvW63TeH2jdQSqTcPlz/JB+FXJtMHk57BoPApzfFmu6+hokkpK+Eeoj9\n4aUQJVI6jzcA4c3czx3lAl4K1NcHqA4tP5kBf38GEQKBgQDrt9ztCtcas2ayHgYr\nW9pvLxeh3nGb72nHiSk2CtI2KUVhg8ycBug/8AHFvI3JwJDstlTR0Ty8CR7FAoKQ\nlrAZDE3KyNI45y1eUdlXVtl9jKZPW7hXb6CbNDcUystcFYJSQdlYe4685PoD8qFb\nntzS841wKga6ZFa1ADqOAI8c8QKBgQDrO8u1H35xQo1pOpR4pL6dRb1WaGYdG5L4\nvxGzTummNlILP9xMpOcoeEkBG3nlvLCUA9VBRe89gZP3dabj9JBRyv4DGkg0CC9Z\nlMqRl5T8oIJSTFAqnV+NOPoItcuJeSM3KU4N5J8AkYhP+BNWCmeCvStf1VM+uZ/h\nx/awVaIjMQKBgCWg/lWg62HJzdUVUerOCPrCy8T9W6mG+J3v2XJVG+WlhPviLGGk\nAKNkTwQf64qPgRMosDWmb0mdMxpEIk+unoIBItICaPzIeseZzVZR+Po/37S/cZgT\nq9Ha7ggVr40NqfYzqNylLM4ex4Kl0vhrTdknJCcJrnVG20idtrtAf5ghAoGBAKbd\nNuaXnaEIHbnMlS9zZce4hdO6oNz7B2muWAcC7lk6ZT6XoVU5EMSzds3zSKgADp4g\njfEMg+X0ehrq+WTwwkNTJJbc2OUX/UaldoCKr2P5FBj/C0r/cZ2DElKFawlsxd9G\nTJksWOIVWkWn60d4f+7M8+y6LZ/sGw8VQtfZFvexAoGBAOTNR1YpTreSmFs5y8kC\nH0xnr1uQirs1UNkyueEsjc4AmZ9Bjw8Al3K5XlaWjjzO/DaCpJX1NLAtKvQ84P4X\nicYifT8j8kKvQB19IVj8coEbFbnyPZ6FjRBDRKSOKK1LMcBTw6TX+xNwFx5cjPcY\nawHElEYLWRhwAdh9s0bKNVo3\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-fbsvc@hygiene1-664ad.iam.gserviceaccount.com",
//   "client_id": "116083012203591614227",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hygiene1-664ad.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// };

// // Vérifie si une application Firebase n'a pas déjà été initialisée
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     // Assurez-vous que ce 'storageBucket' correspond à votre projet Firebase
//     storageBucket: 'hygiene1-664ad.appspot.com'
//   });
//   console.log('Firebase Admin SDK initialisé avec succès.');
// }

// // Exporte l'instance 'admin' pour qu'elle puisse être utilisée dans d'autres fichiers
// module.exports = admin;
