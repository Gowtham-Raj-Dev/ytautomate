"use client";

import { motion } from "framer-motion";
import styles from "@/styles/Dashboard.module.css";

export default function AutocutPage() {
  return (
    <div className={styles.main} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={styles.contentCard}
        style={{ padding: '64px 32px', maxWidth: '600px', width: '100%' }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✂️</div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#fff', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Autocut AI
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#a1a1aa', marginBottom: '32px' }}>
          Automatically find highlights, remove silences, and generate viral shorts from long-form videos. Our powerful AI editing tool is currently in development.
        </p>
        <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', border: '1px solid #3f3f46' }}>
          Coming Soon
        </div>
      </motion.div>
    </div>
  );
}
