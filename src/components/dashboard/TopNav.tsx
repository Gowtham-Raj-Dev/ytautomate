"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cx } from "@/lib/utils";
import styles from "@/styles/TopNav.module.css";

export function TopNav() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.info("Signed out");
    router.replace("/login");
  };

  const channel = profile?.channel;
  const initials = (user?.displayName ?? user?.email ?? "U")
    .slice(0, 1)
    .toUpperCase();

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Upload", path: "/upload" },
    { name: "Autocut", path: "/autocut" },
    { name: "Your Channel", path: "/channel" },
  ];

  return (
    <header className={styles.nav}>
      <div className={cx("container", styles.inner)}>
        <Logo href="/" />

        <nav className={styles.centerNav}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cx(styles.navLink, pathname === link.path && styles.activeLink)}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>


          <div className={styles.menuWrap} ref={menuRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={open}
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarFallback}>{initials}</span>
              )}
            </button>

            {open && (
              <div className={styles.dropdown}>
                <div className={styles.dropHead}>
                  <div className={styles.dropName}>{user?.displayName ?? "User"}</div>
                  <div className={styles.dropEmail}>{user?.email}</div>
                </div>
                <Link href="/dashboard" className={styles.dropItem} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/settings" className={styles.dropItem} onClick={() => setOpen(false)}>
                  Settings
                </Link>
                <button className={cx(styles.dropItem, styles.dropDanger)} onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
