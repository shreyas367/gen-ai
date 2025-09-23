import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/otp";
import SibApiV3Sdk from "@sendinblue/client";

// ✅ Configure Brevo (Sendinblue) client
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

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

    // ✅ Attempt email via Brevo
    if (email) {
      try {
        await brevoClient.sendTransacEmail({
          sender: {
            email: process.env.BREVO_FROM_EMAIL!,
            name: process.env.BREVO_FROM_NAME || "YourAppName",
          },
          to: [{ email }],
          subject: "Your OTP Code",
          htmlContent: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        });
        emailStatus = "Email sent";
        console.log("OTP email sent to:", email);
      } catch (err: any) {
        emailStatus = `Email failed: ${err.message}`;
        console.error("Brevo email failed:", err);
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
