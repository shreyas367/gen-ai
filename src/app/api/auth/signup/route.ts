import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    // ✅ Connect to database
    await dbConnect();

    const { name, email, mobile, password, role } = await req.json();

    // 1. Validate required fields
    if (!name || !email || !mobile || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 2. Check if mobile number already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return NextResponse.json(
        { error: "Mobile number already registered" },
        { status: 400 }
      );
    }

    // 3. Create new user with raw password
    //    (Password will be hashed automatically by the pre-save hook in schema)
    const newUser = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      isVerified: true, // ✅ automatically mark as verified for now
    });

    // 4. Return success response
    return NextResponse.json({
      success: true,
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}