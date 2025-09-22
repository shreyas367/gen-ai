// /api/auth/send-otp.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import nodemailer from "nodemailer";

interface SendOtpRequestBody {
  email: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body: SendOtpRequestBody = await req.json();

    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Find user or create new
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, isVerified: false });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Ensure email environment variables exist
    const { EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
      console.error("Email environment variables are missing");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send OTP via nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
    });

    return NextResponse.json({ success: true, message: "OTP sent successfully", otpExpiresAt });
  } catch (error) {
    console.error("Send OTP error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred while sending OTP";
    return NextResponse.json({ success: false, error: "Failed to send OTP", details: message }, { status: 500 });
  }
}
