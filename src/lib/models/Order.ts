// src/models/Order.ts
import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema({
  buyerId: { type: String, required: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: "Craft", required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  total: { type: Number, required: true },
  delivery: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order = models.Order || model("Order", OrderSchema);
export default Order;