"use client";

import { motion } from "framer-motion";
import { ChannelVideos } from "@/components/dashboard/ChannelVideos";
import { useAuth } from "@/hooks/useAuth";
import styles from "@/styles/Dashboard.module.css";

export default function ChannelPage() {
  const { profile } = useAuth();
  const channel = profile?.channel;

  return (
    <div className={styles.main}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <h1 className={styles.greeting}>
          Your Channel 📺
        </h1>
        <p className={styles.sub}>
          {channel ? `Manage videos for ${channel.title}` : "Connect your YouTube channel to view your videos."}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={styles.contentCard}
      >
        <ChannelVideos />
      </motion.div>
    </div>
  );
}
