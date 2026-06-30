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
  console.log(`Checking scheduled/uploading uploads for user ${uid}...`);
  
  const snap = await db.collection(`users/${uid}/uploads`).get();
  
  const list = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .filter(u => u.status === "uploading" || u.status === "scheduled" || (u.scheduledAt && u.scheduledAt > 1782780000000));

  console.log("Filtered uploads count:", list.length);
  list.forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`  Title: ${u.title}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  ScheduledAt: ${u.scheduledAt} (${u.scheduledAt ? new Date(u.scheduledAt).toLocaleString() : 'N/A'})`);
    console.log(`  Error: ${u.error}`);
    console.log("------------------------");
  });
}

run().catch(console.error);
