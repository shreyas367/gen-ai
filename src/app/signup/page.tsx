"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Eye, EyeOff } from "lucide-react";

interface SignupForm {
  name: string;
  email: string;
  otp: string;
  password: string;
  role: "none" | "artisan" | "buyer" | "admin";
}

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    otp: "",
    password: "",
    role: "none",
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (timer > 0) {
      timerId = setTimeout(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timerId);
  }, [timer]);

  // ========================= OTP HANDLERS =========================
  const sendOtp = async () => {
    if (!form.email) {
      setError("Please enter email");
      return;
    }
    setOtpLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setTimer(60);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        setTimer(0);
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // ========================= SIGNUP HANDLER =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || form.role === "none") {
      setError("All fields are required");
      return;
    }
    if (!otpVerified) {
      setError("Please verify OTP first");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) setSignupSuccess(true);
      else setError(data.error || "Signup failed");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ========================= SUCCESS SCREEN =========================
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-100">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-lg p-10 flex flex-col items-center space-y-6 max-w-sm w-full"
        >
          <h2 className="text-2xl font-semibold text-green-700">Signup Successful!</h2>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
            >
              Continue to Login
            </button>
            <button
              onClick={() => router.push("/app")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========================= SIGNUP FORM =========================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-teal-100 to-blue-200 p-4 relative">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push("/")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black hover:bg-green-500"
        >
          <Home className="w-6 h-6 text-white" />
        </button>
      </div>

      <motion.div className="w-full max-w-md bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl p-5 flex flex-col">
        <h1 className="text-3xl font-bold italic text-center mb-4 text-blue-900">Create Your Account</h1>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-md border text-blue-900"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-md border text-blue-900"
          />

          <div className="flex gap-2 items-center">
            <input
              placeholder="Enter OTP"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              disabled={otpVerified}
              className={`flex-1 px-2.5 py-1.5 rounded-md border text-blue-900 ${
                otpVerified ? "border-green-500 bg-green-50" : "border-gray-300"
              }`}
            />

            <button
              type="button"
              onClick={sendOtp}
              disabled={otpLoading || timer > 0}
              className="px-3 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {otpSent && timer > 0 ? `Resend (${timer}s)` : otpSent ? "Resend OTP" : "Send OTP"}
            </button>

            <button
              type="button"
              onClick={verifyOtp}
              disabled={!otpSent || otpVerified || otpLoading}
              className="px-3 bg-green-500 text-white rounded-md disabled:opacity-50"
            >
              Verify
            </button>

            {otpVerified && (
              <span className="ml-2 w-5 h-5 flex items-center justify-center bg-green-500 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="7-digit password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-md border text-blue-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any })}
            className="w-full px-2.5 py-1.5 rounded-md border text-blue-900"
          >
            <option value="none">Select Role</option>
            <option value="artisan">Artisan</option>
            <option value="buyer">Buyer</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-400 to-blue-600 text-white py-2 rounded-md mt-3"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
