import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Favorite from "@/lib/models/Favorite";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { buyerId, craftId } = await req.json();

    const existing = await Favorite.findOne({ buyerId, craftId });
    if (existing) {
      await existing.deleteOne();
      return NextResponse.json({ success: true, message: "Unfavorited" });
    }

    const favorite = await Favorite.create({ buyerId, craftId });
    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error("Favorite Error:", error);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId required" }, { status: 400 });
    }

    const favorites = await Favorite.find({ buyerId }).populate("craftId");
    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Favorite Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}