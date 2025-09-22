// /api/auth/verify-otp.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

interface VerifyOtpRequestBody {
  email: string;
  otp: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body: VerifyOtpRequestBody = await req.json();
    const { email, otp } = body;

    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    // Check OTP and expiry
    if (!user.otp || !user.otpExpiresAt || user.otp !== otp || now > user.otpExpiresAt) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });
    }

    // OTP is valid, optionally mark verified
    user.otpVerified = true; // Optional: track verification status
    await user.save();

    return NextResponse.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: "OTP verification failed", details: message }, { status: 500 });
  }
}
