import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchDashboardVideos, type YTVideo } from "@/services/youtube";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

const CACHE_KEY = "yta_channel_videos_cache";
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface CacheData {
  timestamp: number;
  videos: YTVideo[];
}

export function ChannelVideos() {
  const { session } = useAuth();
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    async function loadVideos() {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cacheData = JSON.parse(cachedStr) as CacheData;
          if (Date.now() - cacheData.timestamp < CACHE_DURATION_MS) {
            if (active) {
              setVideos(cacheData.videos);
              setLoading(false);
            }
            return;
          }
        }
      } catch (err) {
        console.error("Cache read error:", err);
      }

      try {
        if (active) setLoading(true);
        const data = await fetchDashboardVideos(session!.accessToken);
        
        if (active) {
          setVideos(data);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), videos: data })
          );
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load channel videos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVideos();

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  if (!session?.accessToken) {
    return null;
  }

  const formatNumber = (num: string) => {
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary)" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.01 29.01 0 0 0 1 11.75a29.01 29.01 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29.01 29.01 0 0 0 .46-5.33 29.01 29.01 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff"/>
            </svg>
            Channel Overview
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>Your latest public uploads and statistics</p>
        </div>
        
        {videos.length > 0 && (
          <button 
            onClick={() => {
              localStorage.removeItem(CACHE_KEY);
              window.location.reload();
            }}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            </svg>
            Sync Data
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", height: "260px", borderRadius: "16px", border: "1px solid var(--border)", animation: "pulse 2s infinite ease-in-out", opacity: 0.5 }}></div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "20px", color: "var(--error)", textAlign: "center" }}>
          {error}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.5 }}>📭</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px" }}>No videos found</h3>
          <p style={{ color: "var(--text-secondary)" }}>Upload some videos to your YouTube channel to see them here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {videos.map((v, i) => (
            <motion.a
              href={`https://youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noreferrer"
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: "easeOut", duration: 0.4 }}
              style={{
                display: "block",
                textDecoration: "none",
                background: "var(--surface)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--border)",
                transition: "all 0.3s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)";
                const img = e.currentTarget.querySelector("img");
                if(img) img.style.transform = "scale(1.05)";
                const playBtn = e.currentTarget.querySelector(".play-btn") as HTMLElement;
                if(playBtn) {
                  playBtn.style.opacity = "1";
                  playBtn.style.transform = "translate(-50%, -50%) scale(1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
                const img = e.currentTarget.querySelector("img");
                if(img) img.style.transform = "scale(1)";
                const playBtn = e.currentTarget.querySelector(".play-btn") as HTMLElement;
                if(playBtn) {
                  playBtn.style.opacity = "0";
                  playBtn.style.transform = "translate(-50%, -50%) scale(0.9)";
                }
              }}
            >
              <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", position: "relative", overflow: "hidden" }}>
                <img 
                  src={v.thumbnail} 
                  alt="" 
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }} 
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", pointerEvents: "none" }}></div>
                
                {/* Play Button Overlay */}
                <div 
                  className="play-btn"
                  style={{ 
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(0.9)",
                    width: "48px", height: "48px", background: "rgba(255, 0, 0, 0.9)", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", opacity: 0,
                    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)", backdropFilter: "blur(4px)", boxShadow: "0 4px 12px rgba(255,0,0,0.3)"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "4px" }}>
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
                  {v.title}
                </h3>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {formatNumber(v.viewCount)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      {formatNumber(v.likeCount)}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "var(--surface-2)", padding: "4px 8px", borderRadius: "6px" }}>
                    {formatDate(new Date(v.publishedAt).getTime())}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}} />
    </div>
  );
}
