"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Checking...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Login successful ✅");
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("role", data.user.role);

        switch (data.user.role) {
          case "artisan":
            router.push("/dashboard/artisan");
            break;
          case "buyer":
            router.push("/dashboard/buyer");
            break;
          case "admin":
            router.push("/dashboard/admin");
            break;
          default:
            router.push("/dashboard");
        }
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Home Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-full bg-black hover:bg-green-500 transition duration-300"
      >
        <Home className="w-6 h-6 text-white" strokeWidth={2} />
      </button>

      {/* Login Form */}
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold italic text-center text-blue-700 mb-6">LOGIN</h1>

        {/* Identifier */}
        <input
          type="text"
          placeholder="Mobile Number or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:ring-2 hover:ring-cyan-400 transition duration-300"
        />

        {/* Password with toggle */}
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:ring-2 hover:ring-cyan-400 transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Forget Password */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-sm text-gray-600 hover:text-red-600 hover:underline transition duration-300"
          >
            Forget Password?
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 active:bg-green-800 transition duration-300 shadow-md hover:shadow-lg"
        >
          Log In
        </button>

        {/* Message */}
        {message && <p className="text-center mt-2 text-gray-700 font-medium">{message}</p>}
      </form>
    </div>
  );
}
