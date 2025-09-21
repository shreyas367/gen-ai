import mongoose, { Schema, Document } from "mongoose";

export interface ICraft extends Document {
  artisanId: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number; // Added price field
}

const CraftSchema: Schema = new Schema(
  {
    artisanId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true}, // Price is required
    views: { type: Number, default: 0 }, // <-- Added views
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // NEW FIELD
  },
  { timestamps: true }
);

export default mongoose.models.Craft ||
  mongoose.model<ICraft>("Craft", CraftSchema);