import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
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
  console.log("Starting User Stats Correction Migration...");
  const usersSnap = await db.collection("users").get();
  
  if (usersSnap.empty) {
    console.log("No users found in database.");
    return;
  }

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    console.log(`Processing stats correction for user: ${uid} (${userData.displayName || 'No Name'})`);

    const uploadsSnap = await userDoc.ref.collection("uploads").get();
    
    let totalScheduledSize = 0;
    let scheduledCount = 0;
    let completedCount = 0;
    let failedOrCancelledCount = 0;
    let totalDeletedFromFirebase = 0;

    for (const uDoc of uploadsSnap.docs) {
      const upload = uDoc.data();
      const status = upload.status;

      if (status === "scheduled" || status === "uploading") {
        scheduledCount++;
        totalScheduledSize += Number(upload.fileSize || 0);
      } else if (status === "completed") {
        completedCount++;
        totalDeletedFromFirebase++; // Completed files are deleted from Storage
        
        // Ensure file is deleted from storage
        if (upload.storagePath) {
          try {
            const fileRef = storage.file(upload.storagePath);
            const [exists] = await fileRef.exists();
            if (exists) {
              console.log(`  - Deleting stray storage file for completed upload ${uDoc.id}: ${upload.storagePath}`);
              await fileRef.delete();
            }
          } catch (e) {
            console.error(`  - Failed to delete file for completed upload ${uDoc.id}:`, e);
          }
        }
      } else if (status === "failed" || status === "cancelled") {
        failedOrCancelledCount++;
        totalDeletedFromFirebase++; // Failed/cancelled files are also deleted to save space
        
        // Ensure file is deleted from storage
        if (upload.storagePath) {
          try {
            const fileRef = storage.file(upload.storagePath);
            const [exists] = await fileRef.exists();
            if (exists) {
              console.log(`  - Deleting storage file for failed/cancelled upload ${uDoc.id}: ${upload.storagePath}`);
              await fileRef.delete();
            }
          } catch (e) {
            console.error(`  - Failed to delete file for failed upload ${uDoc.id}:`, e);
          }
        }
      }
    }

    const totalVideosUploadedToFirebase = uploadsSnap.size;

    console.log(`  Calculated stats for ${uid}:`);
    console.log(`    - Total Videos Uploaded: ${totalVideosUploadedToFirebase}`);
    console.log(`    - Scheduled/Uploading Count: ${scheduledCount}`);
    console.log(`    - Completed (Posted) Count: ${completedCount}`);
    console.log(`    - Failed/Cancelled Count: ${failedOrCancelledCount}`);
    console.log(`    - Total Deleted from Firebase (Completed + Failed/Cancelled): ${totalDeletedFromFirebase}`);
    console.log(`    - Total Scheduled Storage Size: ${totalScheduledSize} bytes`);

    // Update user profile document in Firestore
    await userDoc.ref.update({
      videosPosted: completedCount,
      totalUploads: completedCount,
      currentStorageUsed: totalScheduledSize,
      videosDeletedFromFirebase: totalDeletedFromFirebase,
      totalVideosUploadedToFirebase: totalVideosUploadedToFirebase,
      updatedAt: Date.now(),
    });
    
    console.log(`  - Updated user document successfully!`);
    console.log("-----------------------------------------");
  }
  
  console.log("Migration finished successfully!");
}

run().catch(console.error);
