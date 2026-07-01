"use client";

import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadVideoToStorage } from "@/services/storage";
import { createUploadRecord, updateStatsOnFirebaseUpload } from "@/services/firestore";
import { validateVideoFile, formatBytes, errorMessage } from "@/lib/utils";
import { generateScheduleDates, generateTitleFromFilename } from "@/lib/scheduleUtils";
import type { Visibility, WeeklySchedule } from "@/types";
import { MdUploadFile, MdPlayArrow, MdOutlineCheckCircle, MdError, MdRefresh } from "react-icons/md";
import styles from "@/styles/Upload.module.css";

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: ["06:00", "13:00", "16:00"],
  tuesday: ["10:00", "17:00"],
  wednesday: ["09:00", "12:00", "15:00", "18:00", "21:00"],
  thursday: ["10:00", "17:00"],
  friday: ["06:00", "13:00", "16:00"],
  saturday: ["11:00", "15:00", "19:00"],
  sunday: ["11:00", "15:00", "19:00"],
};

interface BulkFileItem {
  file: File;
  title: string;
  description: string;
  visibility: Visibility;
  scheduledAt: number | null;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
}

const SUGGESTED_TAGS = [
  "#Shorts", "#Viral", "#Trending", "#Comedy", "#Gaming", 
  "#Motivation", "#Entertainment", "#YouTubeShorts", "#FYP",
  "Subscribe for more! 🔔", "Like & Share! ❤️"
];

// Cache variables to preserve state across client-side navigation
let cachedItems: BulkFileItem[] = [];
let cachedGlobalDesc = `📥 Download this video in Full HD for FREE:
👉 https://downloader.codelove.in/youtube?url={video_url}

✨ You can use this AI video for free in your Reels, Shorts, TikToks, or YouTube videos. No copyright, 100% free!

🔔 Subscribe to our channel for daily free AI video resources, green screen templates, and stunning backgrounds!

#shorts #aivideo #freestockfootage #greenscreen #viralaI`;
let cachedGlobalVis: Visibility = "public";
let cachedBulkTitlesInput = "";
let cachedAiTopic = "";
let cachedAiMode: "title" | "description" = "title";
let cachedShowProgressBox = false;
let cachedIsCollapsed = false;

