import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // Static HTML export for GitHub Pages
  basePath: isProd ? '/OpenHome' : '', // GitHub repo name
  assetPrefix: isProd ? '/OpenHome/' : '',
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
