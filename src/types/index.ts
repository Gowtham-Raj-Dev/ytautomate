/**
 * Shared application types for YT Automate.
 */

export type Visibility = "public" | "private" | "unlisted";

export type UploadStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "scheduled";

/** A connected YouTube channel snapshot stored on the user profile. */
export interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string | null;
  customUrl?: string | null;
  subscriberCount?: string | null;
  videoCount?: string | null;
}

export interface WeeklySchedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

/** The Firestore user profile document. */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  channel: YouTubeChannel | null;
  totalUploads: number;
  lifetimeStorageUsed?: number;
  currentStorageUsed?: number;
  videosPosted?: number;
  videosDeletedFromFirebase?: number;
  totalVideosUploadedToFirebase?: number;
  scheduleSettings?: WeeklySchedule;
  createdAt: number;
  updatedAt: number;
  refreshToken?: string | null;
}

/** A single upload-history record stored in Firestore. */
export interface UploadRecord {
  id: string;
  uid: string;
  videoId: string | null;
  title: string;
  description: string;
  visibility: Visibility;
  status: UploadStatus;
  thumbnail: string | null;
  fileName: string;
  fileSize: number;
  createdAt: number;
  scheduledAt?: number | null;
  fileUrl?: string;
  storagePath?: string;
  error?: string | null;
  uploadType?: "single" | "bulk";
}

/** Metadata for a new upload submitted from the dashboard. */
export interface UploadMetadata {
  title: string;
  description: string;
  visibility: Visibility;
}

/** Google OAuth credential captured at sign-in time. */
export interface OAuthSession {
  accessToken: string;
  /** epoch ms when the access token expires (best-effort). */
  expiresAt: number;
}
