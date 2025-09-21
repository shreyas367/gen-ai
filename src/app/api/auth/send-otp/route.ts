import { NextResponse, type NextRequest } from "next/server";
import twilio from "twilio";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp"; // OTP collection

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

interface OtpRequestBody {
  mobile: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body: OtpRequestBody = await req.json();
    const trimmedMobile = body.mobile?.trim();

    // 1. Validate mobile
    if (!trimmedMobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(trimmedMobile)) {
      return NextResponse.json(
        { error: "Mobile number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${trimmedMobile}: ${otp}`);

    // 3. Store OTP in collection
    await Otp.findOneAndUpdate(
      { mobile: trimmedMobile },
      { otp, otpGeneratedAt: new Date() },
      { upsert: true, new: true }
    );

    // 4. Send OTP via Twilio
    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${trimmedMobile}`,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: unknown) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      {
        error: "Failed to send OTP",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
