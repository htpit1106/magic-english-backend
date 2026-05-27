const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let credential;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  });
} else {
  const serviceAccountPath = path.join(__dirname, '../service_account_key.json');
  if (fs.existsSync(serviceAccountPath)) {
    credential = admin.credential.cert(require(serviceAccountPath));
  } else {
    credential = undefined;
  }
}

admin.initializeApp({
  credential
});

const db = admin.firestore();

module.exports = db;