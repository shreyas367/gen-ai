// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/lib/models/Order";
import Cart from "@/lib/models/Cart";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { buyerId, items, total, delivery } = await req.json();

    if (!buyerId || !items || items.length === 0 || !delivery) {
      return NextResponse.json(
        { error: "buyerId, items, total, and delivery details are required" },
        { status: 400 }
      );
    }

    // Save order
    const order = new Order({
      buyerId,
      items,
      total,
      delivery,
      status: "Pending",
      createdAt: new Date(),
    });

    await order.save();

    // Clear buyer's cart
    await Cart.deleteMany({ buyerId });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Order Error:", err);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}