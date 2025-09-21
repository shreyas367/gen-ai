import mongoose, { Schema, models } from "mongoose";

const otpSchema = new Schema({
  mobile: {
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
});

const Otp = models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;