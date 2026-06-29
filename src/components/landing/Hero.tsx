"use client";

import { motion } from "framer-motion";
import { ButtonLink, Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { MdPlayArrow } from "react-icons/md";
import styles from "@/styles/Hero.module.css";

const recent = [
  { title: "Morning routine 🌅", status: "Public", color: "#22c55e" },
  { title: "3 VS Code tips", status: "Unlisted", color: "#f59e0b" },
  { title: "Coffee ASMR", status: "Public", color: "#22c55e" },
];

export function Hero() {
  const toast = useToast();

  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden />
      <div className={`container ${styles.inner}`}>
        <motion.div
          className={styles.copy}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.badge}>
            <span className={styles.dot} /> Now uploading Shorts in seconds
          </span>

          <h1 className={styles.title}>
            Upload YouTube Shorts <span className={styles.highlight}>in Seconds</span>
          </h1>

          <p className={styles.subtitle}>
            Connect your channel, upload your short, and publish instantly without
            opening YouTube Studio.
          </p>

          <div className={styles.cta}>
            <ButtonLink href="/login" size="lg">
              Get Started
            </ButtonLink>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => toast.info("Demo video coming soon!")}
              iconLeft={<span aria-hidden><MdPlayArrow size={18} /></span>}
            >
              Watch Demo
            </Button>
          </div>

          <div className={styles.trust}>
            <span>Free to start</span>
            <span className={styles.sep}>•</span>
            <span>No credit card</span>
            <span className={styles.sep}>•</span>
            <span>Secure Google login</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className={styles.dashboard}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Connected channel */}
            <div className={styles.channelRow}>
              <div className={styles.avatar}>YA</div>
              <div>
                <div className={styles.channelName}>Connected Channel</div>
                <div className={styles.channelMeta}>@yt_automate · 128K subs</div>
              </div>
              <span className={styles.connected}>● Live</span>
            </div>

            {/* Upload card */}
            <div className={styles.uploadCard}>
              <div className={styles.uploadHead}>
                <span className={styles.fileIcon}><MdPlayArrow size={16} /></span>
                <div className={styles.uploadInfo}>
                  <div className={styles.fileName}>my-short.mp4</div>
                  <div className={styles.fileSize}>48.2 MB · 1080×1920</div>
                </div>
              </div>
              <div className={styles.progressTrack}>
                <motion.div
                  className={styles.progressBar}
                  animate={{ width: ["8%", "100%", "100%"] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    times: [0, 0.7, 1],
                    ease: "easeInOut",
                  }}
                />
              </div>
              <div className={styles.progressLabel}>Uploading to YouTube…</div>
            </div>

            {/* Recent uploads */}
            <div className={styles.recent}>
              <div className={styles.recentHead}>Recent uploads</div>
              {recent.map((r) => (
                <div key={r.title} className={styles.recentRow}>
                  <span className={styles.thumb} />
                  <span className={styles.recentTitle}>{r.title}</span>
                  <span
                    className={styles.statusPill}
                    style={{ color: r.color, borderColor: `${r.color}55` }}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating Shorts preview */}
          <motion.div
            className={styles.short}
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className={styles.shortScreen}>
              <span className={styles.shortBadge}>Shorts</span>
              <div className={styles.shortPlay}><MdPlayArrow size={24} /></div>
              <div className={styles.shortBars}>
                <span /> <span /> <span />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
