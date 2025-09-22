import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
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
    console.log("Generated OTP:", otp, "for", identifier);

    // Store OTP in DB
    await Otp.findOneAndUpdate(
      { identifier },
      { otp, otpGeneratedAt },
      { upsert: true, new: true }
    );

    let smsStatus = "";
    let emailStatus = "";

    // ✅ Send SMS using direct fetch (no Twilio SDK)
    if (mobile) {
      try {
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: process.env.TWILIO_PHONE_NUMBER!,
              To: `+91${mobile}`,
              Body: `Your OTP is ${otp}`,
            }),
          }
        );
        smsStatus = "SMS sent";
      } catch (err: any) {
        smsStatus = `SMS failed: ${err.message}`;
        console.error("Twilio SMS failed:", err);
      }
    }

    // ✅ Send Email via Gmail
    if (email) {
      try {
        await mailTransporter.sendMail({
          from: process.env.GMAIL_FROM,
          to: email,
          subject: "Your OTP Code",
          html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        });
        emailStatus = "Email sent";
        console.log("OTP email sent to:", email);
      } catch (err: any) {
        emailStatus = `Email failed: ${err.message}`;
        console.error("Email failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP stored",
      smsStatus,
      emailStatus,
    });
  } catch (err: any) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP", details: err?.message || err },
      { status: 500 }
    );
  }
}
