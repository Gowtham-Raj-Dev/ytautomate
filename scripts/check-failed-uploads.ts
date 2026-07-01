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
  console.log("Fetching recent uploads from Firestore (sorting in memory)...");
  
  const uploadsSnap = await db.collectionGroup("uploads").get();

  if (uploadsSnap.empty) {
    console.log("No uploads found in Firestore");
    return;
  }

  // Sort in memory by createdAt desc
  const docs = uploadsSnap.docs
    .map(doc => ({ id: doc.id, path: doc.ref.path, data: doc.data() }))
    .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))
    .slice(0, 40);

  console.log(`Found ${docs.length} recent uploads:`);
  docs.forEach((doc) => {
    console.log(`- ID: ${doc.id}`);
    console.log(`  Path: ${doc.path}`);
    console.log(`  Title: ${doc.data.title}`);
    console.log(`  Status: ${doc.data.status}`);
    console.log(`  Created: ${new Date(doc.data.createdAt).toLocaleString()}`);
    console.log(`  Error: ${doc.data.error}`);
    console.log(`  Upload Type: ${doc.data.uploadType}`);
    console.log("-----------------------------------------");
  });
}

run().catch(console.error);
