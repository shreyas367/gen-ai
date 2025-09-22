import mongoose, { Schema, models } from "mongoose";

const otpSchema = new Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpGeneratedAt: {
    type: Date,
    default: Date.now,
  },
  otpExpiresAt: {
    type: Date,
    required: true,
  },
});

const Otp = models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
