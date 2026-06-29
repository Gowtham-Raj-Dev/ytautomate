"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UploadForm } from "@/components/dashboard/UploadForm";
import { BulkUploadForm } from "@/components/dashboard/BulkUploadForm";
import styles from "@/styles/Dashboard.module.css";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  const handleUploaded = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className={styles.main}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <h1 className={styles.greeting}>
          Manual Upload Hub 🚀
        </h1>
        <p className={styles.sub}>
          Upload your videos manually and let YT Automate handle the rest.
        </p>
      </motion.div>

      <motion.div 
        style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", justifyContent: "flex-start" }}>
          <button
            onClick={() => setActiveTab("single")}
            style={{ padding: "8px 24px", borderRadius: "20px", border: "none", background: activeTab === "single" ? "var(--primary)" : "var(--surface-2)", color: activeTab === "single" ? "white" : "var(--text)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Single Video
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            style={{ padding: "8px 24px", borderRadius: "20px", border: "none", background: activeTab === "bulk" ? "var(--primary)" : "var(--surface-2)", color: activeTab === "bulk" ? "white" : "var(--text)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Bulk Folder Upload
          </button>
        </div>

        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {activeTab === "single" ? (
            <UploadForm onUploaded={handleUploaded} />
          ) : (
            <BulkUploadForm />
          )}
        </div>
      </motion.div>
    </div>
  );
}
