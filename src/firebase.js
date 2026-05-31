const admin = require('firebase-admin');

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

// Báo lỗi rõ ràng khi thiếu env, thay vì để initializeApp crash mù toàn bộ function
const missing = [
  ['FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID],
  ['FIREBASE_CLIENT_EMAIL', FIREBASE_CLIENT_EMAIL],
  ['FIREBASE_PRIVATE_KEY', FIREBASE_PRIVATE_KEY]
].filter(([, v]) => !v).map(([k]) => k);

if (missing.length) {
  throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
}

// Chỉ init một lần (Vercel serverless có thể load module nhiều lần -> tránh duplicate-app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

module.exports = db;