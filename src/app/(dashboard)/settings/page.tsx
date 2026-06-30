"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { deleteUser } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { deleteUserData } from "@/services/firestore";
import { formatCount, errorMessage } from "@/lib/utils";
import styles from "@/styles/Settings.module.css";
import { ScheduleSettings } from "@/components/dashboard/ScheduleSettings";
import { MdLightbulbOutline, MdVerified, MdAutoGraph, MdOutlineSpeed } from "react-icons/md";

export default function SettingsPage() {
  const { user, profile, signIn, signOut, disconnectChannel } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const channel = profile?.channel;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connected") === "success") {
      toast.success("YouTube channel connected successfully!");
      router.replace("/settings");
    } else if (urlParams.get("error")) {
      toast.error(urlParams.get("error") || "Failed to connect channel");
      router.replace("/settings");
    }
  }, [router, toast]);

  const handleReconnect = () => {
    if (!user) return;
    setBusy("reconnect");
    window.location.href = `/api/auth/google/connect?uid=${user.uid}`;
  };

  const handleDisconnect = async () => {
    setBusy("disconnect");
    try {
      await disconnectChannel();
      toast.info("Channel disconnected.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleDelete = async () => {
    if (!user) return;
    setBusy("delete");
    try {
      await deleteUserData(user.uid);
      await deleteUser(user);
      toast.success("Account deleted.");
      router.replace("/");
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(
        msg.includes("requires-recent-login")
          ? "Please sign in again before deleting your account."
          : msg
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.contentCol}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.sub}>Manage your channel connection and account.</p>
      </motion.div>

      <div>
        {/* Connected channel */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Connected YouTube Account</h2>
          </div>

          {channel ? (
            <div className={styles.channel}>
              {channel.thumbnail ? (
                <Image
                  src={channel.thumbnail}
                  alt=""
                  width={56}
                  height={56}
                  className={styles.channelImg}
                />
              ) : (
                <span className={styles.channelDot} />
              )}
              <div className={styles.channelInfo}>
                <div className={styles.channelName}>{channel.title}</div>
                <div className={styles.channelMeta}>
                  {formatCount(channel.subscriberCount)} subscribers ·{" "}
                  {formatCount(channel.videoCount)} videos
                </div>
              </div>
              <span className={styles.badge}>● Connected</span>
            </div>
          ) : (
            <div className={styles.notConnected}>
              <p>No channel is connected. Reconnect to enable uploads.</p>
            </div>
          )}

          <div className={styles.cardActions}>
            <Button
              variant="secondary"
              onClick={handleReconnect}
              loading={busy === "reconnect"}
            >
              {channel ? "Reconnect" : "Connect channel"}
            </Button>
            {channel && (
              <Button
                variant="danger"
                onClick={handleDisconnect}
                loading={busy === "disconnect"}
              >
                Disconnect Channel
              </Button>
            )}
          </div>
        </section>

        <ScheduleSettings />

        {/* Account settings */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Account Settings</h2>
          </div>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Name</span>
              <span className={styles.rowValue}>{user?.displayName ?? "—"}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Email</span>
              <span className={styles.rowValue}>{user?.email ?? "—"}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Total uploads</span>
              <span className={styles.rowValue}>{profile?.totalUploads ?? 0}</span>
            </div>
          </div>
          <div className={styles.cardActions}>
            <Button variant="secondary" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </section>

        {/* Danger zone */}
        <section className={`${styles.card} ${styles.danger}`}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Delete Account</h2>
          </div>
          <p className={styles.dangerText}>
            Permanently delete your account, profile, and all upload history. This
            action cannot be undone. Videos already published to YouTube are not
            removed.
          </p>

          {!confirmDelete ? (
            <div className={styles.cardActions}>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete my account
              </Button>
            </div>
          ) : (
            <div className={styles.confirm}>
              <span>Are you sure? This is permanent.</span>
              <div className={styles.cardActions}>
                <Button variant="danger" onClick={handleDelete} loading={busy === "delete"}>
                  Yes, delete everything
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
      </div>
      
      {/* Right Column: Image and Tips */}
      <div className={styles.sideCol}>
        
        {/* Branding Badge */}
        <div className={styles.brandBadge}>
          <div className={styles.brandIcon}><MdVerified size={20} color="#38bdf8" /></div>
          <div>
            <div className={styles.brandTitle}>YouTube Automation</div>
            <div className={styles.brandSub}>by CodeLove</div>
          </div>
        </div>

        <div className={styles.illustrationCard}>
          <Image 
            src="/settings-illustration.png" 
            alt="YouTube Automation" 
            width={600} 
            height={600} 
            className={styles.illustrationImg}
            priority
          />
        </div>
        
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>
            <MdLightbulbOutline size={20} color="var(--primary)" />
            Automation Pro Tip
          </h3>
          <p className={styles.infoText}>
            Setting up a weekly schedule allows our AI to automatically distribute your bulk uploads across the week, ensuring consistent engagement without triggering YouTube's spam filters.
          </p>
        </div>

        {/* Feature List */}
        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}>Why Auto-Schedule?</h3>
          <ul className={styles.featureList}>
            <li>
              <MdAutoGraph size={18} color="var(--success)" />
              <span>Maximized Audience Retention</span>
            </li>
            <li>
              <MdOutlineSpeed size={18} color="#facc15" />
              <span>Automated Background Processing</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
