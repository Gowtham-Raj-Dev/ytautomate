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
import { MdUploadFile, MdPlayArrow, MdOutlineCheckCircle, MdError } from "react-icons/md";
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
let cachedGlobalDesc = "#Shorts";
let cachedGlobalVis: Visibility = "public";
let cachedBulkTitlesInput = "";
let cachedAiTopic = "";
let cachedAiMode: "title" | "description" = "title";

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
  }, [items, globalDesc, globalVis, bulkTitlesInput, aiTopic, aiMode]);

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

  const generateAIContent = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic for AI");
      return;
    }
    setGeneratingAi(true);
    try {
      let prompt = "";
      if (aiMode === "title") {
        prompt = `You are an expert YouTube strategist. I need ${items.length || 10} catchy, highly engaging, and viral-worthy YouTube Shorts titles for the topic: "${aiTopic}". 
        Rules:
        - Only return the titles, one per line. Do not wrap in markdown or JSON.
        - Each title should be around 70 to 90 characters long for maximum impact.
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
      
      let formatted = data.text;
      if (aiMode === "title") {
        const rawLines = formatted.split("\n").map((t: string) => t.trim()).filter(Boolean);
        formatted = rawLines.map((t: string, i: number) => `${i + 1}. ${t.replace(/^\d+[\.\-\)]\s*/, "")}`).join('\n\n');
      }
      
      setBulkTitlesInput(formatted);
      toast.success("AI generated content successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content. Did you add GEMINI_API_KEY?");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!user || itemsRef.current.length === 0) return;
    setUploading(true);
    cancelRef.current = false;

    for (let i = 0; i < itemsRef.current.length; i++) {
      if (cancelRef.current) {
        toast.info("Upload cancelled");
        break;
      }
      
      if (itemsRef.current[i].status === "success") continue;

      setItems(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: "uploading" };
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

        // Get latest item safely without putting side-effects inside setState
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

      } catch (err: any) {
        setItems(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "error" };
          return copy;
        });
        const msg = errorMessage(err);
        toast.error(`Failed to upload ${itemsRef.current[i].file.name}`);
        setErrorModal({ isOpen: true, title: "Upload Error", message: `Failed to upload ${itemsRef.current[i].file.name}:\n\n${msg}` });
        
        // Pause or break on error? We'll just continue to the next one, but they can see the modal.
      }
    }

    setUploading(false);
    if (!cancelRef.current) {
      toast.success("Bulk scheduling complete!");
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

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
            <Button variant="ghost" onClick={() => !uploading && setItems([])} disabled={uploading}>
              Clear
            </Button>
          </div>
          
          <div style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Global Settings (Applies to all videos below)</h4>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Description</span>
                  <button 
                    onClick={() => { setAiMode("description"); setAiTopic("I need 100 hashtags and a 300 word description about..."); }} 
                    style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                  >
                    ✨ Generate with AI
                  </button>
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
                    {item.status === "error" && <MdError size={20} color="var(--error)" />}
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
          opacity: items.length === 0 ? 0.4 : 1,
          pointerEvents: items.length === 0 ? "none" : "auto",
          transition: "opacity 0.3s ease"
        }}
      >
        <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          ✨ AI Title Studio
        </h4>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {items.length > 0 
            ? `Generate highly engaging, viral titles for your ${items.length} videos in one click!` 
            : "Generate highly engaging, viral titles for your videos!"}
        </span>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <button 
                onClick={() => setAiMode("title")}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "title" ? "var(--primary)" : "var(--bg)", color: aiMode === "title" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              >
                Titles
              </button>
              <button 
                onClick={() => setAiMode("description")}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: aiMode === "description" ? "var(--primary)" : "var(--bg)", color: aiMode === "description" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              >
                Descriptions & Tags
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--bg)", padding: "12px", borderRadius: "8px", border: "1px dashed var(--border)" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                {aiMode === "title" ? "What are these videos about?" : "What do you want the description/hashtags to say?"}
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
                Generate {aiMode === "title" ? `${items.length || 10} Titles` : "Content"}
              </Button>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                <strong>AI Output:</strong> Review your {aiMode}s below and apply them.
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                <textarea 
                  value={bulkTitlesInput} 
                  onChange={(e) => setBulkTitlesInput(e.target.value)}
                  placeholder="AI output will appear here..."
                  disabled={uploading}
                  className={styles.input}
                  style={{ width: "100%", padding: "8px", minHeight: "150px", flex: 1, resize: "vertical" }}
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
