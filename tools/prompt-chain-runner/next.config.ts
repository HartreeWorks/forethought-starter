import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions for form handling
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
