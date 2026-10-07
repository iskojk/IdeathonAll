/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['ideathon.anahtarfikirler.com', 'localhost'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Disable TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ensure JavaScript is used
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Build optimization
  output: 'standalone',
  generateEtags: false,

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }

    // Add polyfills for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig
