import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./config";
import type { OAuthSession } from "@/types";

/** Scopes requested from Google — includes YouTube upload permission. */
export const YOUTUBE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function buildProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  YOUTUBE_SCOPES.forEach((scope) => provider.addScope(scope));
  // Force account chooser + consent so we always receive a fresh OAuth token and refresh token.
  provider.setCustomParameters({ prompt: "consent select_account", access_type: "offline" });
  return provider;
}

export interface SignInResult {
  user: User;
  session: OAuthSession | null;
  refreshToken?: string | null;
}

/**
 * Sign in with Google via popup and capture the OAuth access token required to
 * call the YouTube Data API.
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  const result = await signInWithPopup(auth, buildProvider());
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken ?? null;
  const refreshToken = (result as any)._tokenResponse?.refreshToken ?? null;

  return {
    user: result.user,
    refreshToken,
    session: accessToken
      ? {
          accessToken,
          // Google access tokens are valid ~1 hour; store a best-effort expiry.
          expiresAt: Date.now() + 55 * 60 * 1000,
        }
      : null,
  };
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
