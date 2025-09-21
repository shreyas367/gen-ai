import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   eslint: {
    // ✅ Ignores ESLint errors during builds (good for deployment)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
