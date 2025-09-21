"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Mobile or Email
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Checking...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }), // Using identifier (email or mobile)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful ✅");

        // ✅ Save user ID and name in localStorage
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("role", data.user.role);

        // ✅ Redirect based on role
        if (data.user.role === "artisan") {
          router.push("/dashboard/artisan");
        } else if (data.user.role === "buyer") {
          router.push("/dashboard/buyer");
        } else if (data.user.role === "admin") {
          router.push("/dashboard/admin");
        } else {
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
<div className="min-h-screen flex items-center justify-center bg-gray-100">
  <form
    onSubmit={handleLogin}
    className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
  >
    {/* Glowing Login Heading */}
    <h1
      className="text-3xl font-bold italic text-center mb-6 font-[Georgia]"
      style={{
        color: "#00f", // Same as your Create Account heading
      }}
    >
      LOGIN
    </h1>





        {/* Mobile or Email Input */}
        <input
          type="text"
          placeholder="Mobile Number or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full p-3 border rounded-xl mb-4 
                     text-black placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-cyan-500
                     hover:ring-2 hover:ring-cyan-400
                     transition duration-300"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border rounded-xl mb-2
                     text-black placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-cyan-500
                     hover:ring-2 hover:ring-cyan-400
                     transition duration-300"
        />

{/* Forget Password Link */}
<div className="flex justify-end mb-6">
  <button
    type="button"
    onClick={() => router.push("/auth/forgot-password")}
    className="text-sm text-gray-600 
               hover:text-red-600 hover:underline
               transform hover:scale-105 
               transition duration-300 ease-in-out"
  >
    Forget Password?
  </button>
</div>
        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-xl 
                     font-semibold text-lg
                     hover:bg-green-700 active:bg-green-800
                     transition duration-300 shadow-md hover:shadow-lg"
        >
          Log In
        </button>

        {/* Message Display */}
        {message && (
          <p className="text-center mt-4 text-gray-700 font-medium">{message}</p>
        )}
      </form>
    </div>
  );
}