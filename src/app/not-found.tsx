import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        textAlign: "center",
        padding: 24,
      }}
    >
      <Logo href="/" />
      <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 800 }}>404</h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 420 }}>
        This page drifted off into the void. Let&apos;s get you back to uploading
        Shorts.
      </p>
      <ButtonLink href="/" size="lg">
        Back home
      </ButtonLink>
      <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Go to dashboard →
      </Link>
    </main>
  );
}
