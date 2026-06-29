"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cx } from "@/lib/utils";
import { MdLogout } from "react-icons/md";
import styles from "@/styles/DashboardHeader.module.css";

export function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    try {
      await signOut();
      toast.info("Signed out successfully");
      // ProtectedRoute will automatically redirect to /login
    } catch (error) {
      console.error(error);
    }
  };

  const channel = profile?.channel;
  const initials = (user?.displayName ?? user?.email ?? "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Can put a mobile menu toggle here */}
      </div>

      <div className={styles.right}>
        {channel ? (
          <div className={styles.channel}>
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt=""
                width={28}
                height={28}
                className={styles.channelImg}
                style={{ width: "auto", height: "auto" }}
              />
            ) : (
              <span className={styles.channelDot} />
            )}
            <div className={styles.channelInfo}>
              <span className={styles.channelName}>{channel.title}</span>
              <span className={styles.live}>Connected</span>
            </div>
          </div>
        ) : (
          <span className={styles.notConnected}>No channel</span>
        )}

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={open}
            title="View Profile"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={42}
                height={42}
                className={styles.avatarImg}
                style={{ width: "auto", height: "auto" }}
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
              <button 
                className={cx(styles.dropItem, styles.dropDanger)} 
                onClick={() => {
                  setOpen(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <MdLogout size={18} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIconWrap}>
              <MdLogout size={28} color="var(--error)" />
            </div>
            <h2 className={styles.modalTitle}>Sign Out</h2>
            <p className={styles.modalText}>
              Are you sure you want to sign out of your account? You will need to sign in again to upload videos.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelBtn} 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.modalConfirmBtn} 
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
