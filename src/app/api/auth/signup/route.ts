// /api/auth/signup.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  role: "artisan" | "buyer" | "admin";
  otp: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body: SignupRequestBody = await req.json();
    const { name, email, password, role, otp } = body;

    if (!name || !email || !password || !role || !otp) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const now = new Date();

    // If user exists but not verified, verify OTP
    if (existingUser) {
      if (!existingUser.otp || !existingUser.otpExpiresAt || existingUser.otp !== otp || now > existingUser.otpExpiresAt) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = role;
      existingUser.isVerified = true;
      existingUser.otp = undefined;
      existingUser.otpExpiresAt = undefined;

      await existingUser.save();

      return NextResponse.json({ success: true, message: "Signup successful" });
    }

    // If user does not exist yet, assume OTP already verified on frontend
    const newUser = new User({
      name,
      email,
      password,
      role,
      isVerified: true,
    });

    await newUser.save();

    return NextResponse.json({ success: true, message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Signup failed", details: message }, { status: 500 });
  }
}
