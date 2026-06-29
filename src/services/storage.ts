import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import app from "@/firebase/config";
import { formatBytes } from "@/lib/utils";

export const storage = getStorage(app);

export interface StorageUploadResult {
  url: string;
  path: string;
}

export async function uploadVideoToStorage(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `uploads/${uid}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function deleteVideoFromStorage(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Error deleting file from storage:", err);
  }
}
