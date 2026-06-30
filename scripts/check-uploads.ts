import { initializeApp, getApps, cert } from 'firebase-admin/app';
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
  const uid = "0lk7ZuG3aTRXtgISGqbK1hwfS2v2";
  console.log(`Fetching uploads for user ${uid}...`);
  const snap = await db.collection(`users/${uid}/uploads`).get();
  
  const uploads = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log("Total uploads:", uploads.length);
  console.log("Uploads details:", JSON.stringify(uploads, null, 2));
}

run().catch(console.error);
