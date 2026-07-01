import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    const accessToken = authHeader.split(" ")[1];

    const { videoId, title, description } = await request.json();
    if (!videoId || !title || !description) {
      return NextResponse.json({ error: "Missing required fields (videoId, title, description)" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    console.log(`Updating description for video ${videoId} on server...`);

    // Fetch existing snippet to preserve properties (like categoryId, tags, etc.)
    const videoRes = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId]
    });

    const videoItem = videoRes.data.items?.[0];
    if (!videoItem || !videoItem.snippet) {
      throw new Error("Video not found on YouTube");
    }

    const snippet = videoItem.snippet;
    snippet.description = description;

    await youtube.videos.update({
      part: ["snippet"],
      requestBody: {
        id: videoId,
        snippet: snippet
      }
    });

    console.log(`Successfully updated description on YouTube for video ${videoId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating YouTube video description:", err);
    return NextResponse.json({ error: err.message || "Failed to update description" }, { status: 500 });
  }
}
