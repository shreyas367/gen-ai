import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse, Candidate, Content } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { artisanId, imageUrl, userTitle, userDescription, lang = "en" } = await req.json();

    if (!artisanId || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
Craft a title${userTitle ? `: "${userTitle}"` : ""}.
User description of craft: "${userDescription || "No description provided"}".
Write a creative description and suggest a reasonable price in USD for this handmade craft.
Translate the description into ${lang}.
Output strictly in JSON format with keys: "title", "description", "price" (number).
No extra text, no explanations.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    // Safely extract text from candidate
    let rawText: string = "";

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate?.content) {
      const content = firstCandidate.content;

      if (Array.isArray(content)) {
        // content is array of objects
        const textItem = content.find((c) => typeof c.text === "string");
        if (textItem) rawText = textItem.text;
      } else if ("text" in content && typeof content.text === "string") {
        rawText = content.text;
      }
    }

    rawText = rawText.trim();

    // Fallback craft data
    let craftData = {
      title: userTitle || "Warli Handpainted Pots",
      description: userDescription || "These pots are small with height 2-3 inch.Handmade and Handpainted by Indian craftsmen",
      price: 249,
    };

    try {
      const jsonMatch = rawText.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        craftData.title = parsed.title || craftData.title;
        craftData.description = parsed.description || craftData.description;
        craftData.price = parsed.price || craftData.price;
      }
    } catch (err) {
      console.warn("Failed to parse AI JSON response, using fallback", err);
    }

    if (userTitle) craftData.title = userTitle;

    return NextResponse.json({ craft: craftData });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}