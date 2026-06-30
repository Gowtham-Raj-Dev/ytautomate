import { NextResponse } from "next/server";
import { google } from "googleapis";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!getApps().length && serviceAccountKey) {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey.trim())),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = getFirestore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const uid = searchParams.get("state");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!code || !uid) {
    console.error("Callback missing parameters. Code:", !!code, "UID:", !!uid);
    return NextResponse.redirect(`${siteUrl}/settings?error=${encodeURIComponent("Missing required authorization parameters")}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${siteUrl}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn("No refresh token returned by Google OAuth.");
    }

    // Fetch channel details using the Google API
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });

    const channelItem = channelRes.data.items?.[0];
    if (!channelItem) {
      throw new Error("No YouTube channel found for this Google account.");
    }

    const channelData = {
      id: channelItem.id,
      title: channelItem.snippet?.title || "Unknown Channel",
      thumbnail: channelItem.snippet?.thumbnails?.default?.url || "",
      customUrl: channelItem.snippet?.customUrl || "",
      subscriberCount: channelItem.statistics?.subscriberCount || "0",
      videoCount: channelItem.statistics?.videoCount || "0",
    };

    // Save channel info and Google refresh token to Firestore
    const userRef = db.doc(`users/${uid}`);
    const dataToUpdate: any = {
      channel: channelData,
      updatedAt: Date.now(),
    };

    if (tokens.refresh_token) {
      dataToUpdate.refreshToken = tokens.refresh_token;
    }

    await userRef.update(dataToUpdate);

    return NextResponse.redirect(`${siteUrl}/settings?connected=success`);

  } catch (error: any) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(`${siteUrl}/settings?error=${encodeURIComponent(error.message || "Failed to connect YouTube channel")}`);
  }
}
