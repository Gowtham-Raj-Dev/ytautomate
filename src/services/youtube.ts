import type { UploadMetadata, YouTubeChannel } from "@/types";

const YT_API = "https://www.googleapis.com/youtube/v3";
const YT_UPLOAD =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export class YouTubeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "YouTubeError";
    this.status = status;
  }
}

/** Fetch the authenticated user's primary YouTube channel. */
export async function fetchMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
  const res = await fetch(
    `${YT_API}/channels?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new YouTubeError(
      `Failed to load channel (${res.status})`,
      res.status
    );
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    title: item.snippet?.title ?? "Untitled Channel",
    thumbnail: item.snippet?.thumbnails?.default?.url ?? null,
    customUrl: item.snippet?.customUrl ?? null,
    subscriberCount: item.statistics?.subscriberCount ?? null,
    videoCount: item.statistics?.videoCount ?? null,
  };
}

export interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export async function fetchDashboardVideos(accessToken: string): Promise<YTVideo[]> {
  // Step 1: Get 'uploads' playlist ID
  const channelRes = await fetch(
    `${YT_API}/channels?part=contentDetails&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!channelRes.ok) throw new YouTubeError("Failed to fetch channel details", channelRes.status);
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  // Step 2: Get video IDs from the uploads playlist (max 50)
  const playlistRes = await fetch(
    `${YT_API}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!playlistRes.ok) throw new YouTubeError("Failed to fetch playlist", playlistRes.status);
  const playlistData = await playlistRes.json();
  
  const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId) || [];
  if (videoIds.length === 0) return [];

  // Step 3: Get video statistics and snippet
  const videosRes = await fetch(
    `${YT_API}/videos?part=snippet,statistics&id=${videoIds.join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!videosRes.ok) throw new YouTubeError("Failed to fetch videos stats", videosRes.status);
  const videosData = await videosRes.json();

  return videosData.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount || "0",
    likeCount: item.statistics.likeCount || "0",
    commentCount: item.statistics.commentCount || "0",
  }));
}

export interface UploadResult {
  videoId: string;
  thumbnail: string | null;
}

export interface ResumableUploadOptions {
  accessToken: string;
  file: File;
  metadata: UploadMetadata;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Upload a video to YouTube using a resumable session.
 *
 * Step 1: POST metadata to obtain an upload URL.
 * Step 2: PUT the binary via XMLHttpRequest so we can report real progress.
 */
export async function uploadShort({
  accessToken,
  file,
  metadata,
  onProgress,
  signal,
}: ResumableUploadOptions): Promise<UploadResult> {
  // ── Step 1: initiate the resumable session ──
  const initRes = await fetch(YT_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": file.type || "video/mp4",
      "X-Upload-Content-Length": String(file.size),
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        // #Shorts in the description/title helps YouTube classify the video.
        tags: ["Shorts"],
        categoryId: "22",
      },
      status: {
        privacyStatus: metadata.visibility,
        selfDeclaredMadeForKids: false,
      },
    }),
    signal,
  });

  if (!initRes.ok) {
    const text = await initRes.text().catch(() => "");
    throw new YouTubeError(
      `Could not start upload (${initRes.status}). ${text}`,
      initRes.status
    );
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new YouTubeError("YouTube did not return an upload URL.", 500);
  }

  // ── Step 2: send the bytes with progress tracking ──
  const videoId = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.id);
        } catch {
          reject(new YouTubeError("Malformed YouTube response.", 500));
        }
      } else {
        reject(new YouTubeError(`Upload failed (${xhr.status}).`, xhr.status));
      }
    };

    xhr.onerror = () => reject(new YouTubeError("Network error during upload.", 0));
    xhr.onabort = () => reject(new YouTubeError("Upload cancelled.", 0));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(file);
  });

  return {
    videoId,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}
