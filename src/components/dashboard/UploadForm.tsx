"use client";

import { useRef, useState, useEffect, type DragEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { StudioEditor } from "./StudioEditor";
import { uploadShort } from "@/services/youtube";
import {
  createUploadRecord,
  updateUploadRecord,
  incrementUploadCount,
  updateStatsOnFirebaseUpload,
} from "@/services/firestore";
import {
  validateVideoFile,
  formatBytes,
  errorMessage,
  MAX_FILE_SIZE,
} from "@/lib/utils";
import { uploadVideoToStorage } from "@/services/storage";
import type { Visibility } from "@/types";
import { MdUploadFile, MdPlayArrow } from "react-icons/md";
import styles from "@/styles/Upload.module.css";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Everyone can watch" },
  { value: "unlisted", label: "Unlisted", hint: "Anyone with the link" },
  { value: "private", label: "Private", hint: "Only you" },
];

interface UploadFormProps {
  onUploaded?: () => void;
}

// Cache variables to preserve state across client-side navigation
let cachedFile: File | null = null;
let cachedTitle = "";
let cachedDesc = `📥 Download this video in Full HD for FREE:
👉 https://downloader.codelove.in/youtube?url={video_url}

✨ You can use this AI video for free in your Reels, Shorts, TikToks, or YouTube videos. No copyright, 100% free!

🔔 Subscribe to our channel for daily free AI video resources, green screen templates, and stunning backgrounds!

#Shorts #AIVideo #FreeStockFootage #GreenScreen #ViralAI`;
let cachedVis: Visibility = "public";
let cachedScheduledAt = "";
let cachedAiTopicSingle = "";
let cachedAiModeSingle: "title" | "description" = "title";

