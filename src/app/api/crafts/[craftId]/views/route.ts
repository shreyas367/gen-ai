import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Craft from "@/lib/models/Craft";

interface RouteParams {
  params: { craftId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { craftId } = params;
    const { buyerId }: { buyerId: string } = await req.json();

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: "Buyer not logged in" },
        { status: 401 }
      );
    }

    // Increment views only if buyer hasn't viewed it yet
    const updatedCraft = await Craft.findOneAndUpdate(
      { _id: craftId, viewedBy: { $ne: buyerId } },
      {
        $inc: { views: 1 },
        $push: { viewedBy: buyerId }
      },
      { new: true }
    );

    if (!updatedCraft) {
      return NextResponse.json(
        { success: false, error: "Craft not found or already viewed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, views: updatedCraft.views });
  } catch (err: unknown) {
    console.error("Error updating views:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
