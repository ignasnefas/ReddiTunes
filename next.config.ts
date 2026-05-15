import type { NextConfig } from "next";

const isAndroidBuild = process.env.BUILD_TARGET === 'android';
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig: NextConfig = {
  // Static export for Capacitor Android build and Electron
  ...(isAndroidBuild || isElectronBuild ? {
    output: 'export',
    distDir: 'out',
    images: { unoptimized: true },
  } : {}),

  // Optimize for production build
  productionBrowserSourceMaps: false,
  
  // Configure headers for API routes (only active in non-static mode)
  ...(!isAndroidBuild && !isElectronBuild && {
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
  }),

  // Suppress hydration warnings from dynamic imports
  reactStrictMode: true,
};

export default nextConfig;