export function UploadForm({ onUploaded }: UploadFormProps) {
  const { user, session, hasValidToken, refreshProfile } = useAuth();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(cachedFile);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState(cachedTitle);
  const [description, setDescription] = useState(cachedDesc);
  const [visibility, setVisibility] = useState<Visibility>(cachedVis);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>(cachedScheduledAt);
  const [aiTopic, setAiTopic] = useState(cachedAiTopicSingle);
  const [aiMode, setAiMode] = useState<"title" | "description">(cachedAiModeSingle);
  const [limitReached, setLimitReached] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    cachedFile = file;
    cachedTitle = title;
    cachedDesc = description;
    cachedVis = visibility;
    cachedScheduledAt = scheduledAt;
    cachedAiTopicSingle = aiTopic;
    cachedAiModeSingle = aiMode;
  }, [file, title, description, visibility, scheduledAt, aiTopic, aiMode]);

  const generateAIContent = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic for AI");
      return;
    }
    setGeneratingAi(true);
    try {
      let prompt = "";
      if (aiMode === "title") {
        prompt = `You are an expert YouTube strategist. I need 1 catchy, highly engaging, and viral-worthy YouTube Shorts title for the topic: "${aiTopic}". 
        Rules:
        - Only return the title, just the raw string. Do not wrap in markdown or JSON.
        - The title should be around 70 to 90 characters long for maximum impact.
        - Use emojis if they fit naturally.`;
      } else {
        prompt = `You are an expert YouTube strategist. Complete this request exactly: "${aiTopic}".
        Rules:
        - Create a highly optimized YouTube description and/or hashtags.
        - Do not output markdown code blocks (like \`\`\`text), just plain text.
        - Add clean spacing and emojis where appropriate.`;
      }

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === "LIMIT_REACHED") {
          setLimitReached(true);
          return;
        }
        throw new Error(data.message || data.error);
      }
      
      let formatted = data.text.trim();
      if (aiMode === "title") {
        formatted = formatted.replace(/^\d+[\.\-\)]\s*/, "");
        setTitle(formatted);
      } else {
        setDescription(formatted);
      }
      toast.success("AI generated content successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content. Did you add GEMINI_API_KEY?");
    } finally {
      setGeneratingAi(false);
    }
  };

  const selectFile = (f: File) => {
    const result = validateVideoFile(f);
    if (!result.valid) {
      toast.error(result.error ?? "Invalid file.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setVisibility("public");
    setProgress(0);
    setScheduledAt("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!hasValidToken || !session) {
      toast.error("Your YouTube session expired. Please sign in again.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;

    // Create a Firestore record up front so the upload is tracked even on failure.
    let recordId: string | null = null;
    try {
      const isScheduled = !!scheduledAt;
      const scheduledTime = isScheduled ? new Date(scheduledAt).getTime() : null;
      
      recordId = await createUploadRecord({
        uid: user.uid,
        videoId: null,
        title: title.trim(),
        description: description.trim(),
        visibility,
        status: isScheduled ? "scheduled" : "uploading",
        thumbnail: null,
        fileName: file.name,
        fileSize: file.size,
        createdAt: Date.now(),
        scheduledAt: scheduledTime,
        error: null,
        uploadType: "single",
      });

      if (isScheduled) {
        // Upload to Firebase Storage
        const result = await uploadVideoToStorage(file, user.uid, setProgress);
        await updateUploadRecord(user.uid, recordId, {
          fileUrl: result.url,
          storagePath: result.path,
        });
        await updateStatsOnFirebaseUpload(user.uid, file.size);
        toast.success("Short scheduled for later upload! 🕒");
      } else {
        // Upload immediately to YouTube
        const result = await uploadShort({
          accessToken: session.accessToken,
          file,
          metadata: { title: title.trim(), description: description.trim(), visibility },
          onProgress: setProgress,
          signal: controller.signal,
        });

        let updatedDescription = description.trim();
        const hasPlaceholder = updatedDescription.includes("{video_url}") || updatedDescription.includes("{videoId}");
        
        if (hasPlaceholder && result.videoId) {
          updatedDescription = updatedDescription
            .replace(/{video_url}/g, `https://youtu.be/${result.videoId}`)
            .replace(/{videoId}/g, result.videoId);

          try {
            await fetch(`/api/youtube/update-description`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                videoId: result.videoId,
                title: title.trim(),
                description: updatedDescription,
              }),
            });
          } catch (e) {
            console.error("Failed to update description on YouTube via API route:", e);
          }
        }

        await updateUploadRecord(user.uid, recordId, {
          status: "completed",
          videoId: result.videoId,
          thumbnail: result.thumbnail,
          description: updatedDescription
        });
        await incrementUploadCount(user.uid);
        await refreshProfile();
        toast.success("Short uploaded to YouTube! 🎉");
      }

      reset();
      onUploaded?.();
    } catch (err) {
      const message = errorMessage(err);
      if (recordId) {
        await updateUploadRecord(user.uid, recordId, { status: "failed", error: message }).catch(() => {});
      }
      toast.error(message);
      onUploaded?.();
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  };

  if (showStudio && file) {
    return (
      <StudioEditor 
        file={file} 
        onCancel={() => setShowStudio(false)} 
        onUpload={(modifiedFile, generatedCaptions) => {
          setFile(modifiedFile);
          setShowStudio(false);
          // Auto-append [CC] to title to show it has captions
          if (!title.includes("[CC]")) setTitle(prev => prev + " [CC]");
        }} 
      />
    );
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }}>
      
      {/* Left Card: Upload & Settings */}
      <div className={styles.card} style={{ flex: 1, minWidth: "350px", margin: 0 }}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Upload a Short</h2>
          <span className={styles.cardHint}>MP4 · max {formatBytes(MAX_FILE_SIZE, 0)}</span>
        </div>

      {/* Drop zone */}
      {!file ? (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        >
          <div className={styles.dropIcon} aria-hidden><MdUploadFile size={32} /></div>
          <p className={styles.dropTitle}>Drag &amp; drop your Short here</p>
          <p className={styles.dropSub}>or click to browse — vertical MP4 works best</p>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4"
            className={styles.fileInput}
            onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className={styles.fileSelected}>
          <span className={styles.fileBadge} aria-hidden><MdPlayArrow size={16} /></span>
          <div className={styles.fileMeta}>
            <div className={styles.fileName}>{file.name}</div>
            <div className={styles.fileSize}>{formatBytes(file.size)}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!uploading && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowStudio(true)}
                style={{ padding: '0 12px', height: '32px', fontSize: '12px' }}
              >
                ✨ Edit in Studio
              </Button>
            )}
            {!uploading && (
              <button className={styles.removeFile} onClick={reset} aria-label="Remove file">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressBar}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>
          <div className={styles.progressMeta}>
            <span>{progress}% uploaded</span>
            <button className={styles.cancelBtn} onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            value={title}
            maxLength={100}
            placeholder="An awesome Short title"
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
          />
        </label>

        <label className={styles.field}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span className={styles.label} style={{ marginBottom: 0 }}>Description</span>
            <button 
              onClick={() => { setAiMode("description"); setAiTopic("I need 100 hashtags and a 300 word description about..."); }} 
              type="button"
              style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
            >
              ✨ Generate with AI
            </button>
          </div>
          <textarea
            className={styles.textarea}
            value={description}
            maxLength={5000}
            rows={3}
            placeholder="Add a description… #Shorts"
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Visibility</span>
          <div className={styles.visibility} role="radiogroup" aria-label="Visibility">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={visibility === opt.value}
                className={`${styles.visOption} ${
                  visibility === opt.value ? styles.visActive : ""
                }`}
                onClick={() => setVisibility(opt.value)}
                disabled={uploading}
              >
                <span className={styles.visLabel}>{opt.label}</span>
                <span className={styles.visHint}>{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label className={styles.field} style={{ marginTop: "16px" }}>
          <span className={styles.label}>Schedule Time (Optional)</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={uploading}
            min={new Date().toISOString().slice(0, 16)}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <Button
          onClick={handleUpload}
          loading={uploading}
          disabled={!file || !title.trim()}
        >
          {scheduledAt ? "Schedule Upload" : "Upload to YouTube"}
        </Button>
        <Button variant="ghost" onClick={reset} disabled={uploading}>
          Reset
        </Button>
      </div>

      {!hasValidToken && (
        <p className={styles.warning}>
          ⚠ Your YouTube session has expired. Sign out and sign back in to refresh
          upload access.
        </p>
      )}
      </div>

      {/* Right Card: AI Title Studio */}
      <div 
        className={styles.card} 
        style={{ 
          width: "420px", 
          flexShrink: 0, 
          margin: 0, 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
          opacity: !file ? 0.4 : 1,
          pointerEvents: !file ? "none" : "auto",
          transition: "opacity 0.3s ease"
        }}
      >
        <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          ✨ AI Content Studio
        </h4>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {file 
            ? "Generate highly engaging, viral content for this video!"
            : "Upload a video first to enable AI."}
        </span>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
          <button 
            onClick={() => setAiMode("title")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "title" ? "var(--primary)" : "var(--bg)", color: aiMode === "title" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Title
          </button>
          <button 
            onClick={() => setAiMode("description")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "description" ? "var(--primary)" : "var(--bg)", color: aiMode === "description" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Description & Tags
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--bg)", padding: "12px", borderRadius: "8px", border: "1px dashed var(--border)" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
            {aiMode === "title" ? "What is this video about?" : "What do you want the description/hashtags to say?"}
          </span>
          <input 
            type="text" 
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder={aiMode === "title" ? "e.g. Funny cat compilation..." : "e.g. 100 hashtags about cars and a 300 words description"}
            className={styles.input}
            style={{ width: "100%", padding: "8px" }}
            disabled={generatingAi || uploading}
          />
          <Button 
            onClick={generateAIContent} 
            loading={generatingAi}
            disabled={uploading || !aiTopic.trim()}
            variant="secondary"
            style={{ width: "100%", marginTop: "4px" }}
          >
            Generate Content
          </Button>
        </div>
      </div>

      {/* Limit Reached Modal */}
      {limitReached && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "var(--surface-2)", padding: "32px", borderRadius: "12px", textAlign: "center", maxWidth: "400px", border: "1px solid var(--border)" }}>
             <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "var(--error)" }}>AI Limit Reached 🚫</h2>
             <p style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.5 }}>
               You have reached your daily Gemini AI API limit. Please come back tomorrow to generate more content!
             </p>
             <Button onClick={() => setLimitReached(false)} style={{ width: "100%" }}>Understood</Button>
          </div>
        </div>
      )}
    </div>
  );
}
