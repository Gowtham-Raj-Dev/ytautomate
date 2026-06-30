import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey!)),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage().bucket();

async function run() {
  const docRef = db.doc("users/0lk7ZuG3aTRXtgISGqbK1hwfS2v2/uploads/CoePzyB4WO8LPujKAn8P");
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    console.log("Document not found");
    return;
  }

  const upload = docSnap.data()!;
  console.log("Upload Doc Data:", JSON.stringify(upload, null, 2));

  if (upload.storagePath) {
    console.log("Checking storage file:", upload.storagePath);
    const file = storage.file(upload.storagePath);
    const [exists] = await file.exists();
    console.log("File exists in storage:", exists);
    if (exists) {
      const [metadata] = await file.getMetadata();
      console.log("File size in bytes:", metadata.size);
      console.log("File content type:", metadata.contentType);
    }
  }
}

run().catch(console.error);
