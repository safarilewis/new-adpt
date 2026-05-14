import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.app.github.dev",
    "*.preview.app.github.dev",
    "*.githubpreview.dev"
  ]
};

export default nextConfig;
