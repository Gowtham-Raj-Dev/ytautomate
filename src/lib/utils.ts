/** Small, dependency-free helpers shared across the app. */

/** Join class names, skipping falsy values. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Human-readable file size, e.g. 1536 → "1.5 KB". */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Format an epoch ms value as "Jun 18, 2026". */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format an epoch ms value as "Jun 18, 2026 - 10:00 AM". */
export function formatDateTime(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact number formatting, e.g. 12500 → "12.5K". */
export function formatCount(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
export const ACCEPTED_TYPES = ["video/mp4"];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate a file is an MP4 within the size limit. */
export function validateVideoFile(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".mp4")) {
    return { valid: false, error: "Only MP4 files are supported." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE, 0)}.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty." };
  }
  return { valid: true };
}

/** Turn an unknown thrown value into a readable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}
