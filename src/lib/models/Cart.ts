import mongoose, { Schema, model, models } from "mongoose";

const CartSchema = new Schema(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User", // assuming you have a User model
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Craft", // assuming crafts are stored in "Craft" collection
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

// Prevent recompilation errors in Next.js
const Cart = models.Cart || model("Cart", CartSchema);

export default Cart;