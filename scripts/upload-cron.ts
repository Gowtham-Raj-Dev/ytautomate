import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
// We expect FIREBASE_SERVICE_ACCOUNT_KEY env variable as a JSON string
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env variable");
  process.exit(1);
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env variables");
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
  console.log("Starting Auto-Upload Cron Job...");
  const now = Date.now();

  try {
    // Query users first to avoid collectionGroup index issues
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
            console.error(`User ${uid} has no refreshToken. Failing upload.`);
            await uploadDoc.ref.update({
              status: "failed",
              error: "Google Offline Access Token not found. Please re-connect your YouTube account in Settings."
            });
            continue;
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

            // Fetch file size for metadata
            const [metadata] = await file.getMetadata();
            const fileSize = metadata.size;

            console.log(`Uploading to YouTube...`);
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

            // Update record
            await uploadDoc.ref.update({
              status: "completed",
              videoId: videoId || "",
              description: updatedDescription
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
    console.log("Cron job finished successfully.");
  } catch (err) {
    console.error("Cron job failed:", err);
    process.exit(1);
  }
}

run();
