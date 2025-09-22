import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { MailerSend, EmailParams, Attachment, EmailSettings, Recipient, Sender } from "mailersend";
import { Personalization } from "mailersend/lib/modules/Email.module";

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

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, isVerified: false });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    const { MAILERSEND_API_KEY, MAILERSEND_FROM_EMAIL } = process.env;
    if (!MAILERSEND_API_KEY || !MAILERSEND_FROM_EMAIL) {
      console.warn("MailerSend env not set. OTP not sent via email.");
    } else {
      const mailer = new MailerSend({ apiKey: MAILERSEND_API_KEY });

      const emailParams: EmailParams = {
        from: { name: "Your App Name", email: MAILERSEND_FROM_EMAIL },
        to: [{ name: email, email }],
        subject: "Your OTP Code",
        html: `<h2>OTP Verification</h2><h1>${otp}</h1><p>Expires in 10 minutes</p>`,
        text: "",
        send_at: 0,
        setFrom: function (from: Sender): EmailParams {
          throw new Error("Function not implemented.");
        },
        setTo: function (to: Recipient[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setCc: function (cc: Recipient[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setBcc: function (bcc: Recipient[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setReplyTo: function (replyTo: Recipient): EmailParams {
          throw new Error("Function not implemented.");
        },
        setInReplyTo: function (inReplyTo: string): EmailParams {
          throw new Error("Function not implemented.");
        },
        setSubject: function (subject: string): EmailParams {
          throw new Error("Function not implemented.");
        },
        setText: function (text: string): EmailParams {
          throw new Error("Function not implemented.");
        },
        setHtml: function (html: string): EmailParams {
          throw new Error("Function not implemented.");
        },
        setSendAt: function (sendAt: number): EmailParams {
          throw new Error("Function not implemented.");
        },
        setAttachments: function (attachments: Attachment[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setTemplateId: function (id: string): EmailParams {
          throw new Error("Function not implemented.");
        },
        setTags: function (tags: string[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setPersonalization: function (personalization: Personalization[]): EmailParams {
          throw new Error("Function not implemented.");
        },
        setPrecedenceBulk: function (precedenceBulk: boolean): EmailParams {
          throw new Error("Function not implemented.");
        },
        setSettings: function (settings: EmailSettings): EmailParams {
          throw new Error("Function not implemented.");
        },
        setListUnsubscribe: function (listUnsubscribe: string): EmailParams {
          throw new Error("Function not implemented.");
        }
      };

      await mailer.email.send(emailParams);
      console.log(`OTP sent to ${email} via MailerSend`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP generated successfully",
      otpExpiresAt: otpExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: "Failed to send OTP", details: message }, { status: 500 });
  }
}
