import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "redesigned-space-halibut-w9q74x677r9hv697-3000.app.github.dev",
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost",
        "127.0.0.1",
        "*.app.github.dev",
        "*.preview.app.github.dev",
        "*.githubpreview.dev"
      ]
    }
  },
  allowedDevOrigins: [
    "*.app.github.dev",
    "*.preview.app.github.dev",
    "*.githubpreview.dev"
  ]
};

export default nextConfig;
