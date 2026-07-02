import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  UserProfile,
  UploadRecord,
  YouTubeChannel,
  UploadStatus,
} from "@/types";

const USERS = "users";
const UPLOADS = "uploads";

/** Create the user profile document if it does not already exist. */
export async function ensureUserProfile(profile: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const ref = doc(db, USERS, profile.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // Limit registration to 5 users during testing
  const usersSnap = await getDocs(collection(db, USERS));
  if (usersSnap.size >= 5) {
    throw new Error("Registration limit reached. Only 5 users are allowed during private testing.");
  }

  const now = Date.now();
  const newProfile: UserProfile = {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    channel: null,
    totalUploads: 0,
    lifetimeStorageUsed: 0,
    currentStorageUsed: 0,
    videosPosted: 0,
    videosDeletedFromFirebase: 0,
    totalVideosUploadedToFirebase: 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, newProfile);
  return newProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveConnectedChannel(
  uid: string,
  channel: YouTubeChannel,
  refreshToken?: string | null
): Promise<void> {
  const dataToUpdate: any = {
    channel,
    updatedAt: Date.now(),
  };
  if (refreshToken) {
    dataToUpdate.refreshToken = refreshToken;
  }
  await updateDoc(doc(db, USERS, uid), dataToUpdate);
}

export async function disconnectChannel(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    channel: null,
    updatedAt: Date.now(),
  });
}

export async function saveScheduleSettings(
  uid: string,
  scheduleSettings: import("@/types").WeeklySchedule
): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    scheduleSettings,
    updatedAt: Date.now(),
  });
}

/** Create an upload-history record and return its id. */
export async function createUploadRecord(
  record: Omit<UploadRecord, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, USERS, record.uid, UPLOADS), {
    ...record,
    serverCreatedAt: serverTimestamp(),
  } as DocumentData);
  return ref.id;
}

export async function updateUploadRecord(
  uid: string,
  id: string,
  patch: Partial<UploadRecord>
): Promise<void> {
  await updateDoc(doc(db, USERS, uid, UPLOADS, id), patch as DocumentData);
}

export async function deleteUploadRecord(
  uid: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, USERS, uid, UPLOADS, id));
}

export async function incrementUploadCount(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    totalUploads: increment(1),
    updatedAt: Date.now(),
  });
}

export async function updateStatsOnFirebaseUpload(uid: string, fileSize: number): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    lifetimeStorageUsed: increment(fileSize),
    currentStorageUsed: increment(fileSize),
    totalVideosUploadedToFirebase: increment(1),
    updatedAt: Date.now(),
  });
}

export async function updateStatsOnYouTubePostAndFirebaseDelete(uid: string, fileSize: number): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    videosPosted: increment(1),
    totalUploads: increment(1),
    currentStorageUsed: increment(-fileSize),
    videosDeletedFromFirebase: increment(1),
    updatedAt: Date.now(),
  });
}

export async function updateStatsOnFailureAndDelete(uid: string, fileSize: number): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    currentStorageUsed: increment(-fileSize),
    videosDeletedFromFirebase: increment(1),
    updatedAt: Date.now(),
  });
}

export async function getRecentUploads(
  uid: string,
  max = 20
): Promise<UploadRecord[]> {
  const q = query(
    collection(db, USERS, uid, UPLOADS),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UploadRecord, "id">) }));
}

export function subscribeToRecentUploads(
  uid: string,
  onUpdate: (uploads: UploadRecord[]) => void,
  max = 20
) {
  const q = query(
    collection(db, USERS, uid, UPLOADS),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    const uploads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UploadRecord, "id">) }));
    onUpdate(uploads);
  });
}

export async function deleteUserData(uid: string): Promise<void> {
  // Delete upload records, then the profile document.
  const q = query(collection(db, USERS, uid, UPLOADS));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, USERS, uid));
}

export type { UploadStatus };
