import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!getApps().length && serviceAccountKey) {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey.trim())),
  });
}

const db = getFirestore();

async function run() {
  const d = await db.doc('users/0lk7ZuG3aTRXtgISGqbK1hwfS2v2').get();
  const token = d.data()?.refreshToken;
  if (!token) {
    console.log('Token is missing');
  } else {
    console.log('Token starts with:', token.substring(0, 10));
    console.log('Total length:', token.length);
  }
}

run().then(() => process.exit(0)).catch(console.error);
