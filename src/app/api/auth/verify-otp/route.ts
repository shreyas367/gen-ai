import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { identifier, otp } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json({ error: "Identifier and OTP are required" }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim();
    const trimmedOtp = otp.trim();

    // Find OTP record
    const otpRecord = await Otp.findOne({ identifier: trimmedIdentifier });
    if (!otpRecord) {
      return NextResponse.json({ error: "OTP not found or expired" }, { status: 404 });
    }

    // Check OTP value
    if (otpRecord.otp !== trimmedOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check expiry (10 minutes)
    const OTP_EXPIRY_MS = 10 * 60 * 1000;
    if (Date.now() - new Date(otpRecord.otpGeneratedAt).getTime() > OTP_EXPIRY_MS) {
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    // ✅ DO NOT create or update user here
    // Just return that OTP is valid
    return NextResponse.json({
      success: true,
      message: "OTP is correct. You can proceed to sign up.",
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Failed to verify OTP", details: error.message }, { status: 500 });
  }
}