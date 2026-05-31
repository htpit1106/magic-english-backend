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

// Chuẩn hoá private key: chịu được cả 2 kiểu Vercel lưu
// - chuỗi 1 dòng có "\n" literal  -> đổi thành xuống dòng thật
// - đã có xuống dòng thật          -> giữ nguyên
// - bị bọc thừa dấu nháy đầu/cuối  -> bỏ
function normalizePrivateKey(key) {
  let k = key.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k.replace(/\\n/g, '\n');
}

const privateKey = normalizePrivateKey(FIREBASE_PRIVATE_KEY);

if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
  throw new Error('FIREBASE_PRIVATE_KEY is malformed (missing PEM header). Check the Vercel env value.');
}

// Chỉ init một lần (Vercel serverless có thể load module nhiều lần -> tránh duplicate-app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

const db = admin.firestore();

module.exports = db;