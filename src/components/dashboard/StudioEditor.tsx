"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import styles from "@/styles/Studio.module.css";
import { MdOutlineAutoFixHigh, MdClose, MdUpload, MdPlayArrow, MdPause } from "react-icons/md";

interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

interface CaptionChunk {
  text: string;
  timestamp: [number, number];
  words?: CaptionWord[];
}

interface StudioEditorProps {
  file: File;
  onCancel: () => void;
  onUpload: (fileWithCaptions: File, captions: CaptionChunk[]) => void;
}

export function StudioEditor({ file, onCancel, onUpload }: StudioEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [status, setStatus] = useState<"idle" | "loading_model" | "extracting" | "generating" | "ready">("idle");
  const [progress, setProgress] = useState(0);
  const [debugText, setDebugText] = useState("Initializing...");
  const [captions, setCaptions] = useState<CaptionChunk[]>([]);
  const [activeCaption, setActiveCaption] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    // Initialize Web Worker
    setDebugText("Creating Web Worker...");
    try {
      workerRef.current = new Worker(new URL("../../workers/whisper.worker.ts", import.meta.url), {
      type: "module"
    });
      setDebugText("Web Worker created. Waiting for response...");
      
      workerRef.current.onerror = (err) => {
        console.error("Worker crashed:", err);
        setDebugText("CRITICAL ERROR: Web Worker crashed. Check console.");
        setStatus("idle");
      };

      workerRef.current.onmessage = (e) => {
        const { status, progress, result, error } = e.data;
        console.log("Worker message:", e.data);
        
        if (status === "loading" || status === "progress") {
          setStatus("loading_model");
          if (progress?.file) {
            setDebugText(`Downloading model file: ${progress.file} (${Math.round(progress.progress || 0)}%)`);
          } else {
            setDebugText("Loading AI model into memory...");
          }
          if (progress?.progress) setProgress(progress.progress);
        } else if (status === "ready") {
          setStatus("idle"); // Model is ready to generate
          setDebugText("AI Model is ready!");
        } else if (status === "processing") {
          setStatus("generating");
          setDebugText("AI is processing audio (this takes some time)...");
        } else if (status === "complete") {
          setCaptions(result.chunks || []);
          setStatus("ready");
          setDebugText("Done!");
        } else if (status === "error") {
          console.error("Worker error:", error);
          setStatus("idle");
          setDebugText(`Error: ${error}`);
          alert(`AI Error: ${error}`);
        }
      };

      // Load model on mount
      workerRef.current.postMessage({ type: "load" });
    } catch (err: any) {
      console.error("Worker creation failed:", err);
      setDebugText(`Worker failed: ${err.message}`);
    }

    return () => {
      URL.revokeObjectURL(url);
      workerRef.current?.terminate();
    };
  }, [file]);

  // Sync captions with video time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Find active caption
    const active = captions.find(c => time >= c.timestamp[0] && time <= c.timestamp[1]);
    if (active) {
      // Find exact word if available
      if (active.words) {
        const activeWord = active.words.find(w => time >= w.start && time <= w.end);
        if (activeWord) {
          // Highlight active word
          const highlightedText = active.words.map(w => 
            time >= w.start && time <= w.end 
              ? `<span style="color: #ffb800; transform: scale(1.1); display: inline-block;">${w.text}</span>` 
              : w.text
          ).join("");
          setActiveCaption(highlightedText);
          return;
        }
      }
      setActiveCaption(active.text);
    } else {
      setActiveCaption("");
    }
  };

  const extractAudio = async () => {
    // If we're already loading the model, don't overwrite the state yet
    const wasLoadingModel = status === "loading_model";
    if (!wasLoadingModel) setStatus("extracting");
    setDebugText("Starting audio extraction...");
    
    try {
      // Small timeout to allow UI to update
      await new Promise(r => setTimeout(r, 100));
      
      setDebugText("Decoding audio from video file (may take 10-20s)...");
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setDebugText("Audio decoded. Converting to mono...");
      const float32Array = audioBuffer.getChannelData(0);
      
      // If we were loading the model, we can now set status to extracting since audio is ready to send
      if (wasLoadingModel) setStatus("extracting");

      setDebugText("Sending audio to AI Worker...");
      // Send to worker
      workerRef.current?.postMessage(
        { type: "generate", audio: float32Array }, 
      );
    } catch (err: any) {
      console.error("Audio extraction failed:", err);
      setStatus("idle");
      setDebugText(`Audio extraction failed: ${err.message}`);
      alert("Failed to read audio from this video. Please try a different MP4 file.");
    }
  };

  const handleEditCaption = (index: number, newText: string) => {
    const newCaptions = [...captions];
    newCaptions[index].text = newText;
    setCaptions(newCaptions);
  };

  return (
    <div className={styles.studioContainer}>
      <div className={styles.header}>
        <h2>Studio Editor ✨</h2>
        <button onClick={onCancel} className={styles.closeBtn}><MdClose size={24} /></button>
      </div>

      <div className={styles.mainArea}>
        {/* Left: Video Player */}
        <div className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                className={styles.videoElement}
                onTimeUpdate={handleTimeUpdate}
                onClick={() => {
                  if (videoRef.current?.paused) videoRef.current.play();
                  else videoRef.current?.pause();
                  setIsPlaying(!videoRef.current?.paused);
                }}
              />
            )}
            
            {/* Dynamic Reels/TikTok Style Overlay */}
            {activeCaption && (
              <div 
                className={styles.captionOverlay}
                dangerouslySetInnerHTML={{ __html: activeCaption }}
              />
            )}

            <div className={styles.videoControls}>
               <button onClick={() => {
                  if (videoRef.current?.paused) videoRef.current.play();
                  else videoRef.current?.pause();
                  setIsPlaying(!videoRef.current?.paused);
               }} className={styles.playBtn}>
                 {isPlaying ? <MdPause size={20} /> : <MdPlayArrow size={20} />}
               </button>
               <span className={styles.timeDisplay}>
                 {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
               </span>
            </div>
          </div>
        </div>

        {/* Right: Captions / AI Controls */}
        <div className={styles.sidebar}>
          {status === "idle" && captions.length === 0 && (
            <div className={styles.emptyState}>
              <MdOutlineAutoFixHigh size={48} className={styles.iconGhost} />
              <h3>Generate Auto Captions</h3>
              <p>Extract audio and generate captions using purely local, private AI models in your browser.</p>
              <Button onClick={extractAudio} className={styles.generateBtn}>
                <MdOutlineAutoFixHigh /> Generate Now
              </Button>
            </div>
          )}

          {status === "loading_model" && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <h3>Loading AI Model...</h3>
              <p>Downloading lightweight AI model (First time only).</p>
              <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }}/></div>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>{debugText}</p>
            </div>
          )}

          {(status === "extracting" || status === "generating") && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <h3>{status === "extracting" ? "Extracting Audio..." : "Generating Captions..."}</h3>
              <p>{status === "extracting" ? "Reading audio data from video..." : "AI is analyzing speech..."}</p>
              <p style={{ fontSize: '12px', color: '#ffb800', marginTop: '12px' }}>{debugText}</p>
            </div>
          )}

          {(status === "ready" || captions.length > 0) && (
            <div className={styles.captionsList}>
              <div className={styles.captionsHeader}>
                <h3>Subtitles</h3>
                <span className={styles.badge}>{captions.length} chunks</span>
              </div>
              <div className={styles.scrollArea}>
                {captions.map((cap, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.captionItem} ${currentTime >= cap.timestamp[0] && currentTime <= cap.timestamp[1] ? styles.activeItem : ''}`}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = cap.timestamp[0];
                        videoRef.current.play();
                      }
                    }}
                  >
                    <span className={styles.timestamp}>
                      {cap.timestamp[0].toFixed(1)}s - {cap.timestamp[1].toFixed(1)}s
                    </span>
                    <textarea 
                      className={styles.captionInput}
                      value={cap.text}
                      onChange={(e) => handleEditCaption(idx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.sidebarFooter}>
                <Button onClick={() => onUpload(file, captions)} className={styles.fullWidthBtn}>
                  <MdUpload /> Proceed to Upload
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
