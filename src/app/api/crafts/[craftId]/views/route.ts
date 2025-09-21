import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Craft from "@/lib/models/Craft";

interface Params {
  craftId: string;
}

export async function POST(req: Request, context: { params: Params }) {
  try {
    await dbConnect();

    const { craftId } = context.params;
    const { buyerId } = await req.json();

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: "Buyer not logged in" },
        { status: 401 }
      );
    }

    // Increment views only if buyer hasn't viewed it yet and is not artisan
    const updatedCraft = await Craft.findOneAndUpdate(
      { _id: craftId, viewedBy: { $ne: buyerId } }, // buyerId not in viewedBy
      {
        $inc: { views: 1 },          // increment views
        $push: { viewedBy: buyerId } // add buyerId to viewedBy
      },
      { new: true } // return updated document
    );

    if (!updatedCraft) {
      return NextResponse.json({ success: false, error: "Craft not found or already viewed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: updatedCraft.views });
  } catch (err) {
    console.error("Error updating views:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}