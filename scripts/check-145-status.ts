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
  const uid = "0lk7ZuG3aTRXtgISGqbK1hwfS2v2";
  const d = await db.doc(`users/${uid}`).get();
  const userData = d.data();
  if (!userData) {
    console.log("User data not found");
    return;
  }
  const token = userData.refreshToken;
  console.log("Token prefix:", token ? token.substring(0, 15) : 'null');
  console.log("Token length:", token ? token.length : 'null');
  
  const snap = await db.collection(`users/${uid}/uploads`).get();
  console.log("\nUploads:");
  const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  list.sort((a, b) => b.createdAt - a.createdAt); // newest first
  
  list.slice(0, 10).forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`  Title: ${u.title}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  ScheduledAt: ${u.scheduledAt} (${u.scheduledAt ? new Date(u.scheduledAt).toLocaleString() : 'N/A'})`);
    console.log(`  Error: ${u.error}`);
    console.log("------------------------");
  });
}

run().then(() => process.exit(0)).catch(console.error);
