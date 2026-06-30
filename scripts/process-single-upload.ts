import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey.trim())),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage().bucket();

async function run() {
  const uid = "0lk7ZuG3aTRXtgISGqbK1hwfS2v2";
  const uploadId = "CoePzyB4WO8LPujKAn8P";
  
  console.log(`[1] Fetching user doc for ${uid}...`);
  const userDoc = await db.doc(`users/${uid}`).get();
  const userData = userDoc.data();
  if (!userData) throw new Error("User data not found");
  console.log("[2] User doc fetched successfully. Refresh token present:", !!userData.refreshToken);

  console.log(`[3] Fetching upload doc ${uploadId}...`);
  const uploadRef = db.doc(`users/${uid}/uploads/${uploadId}`);
  const uploadSnap = await uploadRef.get();
  const upload = uploadSnap.data();
  if (!upload) throw new Error("Upload data not found");
  console.log("[4] Upload doc fetched. Status was:", upload.status);

  console.log("[5] Resetting upload status to 'scheduled'...");
  await uploadRef.update({ status: "scheduled", error: null });

  console.log("[6] Initializing Google OAuth2 client...");
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: userData.refreshToken });

  console.log("[7] Initializing YouTube API...");
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log("[8] Updating status to 'uploading'...");
  await uploadRef.update({ status: "uploading" });

  try {
    if (!upload.storagePath) throw new Error("No storagePath found");
    console.log("[9] Accessing storage file:", upload.storagePath);
    const file = storage.file(upload.storagePath);
    
    console.log("[10] Checking if storage file exists...");
    const [exists] = await file.exists();
    console.log("[11] Storage file exists:", exists);
    if (!exists) throw new Error("File not found in storage");

    console.log("[12] Fetching storage file metadata...");
    const [metadata] = await file.getMetadata();
    const fileSize = metadata.size;
    console.log("[13] File size:", fileSize);

    console.log("[14] Creating file read stream...");
    const fileStream = file.createReadStream();

    console.log("[15] Starting YouTube upload (youtube.videos.insert)...");
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
        body: fileStream,
      },
    });

    const videoId = res.data.id;
    console.log(`[16] Successfully uploaded video! YouTube Video ID: ${videoId}`);

    console.log("[17] Updating upload record in Firestore...");
    await uploadRef.update({
      status: "completed",
      videoId: videoId || "",
    });

    console.log("[18] Deleting file from Firebase Storage...");
    await file.delete();
    console.log("[19] Successfully cleaned up storage file!");

  } catch (err: any) {
    console.error("[ERROR] Failed during upload process:", err?.message || err);
    await uploadRef.update({
      status: "failed",
      error: err?.message || "Unknown error during YouTube API upload"
    });
  }
}

run().catch(console.error);
