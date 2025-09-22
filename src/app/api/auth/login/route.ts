import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    // Connect to database
    await dbConnect();

    const { identifier, password } = await req.json();

    // Check required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Only support email login for now
    const user = await User.findOne({ email: identifier });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your account with OTP before logging in" },
        { status: 401 }
      );
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Return success response
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      role: user.role, // top-level role for frontend convenience
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
