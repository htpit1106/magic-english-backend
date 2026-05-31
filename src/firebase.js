const admin = require('firebase-admin');

// Chuẩn hoá private key: chịu được cả 2 kiểu Vercel lưu
// - chuỗi 1 dòng có "\n" literal  -> đổi thành xuống dòng thật
// - đã có xuống dòng thật          -> giữ nguyên
// - bị bọc thừa dấu nháy đầu/cuối  -> bỏ
function normalizePrivateKey(key) {
  let k = String(key).trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k.replace(/\\n/g, '\n');
}

function initFirebase() {
  if (admin.apps.length) {
    return admin.firestore();
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  const missing = [
    ['FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID],
    ['FIREBASE_CLIENT_EMAIL', FIREBASE_CLIENT_EMAIL],
    ['FIREBASE_PRIVATE_KEY', FIREBASE_PRIVATE_KEY]
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
  }

  const privateKey = normalizePrivateKey(FIREBASE_PRIVATE_KEY);

  if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
    throw new Error('FIREBASE_PRIVATE_KEY is malformed (missing PEM header). Check the Vercel env value.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });

  return admin.firestore();
}

// Lazy init: KHÔNG chạy initializeApp lúc import module (giống gemini.service không
// đụng Firebase khi load). Firestore chỉ được khởi tạo ở lần truy cập đầu tiên,
// nên việc import route/service sẽ không bao giờ làm crash cả function
// (FUNCTION_INVOCATION_FAILED) nếu env Firebase thiếu/sai.
let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = initFirebase();
  }
  return dbInstance;
}

// Proxy giữ nguyên API cũ: các file vẫn dùng `db.collection(...)` như trước,
// nhưng init chỉ xảy ra khi method được gọi thật sự.
module.exports = new Proxy({}, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});
