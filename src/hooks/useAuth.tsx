"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/firebase/config";
import { signInWithGoogle, signOutUser } from "@/firebase/auth";
import {
  ensureUserProfile,
  getUserProfile,
  saveConnectedChannel,
  disconnectChannel as disconnectChannelDoc,
} from "@/services/firestore";
import { fetchMyChannel } from "@/services/youtube";
import type { OAuthSession, UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: OAuthSession | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  disconnectChannel: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** True when we hold a non-expired OAuth access token for YouTube. */
  hasValidToken: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_KEY = "yta_oauth_session";

function loadSession(): OAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OAuthSession;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: OAuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Restore any cached OAuth session lazily (client-only; null on the server).
  const [session, setSession] = useState<OAuthSession | null>(() => loadSession());
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const p = await getUserProfile(auth.currentUser.uid);
    setProfile(p);
  }, []);

  // Subscribe to Firebase auth state.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        const p = await ensureUserProfile({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    const { user: fbUser, session: newSession, refreshToken } = await signInWithGoogle();
    setUser(fbUser);

    const p = await ensureUserProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
    });
    setProfile(p);

    if (newSession) {
      setSession(newSession);
      persistSession(newSession);

      // Best-effort: fetch + persist the connected channel right away.
      try {
        const channel = await fetchMyChannel(newSession.accessToken);
        if (channel) {
          await saveConnectedChannel(fbUser.uid, channel, refreshToken);
          setProfile({ ...p, channel, refreshToken: refreshToken ?? undefined });
        }
      } catch {
        // Non-fatal — channel can be (re)connected from Settings.
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setSession(null);
    persistSession(null);
    setProfile(null);
    setUser(null);
  }, []);

  const disconnectChannel = useCallback(async () => {
    if (!auth.currentUser) return;
    await disconnectChannelDoc(auth.currentUser.uid);
    setSession(null);
    persistSession(null);
    setProfile((prev) => (prev ? { ...prev, channel: null } : prev));
  }, []);

  // Presence of a cached session implies validity — loadSession() discards
  // expired tokens, and a stale token surfaces as a 401 at upload time.
  const hasValidToken = Boolean(session);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signOut,
        disconnectChannel,
        refreshProfile,
        hasValidToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
