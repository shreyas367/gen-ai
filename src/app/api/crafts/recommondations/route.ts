import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

interface RecommendationsRequestBody {
  userId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RecommendationsRequestBody = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const prompt = `
      Suggest 5 craft IDs that a user with ID ${userId} might like based on their past browsing and purchase behavior.
      Return the result as a JSON array like: ["craftId1", "craftId2", "craftId3", "craftId4", "craftId5"].
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let recommendations: string[] = [];
    try {
      if (response.text && typeof response.text === "string") {
        recommendations = JSON.parse(response.text);
      }
    } catch (parseError: unknown) {
      console.warn("Failed to parse AI recommendations, returning empty array", parseError);
      recommendations = [];
    }

    return NextResponse.json({ recommendations });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
