import { NextResponse, type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

interface SignupRequestBody {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    // Connect to DB
    await dbConnect();

    const body: SignupRequestBody = await req.json();
    const { name, email, mobile, password, role } = body;

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

    // 3. Create new user
    const newUser = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      isVerified: true, // mark verified for now
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
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        error: "Signup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
