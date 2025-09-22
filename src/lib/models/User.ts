import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// TypeScript interface for User
export interface IUser extends Document {
  name?: string;
  email: string;
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
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // OTP and verification
    otp: { type: String, trim: true },
    otpExpiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },

    // Authentication
    password: { type: String },

    role: {
      type: String,
      enum: ["artisan", "buyer", "admin"],
      default: "buyer",
    },
  },
  { timestamps: true }
);

// ---------------------------
// Pre-save hook: hash password
// ---------------------------
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// ---------------------------
// Compare entered password
// ---------------------------
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ---------------------------
// Verify OTP
// ---------------------------
userSchema.methods.verifyOtp = async function (
  enteredOtp: string
): Promise<boolean> {
  if (!this.otp || !this.otpExpiresAt) return false;

  const now = new Date();
  const isOtpValid = this.otp === enteredOtp && this.otpExpiresAt > now;

  if (isOtpValid) {
    this.isVerified = true;
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    await this.save();
    return true;
  }
  return false;
};

// Prevent model overwrite issues in serverless deployments
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
