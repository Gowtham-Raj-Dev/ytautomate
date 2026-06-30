import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    
    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const siteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`;
    const redirectUri = `${siteUrl}/api/auth/google/callback`;

    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly"
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(" "))}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${uid}`;

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("Error creating Google Auth redirect:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
