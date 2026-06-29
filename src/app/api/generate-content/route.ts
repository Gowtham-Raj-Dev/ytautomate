import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback mechanism to handle 503 (overloaded) and 404 (not found) errors
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ];
    
    let text = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = (await result.response).text();
        break; // Success, break out of loop
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        // If it's a rate limit error (429), don't fallback, just fail immediately
        if (err.status === 429 || (err.message && err.message.includes("429"))) {
          break;
        }
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for rate limit error or 503 server overloaded
    if (error.status === 429 || error.status === 503 || (error.message && (error.message.includes("429") || error.message.includes("503")))) {
      return NextResponse.json(
        { error: "LIMIT_REACHED", message: "Limit reached or server overloaded. Please come back later." },
        { status: error.status === 503 ? 503 : 429 }
      );
    }

    return NextResponse.json(
      { error: "GENERIC_ERROR", message: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
