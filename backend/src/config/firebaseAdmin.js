const admin = require('firebase-admin');

let adminInstance = null;

try {
  const serviceAccount = require('../../firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json');
  adminInstance = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'hygiene1-664ad.appspot.com',
  });
  console.log('Firebase Admin SDK initialisé avec succès depuis le fichier de clés.');
} catch (error) {
  console.warn('Firebase Admin SDK non initialisé car le fichier de clés est manquant ou non configuré. Les fonctionnalités Firebase seront désactivées.', error);
  // Dummy admin object to avoid breaking the app
  adminInstance = {
    storage: () => ({
      bucket: () => ({
        file: () => ({
          createWriteStream: () => {
            const stream = require('stream');
            const writable = new stream.Writable();
            writable._write = (chunk, encoding, callback) => {
              callback();
            };
            return writable;
          },
        }),
      }),
    }),
  };
}

module.exports = adminInstance;
