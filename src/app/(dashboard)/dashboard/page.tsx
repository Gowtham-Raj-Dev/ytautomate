"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RecentUploads } from "@/components/dashboard/RecentUploads";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToRecentUploads } from "@/services/firestore";
import { formatDate, formatBytes } from "@/lib/utils";
import type { UploadRecord } from "@/types";
import styles from "@/styles/Dashboard.module.css";
import Link from "next/link";
import { MdFileUpload, MdAccessTime, MdCheckCircle, MdError, MdVideoCall, MdWavingHand, MdStorage, MdUpload, MdDelete } from "react-icons/md";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadsLimit, setUploadsLimit] = useState(50);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToRecentUploads(user.uid, (data) => {
      setUploads(data);
      setLoading(false);
    }, uploadsLimit);
    return () => unsubscribe();
  }, [user, uploadsLimit]);

  const lastUpload = uploads[0];
  const channel = profile?.channel;

  const stats = [
    {
      label: "Videos Queued",
      value: Math.max(0, (profile?.totalVideosUploadedToFirebase ?? 0) - (profile?.videosDeletedFromFirebase ?? 0)),
      icon: <MdFileUpload />,
    },
    {
      label: "Storage Used",
      value: formatBytes(profile?.currentStorageUsed ?? 0),
      icon: <MdStorage />,
    },
    {
      label: "Posted to YT",
      value: profile?.videosPosted ?? 0,
      icon: <MdUpload />,
    },
    {
      label: "Cleaned Up",
      value: profile?.videosDeletedFromFirebase ?? 0,
      icon: <MdDelete />,
    },
    {
      label: "Channel",
      value: channel ? "Connected" : "Not connected",
      icon: channel ? <MdCheckCircle color="var(--success)" /> : <MdError color="var(--warning)" />,
      accent: channel ? "ok" : "warn",
    },
  ];

  return (
    <div className={styles.main}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className={styles.greeting}>
              Welcome back{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} <MdWavingHand color="#eab308" />
            </h1>
            <p className={styles.sub}>Here is what's happening with your YouTube Shorts.</p>
          </div>
          <Link href="/upload" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Upload New Video</span>
            <MdVideoCall size={24} />
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className={styles.stats}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 * i }}
          >
            <span className={styles.statIcon} aria-hidden>{s.icon}</span>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>{s.label}</span>
              <span
                className={`${styles.statValue} ${
                  s.accent === "ok" ? styles.ok : s.accent === "warn" ? styles.warn : ""
                }`}
              >
                {s.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Uploads Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={styles.contentCard}
      >
        <RecentUploads 
          uploads={uploads} 
          loading={loading} 
          limit={uploadsLimit} 
          onLimitChange={setUploadsLimit} 
        />
      </motion.div>
    </div>
  );
}
