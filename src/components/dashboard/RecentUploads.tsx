"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { UploadRecord, UploadStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { MdMovie, MdPlayArrow } from "react-icons/md";
import styles from "@/styles/Recent.module.css";

const STATUS_META: Record<UploadStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "queued" },
  uploading: { label: "Uploading", className: "uploading" },
  processing: { label: "Processing", className: "processing" },
  completed: { label: "Published", className: "completed" },
  failed: { label: "Failed", className: "failed" },
  scheduled: { label: "Scheduled", className: "queued" },
};

interface RecentUploadsProps {
  uploads: UploadRecord[];
  loading: boolean;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export function RecentUploads({ uploads, loading, limit, onLimitChange }: RecentUploadsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"single" | "bulk">("single");

  const filteredUploads = uploads.filter((u) => {
    if (activeSubTab === "single") {
      return u.uploadType !== "bulk";
    } else {
      return u.uploadType === "bulk";
    }
  });

  const singleCount = uploads.filter(u => u.uploadType !== "bulk").length;
  const bulkCount = uploads.filter(u => u.uploadType === "bulk").length;

  return (
    <div className={styles.card}>
      <div className={styles.head} style={{ flexDirection: "column", alignItems: "stretch", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.title}>Recent uploads</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className={styles.count}>{uploads.length} total</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer",
                outline: "none",
                fontWeight: 600
              }}
            >
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
              <option value={200}>Show 200</option>
              <option value={500}>Show 500</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
          <button
            onClick={() => setActiveSubTab("single")}
            style={{
              padding: "6px 16px",
              borderRadius: "16px",
              border: "none",
              background: activeSubTab === "single" ? "var(--primary)" : "transparent",
              color: activeSubTab === "single" ? "white" : "var(--text-secondary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Single Videos ({singleCount})
          </button>
          <button
            onClick={() => setActiveSubTab("bulk")}
            style={{
              padding: "6px 16px",
              borderRadius: "16px",
              border: "none",
              background: activeSubTab === "bulk" ? "var(--primary)" : "transparent",
              color: activeSubTab === "bulk" ? "white" : "var(--text-secondary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Bulk Folder Uploads ({bulkCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>
          <Spinner size={24} label="Loading uploads" />
        </div>
      ) : filteredUploads.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden><MdMovie size={48} color="#a1a1aa" /></div>
          <p className={styles.emptyTitle}>No {activeSubTab === "single" ? "single" : "bulk"} uploads yet</p>
          <p className={styles.emptySub}>Your published Shorts will appear here.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Video</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Publish Time</th>
                <th>Uploaded On</th>
              </tr>
            </thead>
            <tbody>
              {filteredUploads.map((u) => {
                const status = STATUS_META[u.status];
                return (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.videoCell}>
                        <span className={styles.thumb}>
                          {u.thumbnail ? (
                            <Image
                              src={u.thumbnail}
                              alt=""
                              width={48}
                              height={64}
                              className={styles.thumbImg}
                            />
                          ) : (
                            <span className={styles.thumbPlaceholder} aria-hidden><MdPlayArrow size={24} color="#a1a1aa" /></span>
                          )}
                        </span>
                        <div className={styles.videoMeta}>
                          {u.videoId ? (
                            <a
                              href={`https://youtube.com/shorts/${u.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.videoTitle}
                            >
                              {u.title}
                            </a>
                          ) : (
                            <span className={styles.videoTitle}>{u.title}</span>
                          )}
                          <span className={styles.videoFile}>{u.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[status.className]}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={styles.visibility}>{u.visibility}</td>
                    <td className={styles.date}>{u.status === "scheduled" || u.status === "completed" ? formatDateTime(u.scheduledAt) : "—"}</td>
                    <td className={styles.date}>{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
