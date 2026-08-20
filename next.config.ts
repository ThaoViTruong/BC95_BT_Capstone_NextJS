import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "airbnbnew.cybersoft.edu.vn",
      },
    ],
  },
};

export default nextConfig;
