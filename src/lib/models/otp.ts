import mongoose, { Schema, model, models, Document } from "mongoose";

// Interface for TypeScript
export interface IOtp extends Document {
  email: string;
  code: string;
  verified: boolean;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Prevent recompilation errors in development or serverless deploys
const Otp = models.Otp || model<IOtp>("Otp", otpSchema);

export default Otp;
