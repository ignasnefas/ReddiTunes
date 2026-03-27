import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production build
  productionBrowserSourceMaps: false,
  
  // Configure headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          }
        ]
      }
    ];
  },

  // Suppress hydration warnings from dynamic imports
  reactStrictMode: true,
};

export default nextConfig;
