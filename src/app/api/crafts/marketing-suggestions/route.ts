import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { title, imageUrl } = await req.json();

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
      Provide marketing advice for a handmade craft titled "${title}" with image URL: ${imageUrl}.
      Suggest a reasonable price in USD, bundle ideas, and promotion tips.
      Return as JSON: { "suggestedPrice": number, "promotionTips": "..." }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let suggestions;
    try {
      suggestions = response.text ? JSON.parse(response.text) : {};
    } catch {
      suggestions = { suggestedPrice: 100, promotionTips: "Bundle with related crafts" };
    }

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}