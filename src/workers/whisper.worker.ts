// Dynamic import wrapper to prevent Webpack/Next.js crashing the worker on load
let PipelineSingleton: any = null;

async function initPipeline() {
  if (PipelineSingleton) return PipelineSingleton;
  
  const { pipeline, env } = await import("@xenova/transformers");
  
  // Disable local models to fetch from Hugging Face Hub, but use browser cache
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  PipelineSingleton = class {
    static task: any = "automatic-speech-recognition";
    static model = "Xenova/whisper-tiny.en";
    static instance: any = null;

    static async getInstance(progress_callback?: (progress: any) => void) {
      if (this.instance === null) {
        this.instance = await pipeline(this.task, this.model, {
          progress_callback,
        });
      }
      return this.instance;
    }
  };
  return PipelineSingleton;
}

self.addEventListener("message", async (event) => {
  const { audio, type } = event.data;
  console.log(`[Worker] Received message type: ${type}`);

  if (type === "load") {
    try {
      self.postMessage({ status: "loading" });
      const P = await initPipeline();
      await P.getInstance((x: any) => {
        self.postMessage({ status: "progress", progress: x });
      });
      self.postMessage({ status: "ready" });
    } catch (err: any) {
      self.postMessage({ status: "error", error: err?.message || "Unknown error" });
    }
    return;
  }

  if (type === "generate") {
    console.log("[Worker] Starting generate process...");
    try {
      self.postMessage({ status: "processing" });
      console.log("[Worker] Getting pipeline instance...");
      const P = await initPipeline();
      const transcriber = await P.getInstance();
      
      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: "word", // This gets word-level timestamps! Very useful for Reels style
      });

      self.postMessage({
        status: "complete",
        result,
      });
    } catch (err: any) {
      self.postMessage({ status: "error", error: err?.message || "Unknown error" });
    }
  }
});
