import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Craft from "@/lib/models/Craft";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use 'req.url' safely with URL constructor
    const url = new URL(req.url);
    const artisanId = url.searchParams.get("artisanId");

    if (!artisanId) {
      return NextResponse.json({ error: "No artisan ID provided" }, { status: 400 });
    }

    // Fetch crafts belonging ONLY to this artisan
    const crafts = await Craft.find({ artisanId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, crafts });
  } catch (error: any) {
    console.error("Error fetching crafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch crafts", details: error.message },
      { status: 500 }
    );
  }
}
