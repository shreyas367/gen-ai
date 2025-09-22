import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { identifier, otp } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, error: "Identifier and OTP are required" },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();
    const trimmedOtp = otp.trim();

    // 1. Find OTP record
    const otpRecord = await Otp.findOne({ identifier: trimmedIdentifier });
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "OTP not found or expired" },
        { status: 404 }
      );
    }

    // 2. Check OTP value
    if (otpRecord.otp !== trimmedOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // 3. Check expiry
    const now = Date.now();
    const expiresAt = otpRecord.otpExpiresAt
      ? new Date(otpRecord.otpExpiresAt).getTime()
      : new Date(otpRecord.otpGeneratedAt).getTime() + 10 * 60 * 1000;

    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Mark user as verified
    await User.findOneAndUpdate(
      { $or: [{ email: trimmedIdentifier }, { mobile: trimmedIdentifier }] },
      { isVerified: true }
    );

    // 5. Delete OTP record to prevent reuse
    await Otp.deleteOne({ identifier: trimmedIdentifier });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. User is now verified.",
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP", details: error.message },
      { status: 500 }
    );
  }
}
