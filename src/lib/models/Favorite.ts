import mongoose, { Schema, models } from "mongoose";

const FavoriteSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    craftId: { type: Schema.Types.ObjectId, ref: "Craft", required: true },
  },
  { timestamps: true }
);

export default models.Favorite || mongoose.model("Favorite", FavoriteSchema);