import { NextResponse } from "next/server";
import twilio from "twilio";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { mobile, email } = body;
    const identifier = mobile?.trim() || email?.trim();

    if (!identifier) {
      return NextResponse.json({ error: "Mobile or email is required" }, { status: 400 });
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Mobile must be 10 digits" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpGeneratedAt = new Date();

    console.log(`Generated OTP for ${identifier}: ${otp}`);

    await Otp.findOneAndUpdate(
      { identifier },
      { otp, otpGeneratedAt },
      { upsert: true, new: true }
    );

    // Send SMS
    if (mobile) {
      try {
        await twilioClient.messages.create({
          body: `Your OTP is ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${mobile}`,
        });
        console.log(`OTP sent via SMS to ${mobile}`);
      } catch (err: any) {
        console.error("Twilio SMS failed:", err.message);
      }
    }

    // Send Email
    if (email) {
      try {
        await mailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Your OTP Code",
          html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        });
        console.log(`OTP sent via Email to ${email}`);
      } catch (err: any) {
        console.error("Email failed:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err: any) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP", details: err.message },
      { status: 500 }
    );
  }
}
