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
  console.log("Listing all users from Firestore...");
  const usersSnap = await db.collection("users").get();
  
  if (usersSnap.empty) {
    console.log("No users found in database.");
    return;
  }

  console.log(`Found ${usersSnap.size} users:`);
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    console.log(`- UID: ${doc.id}`);
    console.log(`  Display Name: ${data.displayName}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Channel Title: ${data.channel?.title}`);
    console.log(`  Has Refresh Token: ${!!data.refreshToken}`);
    
    // Fetch uploads for this user
    const uploadsSnap = await doc.ref.collection("uploads").get();
    console.log(`  Uploads count: ${uploadsSnap.size}`);
    if (uploadsSnap.size > 0) {
      uploadsSnap.docs.forEach(uDoc => {
        const uData = uDoc.data();
        console.log(`    * Upload ID: ${uDoc.id}`);
        console.log(`      Title: ${uData.title}`);
        console.log(`      Status: ${uData.status}`);
        console.log(`      Error: ${uData.error}`);
        console.log(`      Created: ${new Date(uData.createdAt).toLocaleString()}`);
      });
    }
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
