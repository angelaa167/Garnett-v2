const admin = require("firebase-admin");
require('dotenv').config({ path: `${process.env.HOME}/Projects/React/Garnett/.env` });

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

const meritsRef = admin.database().ref('/merits');
const usersRef = admin.database().ref('/users/');

meritsRef.once('value', (merits) => {
  merits.forEach((merit) => {
    const activeName = merit.val().activeName.replace(/ /g,'');
    const pledgeName = merit.val().pledgeName.replace(/ /g,'');
    usersRef.child(activeName).once('value', (active) => {
      const activePhoto = active.val().photoURL;
      usersRef.child(pledgeName).once('value', (pledge) => {
        const pledgePhoto = pledge.val().photoURL;
        console.log(`Updated ${activeName} and ${pledgeName} merit photo`);
        merit.ref.update({ activePhoto, pledgePhoto });
      });
    });
  });
});
