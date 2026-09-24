import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network IP access for testing on mobile handsets / other devices on Wi-Fi
  allowedDevOrigins: [
    "192.168.0.116",
    "192.168.*.*",
    "10.*.*.*",
    "localhost",
    "127.0.0.1",
  ],
  experimental: {
    swcPlugins: [],
    optimizePackageImports: ["drizzle-orm", "pg"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i1.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i2.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i3.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i4.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
