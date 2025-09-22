"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginResponse {
  user?: {
    id: string;
    name: string;
    role: string;
  };
  error?: string;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Mobile or Email
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Checking...");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data: LoginResponse = await res.json().catch(() => ({
        error: "Invalid server response",
      }));

      if (res.ok && data.user) {
        setMessage("Login successful ✅");

        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("role", data.user.role);

        // Redirect by role
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
        setMessage(data.error || "Invalid credentials ❌");
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h1
          className="text-3xl font-bold italic text-center mb-6 font-[Georgia]"
          style={{ color: "#00f" }}
        >
          LOGIN
        </h1>

        <input
          type="text"
          placeholder="Mobile Number or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoComplete="username"
          aria-label="Mobile number or email"
          className="w-full p-3 border rounded-xl mb-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:ring-2 hover:ring-cyan-400 transition duration-300"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          aria-label="Password"
          className="w-full p-3 border rounded-xl mb-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:ring-2 hover:ring-cyan-400 transition duration-300"
        />

        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-sm text-gray-600 hover:text-red-600 hover:underline transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Forget Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 shadow-md hover:shadow-lg"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {message && (
          <p className="text-center mt-4 text-gray-700 font-medium">{message}</p>
        )}
      </form>
    </div>
  );
}
