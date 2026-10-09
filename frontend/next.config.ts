import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false,
  // Keep development webpack output separate from production builds. Running
  // `next build` while the local dev server is open otherwise corrupts the
  // shared module manifests and causes runtime `__webpack_modules__` errors.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [{ source: '/api/:path*', destination: `${process.env.API_URL || 'http://127.0.0.1:8000'}/:path*` }];
  },
};
export default config;