export function BulkUploadForm() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BulkFileItem[]>(cachedItems);
  const [uploading, setUploading] = useState(false);
  const [globalDesc, setGlobalDesc] = useState(cachedGlobalDesc);
  const [globalVis, setGlobalVis] = useState<Visibility>(cachedGlobalVis);
  const [bulkTitlesInput, setBulkTitlesInput] = useState(cachedBulkTitlesInput);
  const [aiTopic, setAiTopic] = useState(cachedAiTopic);
  const [aiMode, setAiMode] = useState<"title" | "description">(cachedAiMode);
  const [limitReached, setLimitReached] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [errorModal, setErrorModal] = useState<{isOpen: boolean, message: string, title?: string}>({isOpen: false, message: ""});
  const [showProgressBox, setShowProgressBox] = useState(cachedShowProgressBox);
  const [isCollapsed, setIsCollapsed] = useState(cachedIsCollapsed);
  
  const cancelRef = useRef(false);

  const itemsRef = useRef<BulkFileItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    cachedItems = items;
    cachedGlobalDesc = globalDesc;
    cachedGlobalVis = globalVis;
    cachedBulkTitlesInput = bulkTitlesInput;
    cachedAiTopic = aiTopic;
    cachedAiMode = aiMode;
    cachedShowProgressBox = showProgressBox;
    cachedIsCollapsed = isCollapsed;
  }, [items, globalDesc, globalVis, bulkTitlesInput, aiTopic, aiMode, showProgressBox, isCollapsed]);

  const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const videoFiles = Array.from(files).filter(f => {
      if (f.name.startsWith(".")) return false;
      const lowerName = f.name.toLowerCase();
      return lowerName.endsWith(".mp4") || lowerName.endsWith(".mov") || f.type.startsWith("video/");
    });
    
    // Reset input so the same folder can be selected again
    e.target.value = "";
    if (videoFiles.length === 0) {
      toast.error("No MP4 videos found in the selected folder.");
      return;
    }

    const scheduleRules = profile?.scheduleSettings || DEFAULT_SCHEDULE;
    const scheduleDates = generateScheduleDates(scheduleRules, videoFiles.length);

    const newItems: BulkFileItem[] = videoFiles.map((file, i) => ({
      file,
      title: generateTitleFromFilename(file.name),
      description: globalDesc,
      visibility: globalVis,
      scheduledAt: scheduleDates[i] || null,
      status: "pending",
      progress: 0
    }));

    setItems(newItems);
  };

  const handleGlobalDescChange = (val: string) => {
    setGlobalDesc(val);
    setItems(prev => prev.map(item => ({ ...item, description: val })));
  };

  const handleGlobalVisChange = (val: Visibility) => {
    setGlobalVis(val);
    setItems(prev => prev.map(item => ({ ...item, visibility: val })));
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].title = newTitle;
      return copy;
    });
  };

  const applyBulkTitles = () => {
    if (aiMode === "description") {
      handleGlobalDescChange(bulkTitlesInput);
      toast.success("Description applied globally!");
      return;
    }

    const rawLines = bulkTitlesInput.split("\n").map(t => t.trim()).filter(Boolean);
    const titles = rawLines.map(t => t.replace(/^\d+[\.\-\)]\s*/, ""));

    if (titles.length === 0) {
      toast.error("Please enter at least one title.");
      return;
    }
    
    setItems(prev => prev.map((item, i) => ({
      ...item,
      title: titles[i % titles.length]
    })));
    toast.success("Titles applied successfully!");
  };

  const uploadSingleItem = async (i: number) => {
    if (!user) return false;
    
    setItems(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], status: "uploading", progress: 0 };
      return copy;
    });

    try {
      const currentItem = itemsRef.current[i];
      const validation = validateVideoFile(currentItem.file);
      if (!validation.valid) throw new Error(validation.error);

      const result = await uploadVideoToStorage(currentItem.file, user.uid, (p) => {
        setItems(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], progress: p };
          return copy;
        });
      });

      const latestItem = itemsRef.current[i];
      
      await createUploadRecord({
        uid: user.uid,
        videoId: null,
        title: latestItem.title,
        description: latestItem.description,
        visibility: latestItem.visibility,
        status: "scheduled",
        thumbnail: null,
        fileName: latestItem.file.name,
        fileSize: latestItem.file.size,
        createdAt: Date.now(),
        scheduledAt: latestItem.scheduledAt || null,
        fileUrl: result.url,
        storagePath: result.path,
        error: null,
        uploadType: "bulk",
      });

      await updateStatsOnFirebaseUpload(user.uid, latestItem.file.size);

      setItems(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: "success", progress: 100 };
        return copy;
      });

      return true;

    } catch (err: any) {
      setItems(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: "error" };
        return copy;
      });
      const msg = errorMessage(err);
      toast.error(`Failed to upload ${itemsRef.current[i].file.name}`);
      setErrorModal({ isOpen: true, title: "Upload Error", message: `Failed to upload ${itemsRef.current[i].file.name}:\n\n${msg}` });
      return false;
    }
  };

  const handleBulkUpload = async () => {
    if (!user || itemsRef.current.length === 0) return;
    setUploading(true);
    cancelRef.current = false;
    setShowProgressBox(true);
    setIsCollapsed(false);

    for (let i = 0; i < itemsRef.current.length; i++) {
      if (cancelRef.current) {
        toast.info("Upload cancelled");
        break;
      }
      
      if (itemsRef.current[i].status === "success") continue;

      await uploadSingleItem(i);
    }

    setUploading(false);
    if (!cancelRef.current) {
      toast.success("Bulk scheduling complete!");
    }
  };

  const handleRetryItem = async (index: number) => {
    if (uploading) return;
    setUploading(true);
    cancelRef.current = false;
    setShowProgressBox(true);
    
    await uploadSingleItem(index);
    
    setUploading(false);
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const totalCount = items.length;
  const successCount = items.filter(item => item.status === "success").length;
  const errorCount = items.filter(item => item.status === "error").length;
  const uploadingItemIdx = items.findIndex(item => item.status === "uploading");
  const uploadingItemProgress = uploadingItemIdx !== -1 ? items[uploadingItemIdx].progress : 0;
  
  const overallPercent = totalCount > 0 
    ? Math.round(((successCount + errorCount + (uploadingItemProgress / 100)) / totalCount) * 100)
    : 0;

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }}>
      
      {/* Left Card: Upload & Settings */}
      <div className={styles.card} style={{ flex: 1, minWidth: "350px", margin: 0 }}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Bulk Folder Upload</h2>
          <span className={styles.cardHint}>Upload an entire folder of MP4s. Automatically scheduled based on your Settings.</span>
        </div>

      {items.length === 0 ? (
        <div
          className={styles.dropzone}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        >
          <div className={styles.dropIcon} aria-hidden><MdUploadFile size={32} /></div>
          <p className={styles.dropTitle}>Select Folder</p>
          <p className={styles.dropSub}>We will auto-generate titles and dates for all videos inside.</p>
          <input
            ref={inputRef}
            type="file"
            // @ts-ignore - webkitdirectory is non-standard but widely supported
            webkitdirectory="true"
            directory="true"
            className={styles.fileInput}
            onChange={handleFolderSelect}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{items.length} Videos ready</h3>
            <Button variant="ghost" onClick={() => { if (!uploading) { setItems([]); setShowProgressBox(false); } }} disabled={uploading}>
              Clear
            </Button>
          </div>
          
          <div style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Global Settings (Applies to all videos below)</h4>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Description</span>
                </div>
                <textarea 
                  value={globalDesc} 
                  onChange={(e) => handleGlobalDescChange(e.target.value)}
                  disabled={uploading}
                  className={styles.input}
                  style={{ width: "100%", padding: "8px", minHeight: "80px", resize: "vertical" }}
                />
              </label>
              <label style={{ width: "150px" }}>
                <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Visibility</span>
                <select 
                  value={globalVis} 
                  onChange={(e) => handleGlobalVisChange(e.target.value as Visibility)}
                  disabled={uploading}
                  className={styles.input}
                  style={{ width: "100%", padding: "8px", height: "42px", background: "var(--bg)" }}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            
            <div>
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Suggestions (Click to add):</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SUGGESTED_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleGlobalDescChange(globalDesc ? `${globalDesc} ${tag}` : tag)}
                    disabled={uploading}
                    style={{
                      background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                      padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            </div>
            
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface-2)", marginTop: "16px" }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span className={styles.fileBadge} aria-hidden><MdPlayArrow size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input 
                      type="text"
                      value={item.title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      disabled={uploading}
                      style={{ width: "100%", background: "transparent", border: "1px solid transparent", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: "0.9rem", fontWeight: 600, padding: "4px", outline: "none" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "transparent"}
                    />
                    <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      <span>{formatBytes(item.file.size)}</span>
                      <span style={{ color: "var(--primary)" }}>
                        {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "No slot available"}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ width: "80px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    {item.status === "pending" && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Pending</span>}
                    {item.status === "uploading" && (
                      <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>{item.progress}%</div>
                    )}
                    {item.status === "success" && <MdOutlineCheckCircle size={20} color="var(--success)" />}
                    {item.status === "error" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MdError size={20} color="var(--error)" title="Upload failed" />
                        <button
                          onClick={() => handleRetryItem(idx)}
                          disabled={uploading}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px",
                            borderRadius: "4px"
                          }}
                          title="Retry upload"
                        >
                          <MdRefresh size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.actions} style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              {!uploading ? (
                <Button
                  onClick={handleBulkUpload}
                  loading={uploading}
                  disabled={items.length === 0 || uploading}
                  style={{ width: "100%" }}
                >
                  Start Bulk Scheduling ({items.length} videos)
                </Button>
              ) : (
                <>
                  <Button disabled style={{ flex: 1 }}>
                    Uploading...
                  </Button>
                  <Button variant="danger" onClick={handleCancel} style={{ background: "var(--error)", color: "white", border: "none" }}>
                    Cancel Upload
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column Container */}
      <div 
        style={{ 
          width: "420px", 
          flexShrink: 0, 
          display: "flex", 
          flexDirection: "column", 
          gap: "24px",
          margin: 0
        }}
      >
        {/* Bulk Metadata Studio */}
        <div 
          className={styles.card} 
          style={{ 
            width: "100%", 
            margin: 0, 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px",
            opacity: items.length === 0 ? 0.4 : 1,
            pointerEvents: items.length === 0 ? "none" : "auto",
            transition: "opacity 0.3s ease"
          }}
        >
          <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            📋 Bulk Metadata Studio
          </h4>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {items.length > 0 
              ? `Paste your titles (one per line) or description to apply to your ${items.length} videos at once.` 
              : "Paste your titles (one per line) or description to apply to your videos."}
          </span>
              
          <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
            <button 
              onClick={() => setAiMode("title")}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "title" ? "var(--primary)" : "var(--bg)", color: aiMode === "title" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              Titles (One per line)
            </button>
            <button 
              onClick={() => setAiMode("description")}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "description" ? "var(--primary)" : "var(--bg)", color: aiMode === "description" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              Description
            </button>
          </div>

          <div style={{ paddingTop: "8px", flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
              <strong>Paste Content Below:</strong>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              <textarea 
                value={bulkTitlesInput} 
                onChange={(e) => setBulkTitlesInput(e.target.value)}
                placeholder={aiMode === "title" ? "Example:\nFunny Cat Video 1\nFunny Cat Video 2\nFunny Cat Video 3" : "Paste the global description/hashtags here..."}
                disabled={uploading}
                className={styles.input}
                style={{ width: "100%", padding: "12px", minHeight: "220px", flex: 1, resize: "vertical", fontFamily: "inherit" }}
              />
              <Button 
                onClick={applyBulkTitles} 
                disabled={uploading || !bulkTitlesInput.trim() || items.length === 0}
                variant="primary"
              >
                Apply {aiMode === "title" ? "Titles to Videos" : "as Global Description"}
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Upload Progress Box */}
        {showProgressBox && totalCount > 0 && (
          <div 
            className={styles.card} 
            style={{ 
              width: "100%", 
              margin: 0, 
              display: "flex", 
              flexDirection: "column", 
              gap: "14px",
              borderColor: uploading ? "var(--primary)" : "var(--border)",
              boxShadow: uploading ? "0 4px 20px rgba(255, 42, 42, 0.15)" : "none",
              transition: "all 0.3s ease"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                🚀 Bulk Upload Queue
              </h4>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  style={{
                    background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)",
                    padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  {isCollapsed ? "Expand" : "Collapse"}
                </button>
                {uploading ? (
                  <button
                    onClick={handleCancel}
                    style={{
                      background: "var(--error)", border: "none", color: "white",
                      padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setShowProgressBox(false)}
                    style={{
                      background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                      padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer",
                      fontWeight: 500
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Overall Progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>
                {uploading ? `Uploading: ${successCount + errorCount}/${totalCount} videos` : "Upload finished"}
              </span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{overallPercent}%</span>
            </div>

            <div className={styles.progressTrack} style={{ height: "8px" }}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${overallPercent}%`, transition: "width 0.3s ease" }}
              />
            </div>

            {/* Expanded Content */}
            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {/* Stats row */}
                <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)", background: "var(--bg)", padding: "8px", borderRadius: "6px" }}>
                  <span style={{ flex: 1 }}>Succeeded: <strong style={{ color: "var(--success)" }}>{successCount}</strong></span>
                  <span style={{ flex: 1 }}>Failed: <strong style={{ color: "var(--error)" }}>{errorCount}</strong></span>
                  <span style={{ flex: 1 }}>Remaining: <strong>{totalCount - successCount - errorCount}</strong></span>
                </div>

                {/* Queue List */}
                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "4px" }}>
                  {items.map((item, idx) => {
                    let statusColor = "var(--text-muted)";
                    let statusText: React.ReactNode = "Pending";
                    if (item.status === "uploading") {
                      statusColor = "var(--primary)";
                      statusText = `Uploading (${item.progress}%)`;
                    } else if (item.status === "success") {
                      statusColor = "var(--success)";
                      statusText = "Succeeded";
                    } else if (item.status === "error") {
                      statusColor = "var(--error)";
                      statusText = (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          Failed
                          <button
                            onClick={() => handleRetryItem(idx)}
                            disabled={uploading}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--primary)",
                              cursor: "pointer",
                              display: "inline-flex",
                              padding: 0
                            }}
                            title="Retry"
                          >
                            <MdRefresh size={14} />
                          </button>
                        </span>
                      );
                    }

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          fontSize: "0.8rem",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          background: item.status === "uploading" ? "rgba(255, 42, 42, 0.05)" : "transparent"
                        }}
                      >
                        <span style={{ 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          maxWidth: "220px",
                          color: item.status === "pending" ? "var(--text-muted)" : "var(--text)"
                        }}>
                          {idx + 1}. {item.title}
                        </span>
                        <span style={{ color: statusColor, fontWeight: item.status === "uploading" ? "600" : "normal" }}>
                          {statusText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* General Error Popup Modal */}
      {errorModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "var(--surface-2)", padding: "32px", borderRadius: "12px", textAlign: "center", maxWidth: "400px", border: "1px solid var(--border)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
             <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--error)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
               <MdError size={28} /> {errorModal.title || "Error"}
             </h2>
             <p style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.5, whiteSpace: "pre-wrap", textAlign: "left", background: "var(--bg)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
               {errorModal.message}
             </p>
             <Button onClick={() => setErrorModal({ isOpen: false, message: "" })} style={{ width: "100%" }}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
