import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CYBERSOFT_TOKEN:
      process.env.NEXT_PUBLIC_CYBERSOFT_TOKEN,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "airbnbnew.cybersoft.edu.vn",
      },
      {
        protocol: "https",
        hostname: "coresg-normal.trae.ai",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "dogolegia.vn",
      },
      {
        protocol: "https",
        hostname: "acihome.vn",
      },
    ],
  },
};

export default nextConfig;