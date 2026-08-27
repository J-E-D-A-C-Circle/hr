import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    "10.80.51.55",
    "10.80.51.55:3002",
    "10.80.51.55:3000",
    "10.80.54.67",
    "10.80.54.67:3002",
    "localhost",
    "localhost:3002",
    "localhost:3000",
    "Constance",
    "Constance:3002",
  ],
};

export default nextConfig;
