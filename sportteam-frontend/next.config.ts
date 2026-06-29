import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL ?? "http://3.36.243.212";

const nextConfig: NextConfig = {
  // 컨테이너 배포용 독립 실행(standalone) 번들 생성 (.next/standalone)
  output: "standalone",
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
