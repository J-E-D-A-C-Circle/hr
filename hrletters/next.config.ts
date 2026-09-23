import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    "10.80.51.55",
    "10.80.51.55:3005",
    "http://10.80.51.55:3005",
    "http://10.80.51.55",
    "172.20.10.2",
    "172.20.10.2:3005",
    "http://172.20.10.2:3005",
    "http://172.20.10.2",
    "localhost:3005",
    "127.0.0.1:3005",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
