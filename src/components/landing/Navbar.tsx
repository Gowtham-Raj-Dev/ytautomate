"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import styles from "@/styles/Navbar.module.css";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx(styles.nav, scrolled && styles.scrolled)}>
      <div className={cx("container", styles.inner)}>
        <Logo />

        <nav className={styles.links} aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className={styles.signin}>
                Sign in
              </Link>
              <ButtonLink href="/login" size="sm">
                Get Started
              </ButtonLink>
            </>
          )}
        </div>

        <button
          className={styles.menuBtn}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={cx(styles.bar, open && styles.bar1)} />
          <span className={cx(styles.bar, open && styles.bar2)} />
          <span className={cx(styles.bar, open && styles.bar3)} />
        </button>
      </div>

      {open && (
        <div className={styles.mobileMenu}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <ButtonLink href="/login" fullWidth>
            {user ? "Dashboard" : "Get Started"}
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
