/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
    NEXT_PUBLIC_ADMIN_SECRET: process.env.NEXT_PUBLIC_ADMIN_SECRET || '',
  },
};
module.exports = nextConfig;
