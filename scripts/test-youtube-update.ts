import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
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
  const uid = "0lk7ZuG3aTRXtgISGqbK1hwfS2v2";
  
  console.log(`[1] Fetching user doc for ${uid}...`);
  const userDoc = await db.doc(`users/${uid}`).get();
  const userData = userDoc.data();
  if (!userData) throw new Error("User data not found");
  
  if (!userData.refreshToken) {
    throw new Error("No refresh token found for this user");
  }

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: userData.refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // Get the most recent uploaded video from Firestore for this user
  console.log(`[2] Fetching recent completed upload for ${uid}...`);
  const uploadsSnap = await db.collection(`users/${uid}/uploads`)
    .where("status", "==", "completed")
    .limit(1)
    .get();

  if (uploadsSnap.empty) {
    console.log("No completed uploads found. Let's look for scheduled ones to get a videoId if possible...");
    process.exit(0);
  }

  const uploadDoc = uploadsSnap.docs[0];
  const upload = uploadDoc.data();
  const videoId = upload.videoId;

  if (!videoId) {
    console.error("No videoId found in the completed upload document");
    process.exit(1);
  }

  console.log(`[3] Attempting to update description for videoId: ${videoId}`);
  
  try {
    // 1. List video to get current snippet
    console.log("Fetching video details from YouTube...");
    const videoRes = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId]
    });

    const videoItem = videoRes.data.items?.[0];
    if (!videoItem || !videoItem.snippet) {
      throw new Error(`Video ${videoId} not found on YouTube (or it is private/deleted)`);
    }

    const snippet = videoItem.snippet;
    console.log("Current Description:", snippet.description);

    // 2. Perform the update
    snippet.description = `Test Update at ${new Date().toISOString()}\n\n` + snippet.description;

    console.log("Sending update request to YouTube...");
    const updateRes = await youtube.videos.update({
      part: ["snippet"],
      requestBody: {
        id: videoId,
        snippet: snippet
      }
    });

    console.log("Successfully updated YouTube description! New description preview:");
    console.log(updateRes.data.snippet?.description);
  } catch (err: any) {
    console.error("FAILED to update video:", err?.response?.data || err?.message || err);
  }
}

run().catch(console.error);
