"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Eye, EyeOff } from "lucide-react";

interface SignupForm {
  name: string;
  email: string;
  mobile: string;
  otp: string;
  password: string;
  role: "none" | "artisan" | "buyer" | "admin";
}

interface FieldErrors {
  name?: string;
  email?: string;
  mobile?: string;
  otp?: string;
  password?: string;
  role?: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    mobile: "",
    otp: "",
    password: "",
    role: "none",
  });

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showOtpInfo, setShowOtpInfo] = useState(false);

  // One-time alert
  useEffect(() => {
    if (typeof window !== "undefined") {
      const alreadyShown = sessionStorage.getItem("techAlertShown");
      if (!alreadyShown) {
        alert("Sorry, there was some technical problem. Now it is OK.");
        sessionStorage.setItem("techAlertShown", "true");
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (timer > 0) {
      timerId = setTimeout(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timerId);
  }, [timer]);

  // ========================= OTP HANDLERS =========================
  const sendOtp = () => setShowOtpInfo(true);

  const confirmOtpInfo = async () => {
    setShowOtpInfo(false);

    // Validation
    if (!form.mobile && !form.email) {
      setFieldErrors({ mobile: "Please enter mobile or email" });
      return;
    }
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) {
      setFieldErrors({ mobile: "Please enter a valid 10-digit mobile number" });
      return;
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setFieldErrors({ email: "Please enter a valid email address" });
      return;
    }

    setOtpLoading(true);
    setError("");
    setFieldErrors({});
    setOtpVerified(false);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.mobile, email: form.email }),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setOtpSent(true);
        setForm({ ...form, otp: "" });
        setTimer(60);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong while sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async (otpValue: string) => {
    if (!otpValue || otpValue.length < 6) return;

    const identifier = form.mobile || form.email;
    setOtpVerified(false);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp: otpValue }),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setOtpVerified(true);
        setFieldErrors({});
        setError("");
        setTimer(0);
      } else {
        setOtpVerified(false);
        setFieldErrors({ otp: data.error || "Invalid OTP" });
      }
    } catch (err: unknown) {
      setOtpVerified(false);
      setFieldErrors({ otp: err instanceof Error ? err.message : "Something went wrong while verifying OTP" });
    }
  };

  // ========================= VALIDATION =========================
  const validateFields = () => {
    const newErrors: FieldErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Za-z\s]+$/.test(form.name)) newErrors.name = "Name must contain letters only";

    if (!form.email.trim()) newErrors.email = "Email is required";

    if (!form.mobile.match(/^\d{10}$/)) newErrors.mobile = "Please enter a valid 10-digit mobile number";

    if (!otpSent) newErrors.otp = "Please send OTP first";
    if (!form.otp.trim()) newErrors.otp = "Please enter the OTP";
    if (!otpVerified) newErrors.otp = "OTP not verified";

    if (!/^\d{7}$/.test(form.password)) newErrors.password = "Password must be exactly 7 digits";

    if (form.role === "none") newErrors.role = "Please select a role";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================= SIGNUP =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSignupSuccess(true);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ========================= SUCCESS SCREEN =========================
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-lg p-10 flex flex-col items-center space-y-6 max-w-sm w-full"
        >
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-green-500 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-green-700">
            Successfully signed up
          </h2>

          <div className="flex gap-4">
            <button
              type="button"
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
      {/* Home Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push("/")}
          className="relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300
                     bg-black hover:bg-green-500 active:bg-green-500"
        >
          <Home className="w-6 h-6 text-white transition-colors duration-300" strokeWidth={2} />
          <span className="absolute inset-0 rounded-full border-2 border-green-500 opacity-0 active:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* OTP Info Modal */}
      {showOtpInfo && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
            <p className="text-gray-800">
              OTP will be sent on both mobile and email. Enter any OTP to get verified.
              <br />
              Mobile OTP works for only one number because free Twilio account is used. Prefer email OTP.
            </p>
            <button
              onClick={confirmOtpInfo}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl p-5 flex flex-col"
      >
        <h1 className="text-3xl font-bold italic text-center mb-4 text-blue-900">
          Create Your Account
        </h1>

        <form className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold italic text-blue-900">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z\s]*$/.test(value)) setForm({ ...form, name: value });
              }}
              className={`w-full px-2.5 py-1.5 rounded-md border text-blue-900 text-sm ${
                fieldErrors.name ? "border-red-500" : "bg-white/90"
              }`}
            />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold italic text-blue-900">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-md border text-blue-900 text-sm ${
                fieldErrors.email ? "border-red-500" : "bg-white/90"
              }`}
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-bold italic text-blue-900">
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={form.mobile}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) setForm({ ...form, mobile: value });
              }}
              disabled={otpSent && timer > 0}
              className={`w-full px-2.5 py-1.5 rounded-md border text-blue-900 text-sm ${
                fieldErrors.mobile
                  ? "border-red-500"
                  : otpSent && timer > 0
                  ? "opacity-60 cursor-not-allowed bg-white/90"
                  : "bg-white/90"
              }`}
            />
            {fieldErrors.mobile && <p className="text-xs text-red-500 mt-1">{fieldErrors.mobile}</p>}
          </div>

          {/* OTP Input & Button */}
          <div className="relative">
            <label className="block text-sm font-bold italic text-blue-900">
              Enter OTP <span className="text-red-600">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter OTP"
                value={form.otp}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setForm({ ...form, otp: value });
                    verifyOtp(value);
                  }
                }}
                disabled={!otpSent}
                className={`flex-1 px-2.5 py-1.5 pr-10 rounded-md border text-blue-900 text-sm ${
                  fieldErrors.otp
                    ? "border-red-500"
                    : !otpSent
                    ? "bg-gray-100 opacity-60 cursor-not-allowed"
                    : "bg-white/90"
                }`}
              />
              {otpVerified && (
                <span className="absolute right-2 flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
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
            {fieldErrors.otp && <p className="text-xs text-red-500 mt-1">{fieldErrors.otp}</p>}

            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading || timer > 0}
                className={`px-4 py-1.5 rounded-md text-white text-sm transition disabled:opacity-50 ${
                  otpSent ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-400 hover:bg-teal-500"
                }`}
              >
                {otpLoading
                  ? "Processing..."
                  : otpSent && timer > 0
                  ? `Resend OTP (${timer}s)`
                  : otpSent
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-bold italic text-blue-900 mb-1">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="7-digit password"
                value={form.password}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,7}$/.test(value)) setForm({ ...form, password: value });
                }}
                className={`w-full pr-10 px-2.5 py-1.5 rounded-md border text-blue-900 text-sm ${
                  fieldErrors.password ? "border-red-500" : "bg-white/90"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold italic text-blue-900">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "none" | "artisan" | "buyer" | "admin" })}
              className="w-full px-2.5 py-1.5 rounded-md border bg-white/90 text-blue-900 text-sm"
            >
              <option value="none">None</option>
              <option value="artisan">Artisan</option>
              <option value="buyer">Buyer</option>
              <option value="admin">Admin</option>
            </select>
            {fieldErrors.role && <p className="text-xs text-red-500 mt-1">{fieldErrors.role}</p>}
          </div>

          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}

          {/* Submit */}
          <div className="mt-4">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-400 to-blue-600 text-white py-2 rounded-md hover:opacity-90 text-sm disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
