// server/config/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "smartchef-app-c4b56.firebasestorage.app" // REPLACE with your actual bucket name
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };