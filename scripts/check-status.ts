import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

if (!getApps().length) {
  const cleanKey = serviceAccountKey.trim().replace(/^\uFEFF/, '');
  initializeApp({
    credential: cert(JSON.parse(cleanKey)),
  });
}

const db = getFirestore();

async function run() {
  const userDoc = await db.doc("users/0lk7ZuG3aTRXtgISGqbK1hwfS2v2").get();
  if (userDoc.exists) {
    const data = userDoc.data()!;
    const refreshTokenLen = data.refreshToken ? data.refreshToken.length : 0;
    delete data.refreshToken;
    console.log("User Profile Data:", {
      ...data,
      refreshTokenLength: refreshTokenLen,
    });
  } else {
    console.log("User not found");
  }
}

run().catch(console.error);
