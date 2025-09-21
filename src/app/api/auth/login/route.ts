import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    // ✅ Connect to database
    await dbConnect();

    const { identifier, password } = await req.json();

    // Check required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/Mobile and password are required" },
        { status: 400 }
      );
    }

    // Determine if identifier is an email or mobile
    const isEmail = /\S+@\S+\.\S+/.test(identifier);

    // Find user by email OR mobile
    const user = await User.findOne(
      isEmail ? { email: identifier } : { mobile: identifier }
    );

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

    // Debugging logs for password comparison
    console.log("Entered Password:", password);
    console.log("Stored Hashed Password:", user.password);

    // // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password || "");
    console.log("Password Match Result:", isMatch);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ If everything is correct, return success response
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      role: user.role, // top-level role for frontend convenience
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}