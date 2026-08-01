import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.89.174.122", "192.168.1.252"],
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
      allowedOrigins: [
        "localhost:3099",
        "192.168.1.252:3099",
        "100.89.174.122:3099",
      ],
    },
  },
};

export default nextConfig;
