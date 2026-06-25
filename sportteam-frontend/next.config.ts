import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL ?? "http://3.36.243.212";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
