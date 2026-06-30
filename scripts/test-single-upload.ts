import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!serviceAccountKey || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Missing credentials");
  process.exit(1);
}

if (!getApps().length) {
  const cleanKey = serviceAccountKey.trim().replace(/^\uFEFF/, '');
  initializeApp({
    credential: cert(JSON.parse(cleanKey)),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage().bucket();

async function run() {
  const uid = "0lk7ZuG3aTRXtgISGqbK1hwfS2v2";
  const docId = "7Xa5zfIOxX4a2S86NPl9";
  
  console.log(`Resetting upload ${docId} to scheduled...`);
  await db.doc(`users/${uid}/uploads/${docId}`).update({
    status: "scheduled",
    error: null
  });
  
  console.log("Starting Auto-Upload for this video...");
  const userDoc = await db.doc(`users/${uid}`).get();
  const userData = userDoc.data();
  if (!userData) throw new Error("User data not found");
  
  const uploadDoc = await db.doc(`users/${uid}/uploads/${docId}`).get();
  const upload = uploadDoc.data();
  if (!upload) throw new Error("Upload not found");
  
  console.log(`Processing upload ${uploadDoc.id} for user ${uid}`);
  
  if (!userData.refreshToken) {
    throw new Error(`User ${uid} has no refreshToken.`);
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: userData.refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // Start uploading
  await uploadDoc.ref.update({ status: "uploading" });

  try {
    if (!upload.storagePath) throw new Error("No storagePath found");
    const file = storage.file(upload.storagePath);
    const [exists] = await file.exists();
    if (!exists) throw new Error("File not found in storage");

    const [metadata] = await file.getMetadata();
    const fileSize = metadata.size;

    console.log(`Uploading ${fileSize} bytes to YouTube...`);
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: upload.title,
          description: upload.description,
        },
        status: {
          privacyStatus: upload.visibility,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: file.createReadStream(),
      },
    });

    const videoId = res.data.id;
    console.log(`Successfully uploaded video: ${videoId}`);

    // Update record
    await uploadDoc.ref.update({
      status: "completed",
      videoId: videoId || "",
    });

    // Update user stats
    await userDoc.ref.update({
      videosPosted: FieldValue.increment(1),
      totalUploads: FieldValue.increment(1),
      currentStorageUsed: FieldValue.increment(-Number(fileSize || 0)),
      videosDeletedFromFirebase: FieldValue.increment(1),
    });

    // Delete file from Firebase Storage
    await file.delete();
    console.log(`Cleaned up storage file: ${upload.storagePath}`);
    
  } catch (err: any) {
    console.error(`Error uploading video ${uploadDoc.id}:`, err?.message || err);
    await uploadDoc.ref.update({
      status: "failed",
      error: err?.message || "Unknown error during YouTube API upload"
    });
  }
}

run().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
