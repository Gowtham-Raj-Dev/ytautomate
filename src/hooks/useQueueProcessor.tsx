import { useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "./useAuth";
import { updateUploadRecord, incrementUploadCount, updateStatsOnYouTubePostAndFirebaseDelete, deleteUploadRecord } from "@/services/firestore";
import { uploadShort } from "@/services/youtube";
import { deleteVideoFromStorage } from "@/services/storage";
import { useToast } from "./useToast";
import type { UploadRecord } from "@/types";

export function useQueueProcessor() {
  const { user, session, hasValidToken, refreshProfile } = useAuth();
  const toast = useToast();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!user || !session || !hasValidToken) return;

    const processQueue = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const now = Date.now();
        const q = query(
          collection(db, "users", user.uid, "uploads"),
          where("status", "==", "scheduled")
        );
        
        const snap = await getDocs(q);
        const scheduledUploads = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UploadRecord)
        );

        const dueUploads = scheduledUploads.filter(
          (record) => !record.scheduledAt || record.scheduledAt <= now
        );

        for (const record of dueUploads) {
          if (!record.fileUrl || !record.storagePath) continue;

          // Mark as uploading so we don't process it again
          await updateUploadRecord(user.uid, record.id, { status: "uploading" });

          try {
            // 1. Fetch file from Firebase Storage
            const response = await fetch(record.fileUrl);
            const blob = await response.blob();
            const file = new File([blob], record.fileName, { type: blob.type });

            // 2. Upload to YouTube
            const result = await uploadShort({
              accessToken: session.accessToken,
              file,
              metadata: {
                title: record.title,
                description: record.description,
                visibility: record.visibility,
              },
            });

            // 3. Update Firestore to keep history as Published
            await updateUploadRecord(user.uid, record.id, { 
              status: "completed",
              videoId: result.videoId || "" 
            });

            await updateStatsOnYouTubePostAndFirebaseDelete(user.uid, record.fileSize);
            await refreshProfile();
            
            // 4. Clean up Firebase Storage
            await deleteVideoFromStorage(record.storagePath);
            
            toast.success(`Scheduled video "${record.title}" uploaded! 🎉`);

          } catch (err: any) {
            console.error("Queue upload error:", err);
            await updateUploadRecord(user.uid, record.id, {
              status: "failed",
              error: err.message || "Failed to process scheduled upload",
            });
            toast.error(`Failed to upload scheduled video: ${record.title}`);
          }
        }
      } catch (err) {
        console.error("Error fetching scheduled uploads:", err);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(processQueue, 30000);
    
    // Initial check
    processQueue();

    return () => clearInterval(intervalId);
  }, [user, session, hasValidToken, refreshProfile, toast]);
}
