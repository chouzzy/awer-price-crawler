import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.mlstatic.com' },
      { protocol: 'https', hostname: '**.mercadolivre.com' },
      { protocol: 'https', hostname: 'cf.shopee.com.br' },
    ],
  },
};

export default nextConfig;
