import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { topic, count } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an expert YouTube strategist. I need ${count || 10} catchy, highly engaging, and viral-worthy YouTube Shorts titles for the topic: "${topic}". 
    Rules:
    - Only return the titles, one per line.
    - Do not include numbers like "1. ", just the raw title string.
    - No markdown formatting, no bold text, no quotation marks.
    - Each title should be around 70 to 90 characters long for maximum impact.
    - Use emojis if they fit naturally.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const titles = text.split('\n').map(t => t.trim()).filter(t => t.length > 0);

    return NextResponse.json({ titles });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate titles" },
      { status: 500 }
    );
  }
}
