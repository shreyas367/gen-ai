import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart from "@/lib/models/Cart";

// Add to cart
export async function POST(req: Request) {
  await dbConnect();
  try {
    const { buyerId, productId, quantity } = await req.json();
    if (!buyerId || !productId) {
      return NextResponse.json({ error: "buyerId and productId required" }, { status: 400 });
    }

    let cartItem = await Cart.findOne({ buyerId, productId });
    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({ buyerId, productId, quantity: quantity || 1 });
      await cartItem.save();
    }

    return NextResponse.json({ success: true, cartItem });
  } catch (error) {
    console.error("Cart Error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

// Get cart items
export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    if (!buyerId) return NextResponse.json({ error: "buyerId required" }, { status: 400 });

    const items = await Cart.find({ buyerId })
      .populate({ path: "productId", model: "Craft", select: "title price" })
      .lean();

    const formattedItems = items.map((item) => ({
      _id: item._id,
      quantity: item.quantity,
      productId: item.productId,
    }));

    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error) {
    console.error("Cart Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// Update quantity in cart
export async function PUT(req: Request) {
  await dbConnect();
  try {
    const { buyerId, productId, type } = await req.json();
    if (!buyerId || !productId || !type)
      return NextResponse.json({ error: "buyerId, productId, and type required" }, { status: 400 });

    const cartItem = await Cart.findOne({ buyerId, productId });
    if (!cartItem) return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });

    if (type === "inc") cartItem.quantity += 1;
    else if (type === "dec") cartItem.quantity = Math.max(1, cartItem.quantity - 1);

    await cartItem.save();
    return NextResponse.json({ success: true, cartItem });
  } catch (error) {
    console.error("Cart Update Error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

// Delete from cart
export async function DELETE(req: Request) {
  await dbConnect();
  try {
    const { buyerId, productId } = await req.json();
    if (!buyerId || !productId) return NextResponse.json({ error: "buyerId and productId required" }, { status: 400 });

    await Cart.findOneAndDelete({ buyerId, productId });
    return NextResponse.json({ success: true, message: "Removed from cart" });
  } catch (error) {
    console.error("Cart Delete Error:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}