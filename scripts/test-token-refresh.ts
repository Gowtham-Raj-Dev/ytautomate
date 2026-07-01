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
  const uid = "vmwtAPwA8zWBpFlJ5kuQmSQD1in1";
  console.log(`Fetching user ${uid} to test token refresh...`);
  const userDoc = await db.doc(`users/${uid}`).get();
  const userData = userDoc.data();
  if (!userData || !userData.refreshToken) {
    throw new Error("No refresh token found in DB");
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  console.log(`Using Client ID: ${GOOGLE_CLIENT_ID}`);

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: userData.refreshToken });

  try {
    console.log("Requesting refreshed access token from Google...");
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log("SUCCESS! Refreshed access token successfully.");
    console.log(`New Access Token: ${credentials.access_token?.substring(0, 10)}...`);
  } catch (err: any) {
    console.error("FAILED to refresh token:");
    console.error(err?.response?.data || err?.message || err);
  }
}

run().catch(console.error);
