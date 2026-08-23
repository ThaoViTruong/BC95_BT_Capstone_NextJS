import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
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
