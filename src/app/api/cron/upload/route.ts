import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!getApps().length && serviceAccountKey) {
  const cleanKey = serviceAccountKey.trim().replace(/^\uFEFF/, '');
  initializeApp({
    credential: cert(JSON.parse(cleanKey)),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = getFirestore();
const storage = getStorage().bucket();

export async function GET(request: Request) {
  console.log("Triggering Auto-Upload via API Cron...");
  const now = Date.now();
  const processed: string[] = [];

  try {
    const usersSnap = await db.collection("users").get();
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      
      const uploadsSnap = await db.collection(`users/${uid}/uploads`)
        .where("status", "==", "scheduled")
        .get();

      for (const uploadDoc of uploadsSnap.docs) {
        const upload = uploadDoc.data();
        if (upload.scheduledAt && upload.scheduledAt <= now) {
          console.log(`Processing upload ${uploadDoc.id} for user ${uid}`);
          
          if (!userData.refreshToken) {
            console.error(`User ${uid} has no refreshToken.`);
            await uploadDoc.ref.update({
              status: "failed",
              error: "Google Offline Access Token not found. Please re-connect your YouTube account in Settings."
            });
            continue;
          }

          const clientId = process.env.GOOGLE_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
          oauth2Client.setCredentials({ refresh_token: userData.refreshToken });

          const youtube = google.youtube({ version: "v3", auth: oauth2Client });

          await uploadDoc.ref.update({ status: "uploading" });

          try {
            if (!upload.storagePath) throw new Error("No storagePath found");
            const file = storage.file(upload.storagePath);
            const [exists] = await file.exists();
            if (!exists) throw new Error("File not found in storage");

            const [metadata] = await file.getMetadata();
            const fileSize = metadata.size;

            console.log(`Uploading ${uploadDoc.id} to YouTube...`);
            const res = await youtube.videos.insert({
              part: ["snippet", "status"],
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
            const snippet = res.data.snippet;
            console.log(`Successfully uploaded video: ${videoId}`);

            let updatedDescription = upload.description || "";
            const hasPlaceholder = updatedDescription.includes("{video_url}") || updatedDescription.includes("{videoId}");
            
            if (hasPlaceholder && videoId && snippet) {
              updatedDescription = updatedDescription
                .replace(/{video_url}/g, `https://youtu.be/${videoId}`)
                .replace(/{videoId}/g, videoId);
              
              console.log(`Placeholder found. Updating description on YouTube...`);
              snippet.description = updatedDescription;
              
              try {
                await youtube.videos.update({
                  part: ['snippet'],
                  requestBody: {
                    id: videoId,
                    snippet: snippet
                  }
                });
                console.log(`Successfully updated description on YouTube!`);
              } catch (updateErr: any) {
                console.error(`Failed to update description on YouTube:`, updateErr?.message || updateErr);
              }
            }

            await uploadDoc.ref.update({
              status: "completed",
              videoId: videoId || "",
              description: updatedDescription
            });

            await userDoc.ref.update({
              videosPosted: FieldValue.increment(1),
              totalUploads: FieldValue.increment(1),
              currentStorageUsed: FieldValue.increment(-Number(fileSize || 0)),
              videosDeletedFromFirebase: FieldValue.increment(1),
            });

            await file.delete();
            console.log(`Cleaned up storage file: ${upload.storagePath}`);
            processed.push(uploadDoc.id);
            
          } catch (err: any) {
            console.error(`Error uploading video ${uploadDoc.id}:`, err?.message || err);
            await uploadDoc.ref.update({
              status: "failed",
              error: err?.message || "Unknown error during YouTube API upload"
            });

            // Delete storage file on failure to free up space
            try {
              if (upload.storagePath) {
                const file = storage.file(upload.storagePath);
                const [exists] = await file.exists();
                if (exists) {
                  await file.delete();
                  console.log(`Cleaned up storage file on failure: ${upload.storagePath}`);
                }
              }
            } catch (cleanupErr) {
              console.error(`Failed to clean up storage file on failure:`, cleanupErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed });

  } catch (err: any) {
    console.error("Cron job failed:", err);
    return NextResponse.json({ error: err.message || "Internal Cron Error" }, { status: 500 });
  }
}
