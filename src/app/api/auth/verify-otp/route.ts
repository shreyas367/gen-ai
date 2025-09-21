import { NextResponse, type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";

interface VerifyOtpRequestBody {
  mobile: string;
  otp: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body: VerifyOtpRequestBody = await req.json();
    const trimmedMobile = body.mobile?.trim();
    const trimmedOtp = body.otp?.trim();

    // Validate inputs
    if (!trimmedMobile || !trimmedOtp) {
      return NextResponse.json(
        { error: "Mobile and OTP are required" },
        { status: 400 }
      );
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ mobile: trimmedMobile });
    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP not found or expired" },
        { status: 404 }
      );
    }

    // Validate OTP
    if (otpRecord.otp !== trimmedOtp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check expiry (5 min)
    const OTP_EXPIRY = 5 * 60 * 1000;
    if (Date.now() - new Date(otpRecord.otpGeneratedAt).getTime() > OTP_EXPIRY) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // OTP correct – remove OTP from DB
    await Otp.deleteOne({ mobile: trimmedMobile });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: unknown) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      {
        error: "Failed to verify OTP",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
