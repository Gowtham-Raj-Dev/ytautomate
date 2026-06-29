"use client";

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
}

export function RecentUploads({ uploads, loading }: RecentUploadsProps) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Recent uploads</h2>
        <span className={styles.count}>{uploads.length} total</span>
      </div>

      {loading ? (
        <div className={styles.empty}>
          <Spinner size={24} label="Loading uploads" />
        </div>
      ) : uploads.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden><MdMovie size={48} color="#a1a1aa" /></div>
          <p className={styles.emptyTitle}>No uploads yet</p>
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
              {uploads.map((u) => {
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
