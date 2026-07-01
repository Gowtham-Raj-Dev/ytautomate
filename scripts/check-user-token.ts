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
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey.trim())),
  });
}

const db = getFirestore();

async function run() {
  const uid = "vmwtAPwA8zWBpFlJ5kuQmSQD1in1";
  console.log(`Checking user details for UID: ${uid}`);
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) {
    console.log("User document does not exist in Firestore!");
    return;
  }
  const data = userDoc.data() || {};
  console.log("User Document Data:");
  console.log(`- Channel Title: ${data.channel?.title}`);
  console.log(`- Has Refresh Token: ${!!data.refreshToken}`);
  if (data.refreshToken) {
    console.log(`- Refresh Token Length: ${data.refreshToken.length}`);
    console.log(`- Refresh Token Preview: ${data.refreshToken.substring(0, 10)}...`);
  }
  console.log(`- Updated At: ${data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}`);
}

run().catch(console.error);
