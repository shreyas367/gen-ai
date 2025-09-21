import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/lib/models/Message";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { artisanId, buyerId, content } = await req.json();

    if (!artisanId || !buyerId || !content) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const message = new Message({ artisanId, buyerId, content });
    await message.save();

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Message Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}