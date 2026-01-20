import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'OpenHome';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true, // Helps with GitHub Pages routing
};

export default nextConfig;
