import { NextResponse } from "next/server";
import twilio from "twilio";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  throw new Error("Twilio environment variables are not set");
}

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
  throw new Error("Email environment variables are not set");
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { mobile, email } = await req.json();
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

    // Store OTP in DB
    await Otp.findOneAndUpdate(
      { identifier },
      { otp, otpGeneratedAt },
      { upsert: true, new: true }
    );

    // Send via Twilio SMS if mobile
    let smsStatus = null;
    if (mobile) {
      try {
        await twilioClient.messages.create({
          body: `Your OTP is ${otp}`,
          from: TWILIO_PHONE_NUMBER,
          to: `+91${mobile}`,
        });
        smsStatus = `OTP sent via SMS to ${mobile}`;
        console.log(smsStatus);
      } catch (err: any) {
        smsStatus = `Twilio SMS failed: ${err.message}`;
        console.error(smsStatus);
      }
    }

    // Send via email if email exists
    let emailStatus = null;
    if (email) {
      try {
        await mailTransporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: "Your OTP Code",
          html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        });
        emailStatus = `OTP sent via Email to ${email}`;
        console.log(emailStatus);
      } catch (err: any) {
        emailStatus = `Email failed: ${err.message}`;
        console.error(emailStatus);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent and stored in OTP collection",
      smsStatus,
      emailStatus,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error.message);
    return NextResponse.json({ error: "Failed to send OTP", details: error.message }, { status: 500 });
  }
}
