import { NextResponse } from "next/server";
import twilio from "twilio";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
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

    // Store OTP in DB
    await Otp.findOneAndUpdate(
      { identifier },
      { otp, otpGeneratedAt },
      { upsert: true, new: true }
    );

    let smsStatus = "";
    let emailStatus = "";

    // Send SMS if mobile exists
    if (mobile) {
      try {
        await twilioClient.messages.create({
          body: `Your OTP is ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${mobile}`,
        });
        smsStatus = "SMS sent";
      } catch (err: any) {
        smsStatus = `SMS failed: ${err.message}`;
        console.error("Twilio SMS failed:", err.message);
      }
    }

    // Send Email if email exists
    if (email) {
      try {
        const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL!, "CraftConnect");
        const recipients = [new Recipient(email, "User")];

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject("Your OTP Code")
          .setHtml(`<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`);

        await mailerSend.email.send(emailParams);

        emailStatus = "Email sent";
      } catch (err: any) {
        emailStatus = `Email failed: ${err.message}`;
        console.error("MailerSend email failed:", err.message);
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
      { error: "Failed to send OTP", details: err.message },
      { status: 500 }
    );
  }
}
