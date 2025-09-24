import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";
import nodemailer from "nodemailer";

// ✅ Configure Nodemailer Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // app password
  },
});

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { mobile, email } = await req.json();
    const identifier = mobile?.trim() || email?.trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "Mobile or email is required" },
        { status: 400 }
      );
    }

    if (mobile && !/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Mobile must be 10 digits" },
        { status: 400 }
      );
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpGeneratedAt = new Date();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    console.log("Generated OTP:", otp, "for", identifier);

    // ✅ Store OTP in MongoDB
    await Otp.findOneAndUpdate(
      { identifier },
      { otp, otpGeneratedAt, otpExpiresAt },
      { upsert: true, new: true }
    );

    let smsStatus = "";
    let emailStatus = "";

    // ✅ Attempt SMS via Twilio
    if (mobile) {
      try {
        const smsRes = await fetch(
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

        if (!smsRes.ok) {
          const errorText = await smsRes.text();
          smsStatus = `SMS failed: ${errorText}`;
          console.error("Twilio SMS failed:", errorText);
        } else {
          smsStatus = "SMS sent";
        }
      } catch (err: any) {
        smsStatus = `SMS failed: ${err.message}`;
        console.error("Twilio SMS failed:", err);
      }
    }

    // ✅ Attempt email via Nodemailer
    if (email) {
      try {
        await transporter.sendMail({
          from: process.env.GMAIL_FROM, // e.g. "CraftConnect <your@gmail.com>"
          to: email,
          subject: "Your OTP Code",
          html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        });
        emailStatus = "Email sent";
        console.log("OTP email sent to:", email);
      } catch (err: any) {
        emailStatus = `Email failed: ${err.message}`;
        console.error("Nodemailer email failed:", err);
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
