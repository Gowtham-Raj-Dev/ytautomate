"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { errorMessage } from "@/lib/utils";
import styles from "@/styles/Login.module.css";

const PERKS = [
  "Upload Shorts without YouTube Studio",
  "Secure Google sign-in",
  "Track every upload in one place",
];

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSignIn = async () => {
    setSubmitting(true);
    try {
      await signIn();
      toast.success("Signed in successfully!");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden />
      <Logo href="/" />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>
          Sign in to connect your channel and start uploading Shorts.
        </p>

        <button
          className={styles.googleBtn}
          onClick={handleSignIn}
          disabled={submitting || loading}
        >
          {submitting ? (
            <Spinner size={18} />
          ) : (
            <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <ul className={styles.perks}>
          {PERKS.map((p) => (
            <li key={p}>
              <span className={styles.check} aria-hidden>✓</span> {p}
            </li>
          ))}
        </ul>

        <p className={styles.terms}>
          By continuing you agree to our <a href="#">Terms</a> and{" "}
          <a href="#">Privacy Policy</a>. We request only the YouTube upload scope.
        </p>
      </motion.div>

      <p className={styles.back}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
