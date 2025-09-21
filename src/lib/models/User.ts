import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name?: string;
  email: string;
  mobile: string;
  password?: string;
  role: "artisan" | "buyer" | "admin";
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;

  comparePassword(candidatePassword: string): Promise<boolean>;
  verifyOtp(enteredOtp: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String },
    email: { type: String },
    mobile: { type: String, required: true, unique: true },

    // OTP and verification
    otp: { type: String }, // Stores the OTP
    otpExpiresAt: { type: Date }, // Expiry time for OTP
    isVerified: { type: Boolean, default: false }, // Verification status

    // Auth fields
    password: { type: String },

    role: {
      type: String,
      enum: ["artisan", "buyer", "admin"],
      default: "buyer",
    },
  },
  { timestamps: true }
);

//
// 1. Hash password before saving
//
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is modified or new

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

//
// 2. Compare entered password with hashed password
//
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

//
// 3. Verify OTP and update isVerified to true
//
userSchema.methods.verifyOtp = async function (
  enteredOtp: string
): Promise<boolean> {
  if (!this.otp || !this.otpExpiresAt) return false;

  const now = new Date();

  const isOtpValid = this.otp === enteredOtp && this.otpExpiresAt > now;
  if (isOtpValid) {
    this.isVerified = true; // ✅ Mark user as verified
    this.otp = undefined; // clear OTP after verification
    this.otpExpiresAt = undefined;
    await this.save();
    return true;
  }

  return false;
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;