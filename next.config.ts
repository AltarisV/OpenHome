import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/OpenHome',
  assetPrefix: '/OpenHome/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
