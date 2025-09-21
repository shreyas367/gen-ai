import mongoose, { Schema, models } from "mongoose";
import { Content } from "next/font/google";

const MessageSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artisanId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Message || mongoose.model("Message", MessageSchema);