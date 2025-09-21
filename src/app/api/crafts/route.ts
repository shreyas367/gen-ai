import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Craft from "@/lib/models/Craft";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { artisanId, title, description, imageUrl, price } = await req.json();

    // Validate required fields
    if (!artisanId || !title || !imageUrl || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (artisanId, title, imageUrl, price)" },
        { status: 400 }
      );
    }

    // Ensure price is a valid number
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number >= 0" },
        { status: 400 }
      );
    }

    const craft = await Craft.create({
      artisanId,
      title,
      description,
      imageUrl,
      price: parsedPrice,
    });

    return NextResponse.json({ success: true, craft });
  } catch (error) {
    console.error("Craft Save Error:", error);
    return NextResponse.json({ error: "Failed to save craft" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    // populate artisanId with both _id and name
    const crafts = await Craft.find()
      .sort({ createdAt: -1 })
      .populate("artisanId", "name _id");

    return NextResponse.json({ crafts });
  } catch (error) {
    console.error("Craft Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch crafts" }, { status: 500 });
  }
}