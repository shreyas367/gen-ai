import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

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

    let recommendations;
    try {
      recommendations = response.text ? JSON.parse(response.text) : [];
    } catch {
      recommendations = [];
    }

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}